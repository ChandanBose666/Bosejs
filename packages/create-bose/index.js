#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectName = process.argv[2] || 'my-bose-app';
const targetDir = path.resolve(process.cwd(), projectName);

console.log(`🚀 Creating a new Bose framework app in ${targetDir}...`);

if (fs.existsSync(targetDir)) {
  console.error(`Error: Directory ${projectName} already exists.`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

// 1. Basic package.json for the new app
const packageJson = {
  name: projectName,
  version: "0.1.0",
  private: true,
  scripts: {
    "dev": "vite",
    "build": "vite build"
  },
  dependencies: {
    "bose": "latest",
    "vite": "^5.0.0"
  }
};

fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify(packageJson, null, 2));

// 2. Simple App Template
const appCode = `
export default function App() {
  const greeting = "Hello from your new Bose App!";
  const handleClick = $(() => alert(greeting));

  return \`
    <h1>Welcome to Bose</h1>
    <button bose:on:click="\${handleClick.chunk}" bose:state='{"greeting": "\${greeting}"}'>
      Click Me!
    </button>
  \`;
}
`;

fs.writeFileSync(path.join(targetDir, 'app.js'), appCode);

// 3. Vite Config Template
const viteConfig = `
import { defineConfig } from 'vite';
import bosePlugin from 'bose';

export default defineConfig({
  plugins: [bosePlugin()]
});
`;

fs.writeFileSync(path.join(targetDir, 'vite.config.js'), viteConfig);

console.log(`\n✅ Success! Run:`);
console.log(`   cd ${projectName}`);
console.log(`   npm install`);
console.log(`   npm run dev`);
