# Error Reference

BoseJS compiler errors have structured codes of the form `BOSE_EXXX`. Every error includes:

- A human-readable message with the source code frame
- The exact location (file, line, column)
- A **Suggestion** line telling you exactly how to fix it
- A **Docs** link: `https://bosejs.dev/docs/errors#bose_exxx`

---

## BOSE_E001 — Invalid `$()` usage

### What it means

`$()` must receive a function as its only argument. You passed something else (a variable, a method call result, a plain value, etc.).

### What triggers it

```js
// Wrong: passing a variable, not a function
const handler = () => { count.value++; };
const action = $(handler);           // BOSE_E001

// Wrong: passing a call result
const action = $(makeHandler());     // BOSE_E001

// Wrong: passing a value
const action = $(42);                // BOSE_E001
```

### How to fix it

Always pass an inline arrow function or function expression directly:

```js
// Correct
const action = $(() => {
  count.value++;
});

// Correct — async works too
const action = $(async () => {
  const data = await fetchSomething();
  result.value = data;
});
```

**Why the restriction**: `$()` is a compile-time marker. The compiler must see the function body literally at the call site so it can extract it into a chunk and analyse which variables to capture. A reference to an externally-defined function cannot be statically analysed.

---

## BOSE_E002 — Invalid `server$()` usage

### What it means

`server$()` must receive a function as its only argument.

### What triggers it

```js
// Wrong: passing a variable
const fn = async (id) => db.users.delete(id);
const deleteUser = server$(fn);          // BOSE_E002

// Wrong: passing a non-function
const deleteUser = server$('delete');    // BOSE_E002
```

### How to fix it

Pass an inline function directly:

```js
// Correct
const deleteUser = server$(async (id) => {
  const db = await connect();
  return await db.users.delete(id);
});
```

**Why the restriction**: `server$()` extracts the function body and registers it as a server-side action module. The function body must be visible at the call site so the compiler can determine what to strip from the client bundle.

---

## BOSE_E003 — Invalid `css$()` usage

### What it means

`css$()` must receive a string literal or template literal. Dynamic expressions, variables, or function calls are not allowed.

### What triggers it

```js
// Wrong: passing a variable
const myStyles = '.btn { color: red; }';
const styles = css$(myStyles);           // BOSE_E003

// Wrong: passing a function call
const styles = css$(getStyles());        // BOSE_E003

// Wrong: template literal with dynamic interpolation
const color = 'red';
const styles = css$(`.btn { color: ${color}; }`);  // BOSE_E003
```

### How to fix it

Pass a static string or a template literal with no dynamic expressions:

```js
// Correct — plain string
const styles = css$(`.btn { background: blue; color: white; }`);

// Correct — template literal (no interpolations)
const styles = css$(`
  .container { max-width: 800px; margin: 0 auto; }
  .heading { font-size: 2rem; color: #1e293b; }
`);
```

**Why the restriction**: `css$()` runs at compile time. It scopes class names by appending a deterministic hash suffix (e.g. `.btn-b3a1f2`). This requires knowing the full CSS string statically. Dynamic values cannot be hashed or scoped at compile time.

---

## BOSE_E000 — Generic compiler error

A catch-all code for unexpected compiler failures not covered by the above codes. The error message will contain the source frame and as much context as available.

If you encounter a `BOSE_E000` that seems like a bug in the compiler itself, please open an issue with the full error output.

---

## Reading the error output

A typical BoseJS compiler error looks like:

```
[BOSE_E001] The $( ) marker must contain a function.

  10 |   const action = $(myHandler);
                        ^^^^^^^^^^^^
  Location: src/pages/counter.js, line 10, col 18
  Suggestion: Wrap your event-handler logic in an arrow function: $(() => { ... })
  Docs: https://bosejs.dev/docs/errors#bose_e001
```

The source frame comes directly from Babel's `buildCodeFrameError`, so the caret (`^^^^`) points to the exact node that caused the problem.
