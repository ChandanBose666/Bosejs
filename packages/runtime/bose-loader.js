/**
 * BOSE LOADER (v2)
 * Handles resumability, error boundaries, and signal synchronization.
 * ES module — self-initializes on import via <script type="module">.
 *
 * Debug logging: set window.__BOSE_DEBUG__ = true (or localStorage.boseDebug = '1')
 * before this script loads to enable verbose output.
 */

const signalRegistry = new Map();
const moduleCache = new Map();
const stateCache = new WeakMap();

/** Log only when debug mode is active — silent in production by default. */
const debug = (...args) => {
  if (window.__BOSE_DEBUG__ || localStorage.getItem('boseDebug') === '1') {
    console.log('[Bose]', ...args);
  }
};

// ── Signal Synchronization ────────────────────────────────────────────────────

/**
 * Called by Signal.notify() whenever a reactive value changes.
 * Updates all DOM elements bound to this signal ID without re-rendering.
 */
window.__BOSE_SYNC__ = (signalId, newValue) => {
  signalRegistry.set(signalId, newValue);

  // 1. Text content bindings: <span bose:bind="signalId">
  //    Use textContent (not innerText) — avoids layout reflow on every update.
  document.querySelectorAll(`[bose\\:bind="${signalId}"]`).forEach(el => {
    el.textContent = newValue;
  });

  // 2. Style bindings: <div bose:bind:style="color:signalId">
  document.querySelectorAll('[bose\\:bind\\:style]').forEach(el => {
    const binding = el.getAttribute('bose:bind:style');
    const colonIdx = binding.indexOf(':');
    if (colonIdx === -1) return;
    const property = binding.slice(0, colonIdx);
    const boundId = binding.slice(colonIdx + 1).trim();
    if (boundId === signalId) {
      el.style[property] = newValue;
    }
  });

  // 3. State synchronization — keep bose:state attributes in sync so the
  //    next resumption picks up the latest signal value.
  document.querySelectorAll('[bose\\:state]').forEach(el => {
    let state;
    if (stateCache.has(el)) {
      state = stateCache.get(el);
    } else {
      try {
        const attr = el.getAttribute('bose:state');
        // Skip parsing if the signal key isn't mentioned at all (fast path).
        if (!attr || !attr.includes(signalId)) return;
        state = JSON.parse(attr);
      } catch { return; }
    }

    if (state && Object.prototype.hasOwnProperty.call(state, signalId)) {
      if (state[signalId] !== newValue) {
        state[signalId] = newValue;
        stateCache.set(el, state);
        el.setAttribute('bose:state', JSON.stringify(state));
      }
    }
  });

  debug(`Signal "${signalId}" →`, newValue);
};

// ── Event Handling ────────────────────────────────────────────────────────────

const handleEvent = async (event) => {
  // Guard: synthetic / programmatically dispatched events can have null targets.
  if (!event.target) return;

  const attrName = `bose:on:${event.type}`;
  const selector = `[${attrName.replace(/:/g, '\\:')}]`;

  const target = event.target.closest(selector);
  if (!target) return;

  const actionAttr = target.getAttribute(attrName);
  if (!actionAttr) return;

  // Prevent default for submit — the chunk handles the action entirely.
  if (event.type === 'submit') event.preventDefault();

  try {
    // Read state — prefer the in-memory cache over re-parsing the DOM attribute.
    let state;
    if (stateCache.has(target)) {
      state = stateCache.get(target);
    } else {
      const stateStr = target.getAttribute('bose:state') || '{}';
      state = JSON.parse(stateStr);
    }

    // Load the chunk — served from /chunks/<id>.js.
    // moduleCache avoids redundant network requests for repeated interactions.
    let mod;
    if (moduleCache.has(actionAttr)) {
      mod = moduleCache.get(actionAttr);
    } else {
      debug(`Loading chunk: ${actionAttr}`);
      mod = await import('/' + actionAttr);
      moduleCache.set(actionAttr, mod);
    }

    const newState = await mod.default(state, target, event);

    if (newState) {
      stateCache.set(target, newState);
      target.setAttribute('bose:state', JSON.stringify(newState));
    }
  } catch (error) {
    console.error('[Bose] Resumption error:', error);
    handleError(target, error);
  }
};

// ── Error Boundaries ──────────────────────────────────────────────────────────

const handleError = (element, error) => {
  // Walk up the tree to find the nearest error boundary.
  const boundary = element.closest('[bose\\:boundary]');

  if (boundary) {
    const boundaryId = boundary.getAttribute('bose:boundary');
    const fallbackTemplate = document.getElementById(`fallback_${boundaryId}`);

    if (fallbackTemplate) {
      boundary.innerHTML = fallbackTemplate.innerHTML;
      // Dispatch a catchable event so the app can log/report if needed.
      window.dispatchEvent(new CustomEvent('bose:error', {
        bubbles: false,
        detail: {
          message: error.message,
          boundaryId,
          recovered: true,
        },
      }));
      return;
    }
  }

  // No boundary found — dispatch an unrecovered error event.
  // Developers can listen for 'bose:error' on window to show a toast, log to
  // an error tracker, etc. We never call alert() or block the UI thread.
  window.dispatchEvent(new CustomEvent('bose:error', {
    bubbles: false,
    detail: {
      message: error.message,
      stack: error.stack,
      recovered: false,
    },
  }));
};

// ── Initialisation ────────────────────────────────────────────────────────────

// Event delegation — intercept at capture phase so bose:on:* attributes take
// precedence over any inline handlers on child elements.
['click', 'input', 'change', 'submit', 'keyup', 'keydown'].forEach(type => {
  window.addEventListener(type, handleEvent, { capture: true });
});

console.log(
  '%c Bose Runtime v2 ',
  'background: #6366f1; color: #fff; font-weight: bold; border-radius: 3px; padding: 2px 6px;',
);
