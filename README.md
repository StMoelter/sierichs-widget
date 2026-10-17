# sierichs-widget

A small installable web app that shows whether the Biergarten Sierich in
Hamburg's Stadtpark is currently open. The status is read from the green/red
traffic light on [sierichs.de](https://www.sierichs.de/).

## Features

- Large green/red status indicator
- Last check time and manual refresh
- Last known status is cached and shown when offline
- Installable PWA for Android and iOS (no app store required)
- No tracking, no cookies, no accounts

## How it works

The Sierichs website renders the status server-side as `blub-open` or
`blub-closed`. Since the page does not send CORS headers, the browser cannot
read it directly. A small Vercel Function in `api/status.ts` fetches the page,
parses the marker, and returns a compact JSON response:

```json
{
  "state": "open",
  "open": true,
  "checkedAt": "2026-10-17T12:00:00.000Z",
  "source": "https://www.sierichs.de/"
}
```

The result is cached at the CDN for 60 seconds. The app itself is a static
Vite build.

## Tech stack

- Vite 8 + TypeScript
- `vite-plugin-pwa` (Workbox)
- Vitest for unit tests
- Playwright for end-to-end tests
- Vercel for hosting and the status function

## Development

```sh
npm install
npm run dev
```

The Vite dev server also exposes `/api/status` through the same handler used on
Vercel, so no separate backend is needed locally.

## Checks

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The first Playwright run needs a browser:

```sh
npm run test:e2e:install
```

## Deployment

1. Push the repository to GitHub.
2. Import it as a new project in Vercel.
3. Vercel detects Vite automatically.
4. The `api/status.ts` function is deployed alongside the static build.

The app is then available at `https://<project>.vercel.app`.

### Install on a phone

- **Android (Chrome):** open the URL, then choose "Install app" / "Add to Home
  screen".
- **iPhone (Safari):** open the URL, tap Share, then "Add to Home Screen".

A PWA cannot provide a native home-screen widget. The icon opens the status page
directly; push notifications on status changes are a possible follow-up.

## Data source

The status is scraped from the public homepage of
[sierichs.de](https://www.sierichs.de/). If the site changes its markup, the
parser and its fixtures in `tests/status.test.ts` need to be updated. The app
shows "Unbekannt" instead of guessing when the status cannot be determined.

This project is not affiliated with Biergarten Sierich.

## Credits

This project was created 100% with DeepSeek V4.1 Flash and
[opencode](https://opencode.ai).

## License

This project is released under the [MIT License](LICENSE).
