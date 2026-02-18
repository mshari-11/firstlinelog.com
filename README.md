# FirstLine Logistics

A modern logistics platform built with React, TypeScript, and Vite.

## Tech Stack

- **Vite** — Fast build tool
- **React 18** — UI framework
- **TypeScript** — Type safety
- **Tailwind CSS 4** — Utility-first styling
- **shadcn/ui** — Component library
- **Supabase** — Backend-as-a-Service
- **Zustand** — State management

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- npm (included with Node.js)

### Installation

```bash
git clone https://github.com/mshari-11/firstlinelog.com.git
cd firstlinelog.com
npm install
```

### Development

```bash
npm run dev
```

The dev server starts at `http://localhost:8080`.

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## VS Code Remote — Dev Container

This project includes a Dev Container configuration for a consistent development environment.

1. Install the **Dev Containers** extension in VS Code.
2. Open the Command Palette (`Ctrl+Shift+P`) and select **Dev Containers: Reopen in Container**.
3. The container will install dependencies automatically and forward port 8080.

## CI/CD

GitHub Actions runs on every push and pull request to `main`:

- **Lint** — `npm run lint`
- **Type check** — `npx tsc --noEmit -p tsconfig.app.json`
- **Build** — `npm run build`

## Development Workflow

1. Adjust theme styles in `src/index.css` and `tailwind.config.ts`
2. Plan pages and create folders under `src/pages/` with an `Index.tsx` entry
3. Configure routes in `App.tsx`
4. Build components in `src/components/` subdirectories
5. For complex pages, split into:
   - `Index.tsx` — entry point
   - `/components/` — page-specific components
   - `/hooks/` — custom hooks
   - `/stores/` — Zustand stores for complex state
6. Validate with: `npm run lint && npx tsc --noEmit -p tsconfig.app.json`

## Backend Integration

- Add API files in `src/api/` with exported TypeScript types (see `src/api/demo.ts`)
- Supabase operations must follow the defined types strictly
- When changing types, check all files that reference them

## Deployment

The project is configured for multiple platforms:

| Platform | Config |
|----------|--------|
| Vercel   | `vercel.json` |
| Netlify  | `netlify.toml` |
| Railway  | `railway.json` |
