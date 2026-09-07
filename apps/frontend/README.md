# SeribuAsa Frontend

React, TypeScript, and Vite frontend for the SeribuAsa nutrition-donation platform.

## Prerequisites

- Node.js 20+
- npm 10+

## Development

From this directory:

```bash
npm install
npm run dev
```

The local app is served by Vite. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` when connecting to Supabase.

## Commands

```bash
npm run build      # Type-check and build the production bundle
npm run lint       # Run ESLint
npm run test:run   # Run unit tests once
npm run e2e        # Run Playwright end-to-end tests
```

See the repository [setup guide](../../docs/SETUP.md) for environment configuration and the [testing guide](../../docs/TESTING.md) for the full test workflow.
