 What's Still Pending in Bosejs for General Developer Use                                                                                                                                                        
  P0 — Blockers (framework unusable without these)                                                       

  1. Production build is broken
  npm run build fails with Could not resolve entry module "index.html". Bosejs has no production build   
  path at all right now — it only works as a dev server. No deployment story means no real-world use.    

  2. $() chunks cannot close over css$() results
  The compiler extracts $() chunks but treats css$() return values as build-time constants that don't get
   carried into the chunk's closure. Any developer who instinctively writes:
  const styles = css$(`...`);
  export default function MyComponent() {
    const handleClick = $(async () => {
      btn.classList.add(styles.active); // ← undefined at runtime
    });
  }
  ...will get a silent undefined with no error. The workaround (data-added attributes) is a significant  
  DX regression. The compiler needs to either: (a) serialize css$() class name maps into bose:state, or  
  (b) detect this pattern at compile time and throw a useful error.

  ---
  P1 — High (painful friction for every developer)

  3. server$() double-import pattern is confusing
  To make server$() work, you currently need to import the module twice:
  import { addToCart } from "../lib/cartStore.js"; // top-level (SSR pass)

  const action = server$(async () => {
    const { addToCart } = await import("../lib/cartStore.js"); // inside body (runtime)
  });
  The top-level import exists only as a dummy for the SSR compiler pass — it's never actually called     
  server-side via that path. This is non-obvious, fragile, and produces confusing dead code. The
  framework should handle this transparently.

  4. bose:state serialization is hand-rolled and error-prone
  Components must manually JSON.stringify their state and escape HTML entities:
  bose:state="${state.replace(/"/g, '&quot;')}"
  There should be a bose:serialize helper or the runtime should handle serialization automatically. One  
  missed escape breaks hydration silently.

  5. @bosejs/core pins @bosejs/state@^0.1.x internally
  After upgrading @bosejs/state to 0.2.0, there are now two copies in node_modules — the top-level 0.2.0 
  (used by app code) and @bosejs/core's nested 0.1.3 (used internally). Any instanceof checks or shared  
  singletons between the two will silently diverge. Core needs to align its peer dependency to ^0.2.0.   

  ---
  P2 — Medium (discoverable workarounds exist, but developers will hit these)

  6. No TypeScript definitions
  All APIs (useSignal, server$(), $(), css$()) are plain JS with no .d.ts files. In 2026 this is a       
  non-starter for many teams — no autocomplete, no type checking on props, no IDE support.

  7. setSSRContext is undocumented and opt-in
  The new @bosejs/state@0.2.0 added setSSRContext for seeding signal values during SSR (so CartBadge     
  renders the real count on first load instead of 0). But there's no documentation, no prompt in the     
  scaffolder, and no example in the generated project. Every developer will ship a flash of wrong initial
   state until they discover it.

  8. Dynamic routes ([id].js) + error boundaries have no documented contract
  src/pages/product/[id].js uses a Progressive Error Boundary, but the framework doesn't document what   
  the error boundary API is, how to define fallback UI, or what props are passed. Developers have to     
  guess.

  9. No dev-time warning when css$() is used inside $()
  Since shortcoming #2 (css$() in $() chunks) is still broken, the minimum fix is a compile-time warning:
   "css$() result used inside $() chunk — class names will be undefined at runtime." Without this,       
  developers spend hours debugging silent failures.

  ---
  P3 — Low (polish, but expected for a stable framework)

  - No HMR for server$() actions — changing a server action requires a full restart
  - No CLI for adding pages/components (bose add page cart)
  - about.md embedded island pattern ($() inside Markdown) has no test coverage in the upgrade
  - Scaffold (npx create-bose) doesn't generate a .gitignore, README, or example test

  ---
  Priority Order for the Framework Author

  1. Fix production build (define Vite SSR build output + entry)
  2. Fix $() → css$() closure capture in compiler
  3. Align @bosejs/core peer dep to @bosejs/state@^0.2.0
  4. Eliminate server$() double-import pattern
  5. Add bose:state serialization helper
  6. Add TypeScript definitions
  7. Document setSSRContext + scaffold it into create-bose
  8. Add compile-time warning for css$() in $() chunks

  The framework's core innovation (resumable islands, $() optimizer, server$() RPC) is solid in concept  
  and mostly working after the 0.1.5/0.2.0 patch. The biggest gap right now is the production build —    
  without it, no real project can ship on Bosejs regardless of how clean the DX is.