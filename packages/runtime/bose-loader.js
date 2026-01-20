/**
 * BOSE LOADER (v2)
 * Handles resumability, error boundaries, and signal synchronization.
 */
(function () {
  const signalRegistry = new Map();

  // Global Sync Function called by Signals
  window.__BOSE_SYNC__ = (signalId, newValue) => {
    signalRegistry.set(signalId, newValue);
    // Find all elements listening to this signal
    document.querySelectorAll(`[bose\\:bind*="${signalId}"]`).forEach(el => {
        // Simple text update for PoC
        el.innerText = newValue;
    });
    console.log(`[Bose Sync] Signal ${signalId} updated to:`, newValue);
  };
  const handleEvent = async (event) => {
    // FIX: Select based on the specific event type (e.g. bose:on:click)
    const attrName = `bose:on:${event.type}`;
    // CSS selector needs escaping for colons: bose\:on\:click
    const selector = `[${attrName.replace(/:/g, '\\:')}]`;
    
    const target = event.target.closest(selector);
    if (!target) return;

    const actionAttr = target.getAttribute(attrName);
    if (!actionAttr) return;

    try {
      console.log(`[Bose] Intercepted ${event.type}. Loading: ${actionAttr}`);
      
      const stateStr = target.getAttribute('bose:state') || '{}';
      const state = JSON.parse(stateStr);

      // In the real world, actionAttr is the path to the chunk
      // Vite serves /chunks/id.js
      const module = await import('/' + actionAttr);
      const newState = await module.default(state, target);
      
      if (newState) {
        target.setAttribute('bose:state', JSON.stringify(newState));
        // FIX: Removed hardcoded target.innerText update. 
        // Signals will handle the view updates via __BOSE_SYNC__
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
