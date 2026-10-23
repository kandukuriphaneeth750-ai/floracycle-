# Flora Cycle — ready-to-run website

This is a self-contained, responsive frontend inspired by the Flora Cycle files you provided. It includes Home, Research (search + category filters), Prototypes, About, Safety, and Contact pages.

## Run it on your computer
1. Install Node.js (LTS) from the official Node.js website.
2. Extract this folder.
3. Open a terminal inside `flora-cycle-ready`.
4. Run `npm install`
5. Run `npm run dev`
6. Open the local address Vite prints (usually `http://localhost:5173`).

## Build for deployment
Run `npm run build`. Upload the generated `dist` folder to a static hosting service such as Netlify, Vercel, or GitHub Pages (for GitHub Pages, configure the base path if publishing under a repository subpath).

## Important limitations
- This package is a frontend demo and does not include the original project's API server or the private `@workspace/api-client-react` package.
- Sign-in, account management, admin editing, and real database-backed research/order records from the original `App.tsx` need a configured Clerk project and compatible backend API. They are not represented as working authentication here.
- The Contact form only validates locally and displays a message; it does not send or store an email.
- Prototype and research entries are illustrative frontend content. Replace them with reviewed project information before publishing.
- Original uploaded source files are preserved in `reference/` for reference.
