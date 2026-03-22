# create-bose

> Scaffold a new [Bosejs](https://github.com/ChandanBose666/Bosejs) application instantly.

## Usage

```bash
npx create-bose my-app
cd my-app
npm install
npm run dev
```

Then open `http://localhost:5173`.

## What gets created

```
my-app/
├── src/
│   └── pages/
│       ├── index.js     # Home — signals, lazy chunks, css$(), bose:bind
│       └── about.md     # Docs — markdown routing with frontmatter
├── vite.config.js
├── package.json
└── .gitignore
```

## What the scaffold demonstrates

| Feature | Where |
|---|---|
| `useSignal` + `bose:bind` | `index.js` — counter synced to DOM |
| `$()` lazy chunk extraction | `index.js` — increment/decrement/reset |
| `css$()` scoped styles | `index.js` — all styling via css$() |
| `bose:state` serialization | `index.js` — state embedded in HTML |
| Markdown routing | `about.md` — `.md` file → `/about` route |
| File-based routing | Both pages — automatic URL mapping |

## License

MIT © [Bosejs Contributors](https://github.com/ChandanBose666/Bosejs)
