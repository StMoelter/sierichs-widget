# AGENTS.md

Guidance for AI agents and contributors working in this repository.

## Project

- Name: sierichs-widget
- Purpose: Installable PWA showing whether Biergarten Sierich in Hamburg is open
- Technology stack: Vite + TypeScript, `vite-plugin-pwa`, Vercel Functions

## Commands

| Purpose | Command |
| --- | --- |
| Install | `npm install` |
| Develop | `npm run dev` |
| Build | `npm run build` |
| Typecheck | `npm run typecheck` |
| Unit tests | `npm test` |
| E2E tests | `npm run test:e2e` |
| Install E2E browser | `npm run test:e2e:install` |

The Vite dev and preview servers expose `/api/status` through the same handler
as Vercel. The E2E tests build the app and run against `vite preview`.

## Conventions

- Project language (code, identifiers, documentation, commit messages): English
- Keep changes small and focused
- Run `npm run typecheck`, `npm test`, and `npm run test:e2e` before completing a task
- Do not commit `dist/`, `node_modules/`, test artifacts, or `.vercel/`

## Status parsing

The upstream site renders `blub-open` or `blub-closed` inside the traffic light
markup. `src/shared/status.ts` is the single source of truth for parsing and
fetching. `api/status.ts` wraps it for Vercel. Keep the parser fixtures in
`tests/status.test.ts` in sync with real markup changes and prefer returning
`unknown` over guessing.

## Structure

```text
api/status.ts          Vercel Function for /api/status
src/main.ts            PWA UI and client-side state
src/shared/status.ts   Parser and upstream fetch
tests/                  Vitest unit tests
e2e/                    Playwright end-to-end tests
public/                 PWA icons
vite.config.ts          PWA config and local /api/status middleware
```

## Local Overrides

Personal preferences may live in `AGENTS.local.md`. That file is ignored by Git
and must not be committed.
