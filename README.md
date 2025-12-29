# Go Coach

A lightweight Go training sandbox inspired by Chess Coach. Play 9×9 (or larger) games against a simple bot, store your progress locally, and ask an OpenAI-powered coach for bite-sized feedback and study prompts.

## Features

- 9×9, 13×13, or 19×19 board support with captures, liberties, and ko detection handled entirely on the client.
- Tap-to-play Go board with last-move highlighting and a scrolling move list.
- Pass/new game/swap sides controls plus a basic heuristic opponent built on top of the same rules engine.
- Optional OpenAI integration: save your API key locally to get JSON feedback tailored to the current board/move history.
- Stronger local bot: a Monte Carlo simulation engine runs entirely in-browser, so no servers or API calls are needed.
- GitHub Pages workflow identical to Chess Coach for fast deployments.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

By default the Vite base path switches to `/go-coach/` when running in GitHub Actions so Pages serves assets correctly.
