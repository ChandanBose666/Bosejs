/**
 * BOSE LOADER (PoC)
 * This script lives in the <head> and handles all user interactions.
 * It is 0-dependencies and ultra-lightweight.
 */
(function () {
  const handleEvent = async (event) => {
    const target = event.target.closest('[bose\\:on]');
    if (!target) return;

    const actionAttr = target.getAttribute(`bose:on:${event.type}`);
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
        // Simple DOM sync for PoC
        if (newState.count !== undefined) target.innerText = `Count is ${newState.count}`;
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
