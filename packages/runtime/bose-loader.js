/**
 * BOSE LOADER (v2)
 * Handles resumability, error boundaries, and signal synchronization.
 */
(function () {
  const signalRegistry = new Map();
  // Cache definitions must be at the top to be accessible by __BOSE_SYNC__
  const moduleCache = new Map();
  const stateCache = new WeakMap();

  // Global Sync Function called by Signals
  window.__BOSE_SYNC__ = (signalId, newValue) => {
    signalRegistry.set(signalId, newValue);
    
    // 1. Text Content Bindings match: bose:bind="signalId"
    document.querySelectorAll(`[bose\\:bind="${signalId}"]`).forEach(el => {
        el.innerText = newValue;
    });

    // 2. Style Bindings match: bose:bind:style="property:signalId"
    document.querySelectorAll(`[bose\\:bind\\:style]`).forEach(el => {
        const binding = el.getAttribute('bose:bind:style');
        const [property, boundId] = binding.split(':');
        if (boundId.trim() === signalId) {
             el.style[property] = newValue;
        }
    });

    // 3. State Synchronization (FIX for Decrement/Reset stale state)
    // Update bose:state on ALL elements that use this signal
    document.querySelectorAll('[bose\\:state]').forEach(el => {
        let state;
        // Check memory cache first
        if (stateCache.has(el)) {
            state = stateCache.get(el);
        } else {
            try {
                const attr = el.getAttribute('bose:state');
                // Optimization: Skip parsing if signalId isn't in string (simple check)
                if (!attr.includes(signalId)) return; 
                state = JSON.parse(attr);
            } catch (e) { return; }
        }

        // If this element's state contains the signal, update it
        if (state && Object.prototype.hasOwnProperty.call(state, signalId)) {
            // Only update if value actually changed
            if (state[signalId] !== newValue) {
                state[signalId] = newValue;
                stateCache.set(el, state);
                el.setAttribute('bose:state', JSON.stringify(state));
            }
        }
    });

    console.log(`[Bose Sync] Signal ${signalId} updated to:`, newValue);
  };

  const handleEvent = async (event) => {
    // FIX: Select based on the specific event type (e.g. bose:on:click)
    const attrName = `bose:on:${event.type}`;
    // CSS selector needs escaping for colons: bose\:on\:click
    const selector = `[${attrName.replace(/:/g, '\\:')}]`;
    
    // Performance: Use closest only if necessary, but here we scan from target up
    const target = event.target.closest(selector);
    if (!target) return;
    
    const actionAttr = target.getAttribute(attrName);
    if (!actionAttr) return;

    try {
      // Opt: 1. State Caching (Read from memory if available)
      let state;
      if (stateCache.has(target)) {
        state = stateCache.get(target);
      } else {
        const stateStr = target.getAttribute('bose:state') || '{}';
        state = JSON.parse(stateStr);
      }

      // Opt: 2. Module Caching (Avoid repeated imports)
      let module;
      if (moduleCache.has(actionAttr)) {
        module = moduleCache.get(actionAttr);
      } else {
        // In the real world, actionAttr is the path to the chunk
        // Vite serves /chunks/id.js
        console.log(`[Bose] Loading chunk: ${actionAttr}`);
        module = await import('/' + actionAttr);
        moduleCache.set(actionAttr, module);
      }

      const newState = await module.default(state, target);
      
      if (newState) {
        // Update Memory Cache
        stateCache.set(target, newState);
        // Persist to DOM for resumability (can be debounced if needed, but keeping sync for now)
        target.setAttribute('bose:state', JSON.stringify(newState));
      }
    } catch (error) {
      console.error(`[Bose] Resumption Error:`, error);
      handleError(target, error);
    }
  };

  const handleError = (element, error) => {
    const boundary = element.closest('[bose\\:boundary]');
    if (boundary) {
      const boundaryId = boundary.getAttribute('bose:boundary');
      const fallbackTemplate = document.getElementById(`fallback_${boundaryId}`);
      if (fallbackTemplate) {
        boundary.innerHTML = fallbackTemplate.innerHTML;
        return;
      }
    }
    // Global Fallback if no boundary found
    alert('Bose critical error: ' + error.message);
  };

  // Delegate all common events to the window
  ["click", "input", "change"].forEach((type) => {
    window.addEventListener(type, handleEvent, { capture: true });
  });

  console.log(
    "%c Bose Runtime Initialized (Zero JS Loaded) ",
    "background: #222; color: #bada55",
  );
})();
