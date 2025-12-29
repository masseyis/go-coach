# Go Coach

A lightweight Go training sandbox inspired by Chess Coach. Play 9×9 (or larger) games against a simple bot, store your progress locally, and ask an OpenAI-powered coach for bite-sized feedback and study prompts.

## Features

- 9×9, 13×13, or 19×19 board support with captures, liberties, and ko detection handled entirely on the client.
- Tap-to-play Go board with last-move highlighting and a scrolling move list.
- Pass/new game/swap sides controls plus a basic heuristic opponent built on top of the same rules engine.
- Optional OpenAI integration: save your API key locally to get JSON feedback tailored to the current board/move history.
- Pluggable engine: point the app at a running KataGo server for pro-level play, or fall back to the built-in heuristic bot.
- GitHub Pages workflow identical to Chess Coach for fast deployments.

## Real engine integration (KataGo)

KataGo is already packaged for HTTP play through the open-source [`katago-server`](https://github.com/hauensteina/katago-server) wrapper, which exposes the engine via a simple REST API.citeturn0search0 To use it here:

1. Follow that project's instructions to run the server locally (e.g., `docker run -p 2718:2718 hauensteina/katago-server`).
2. Create a `.env` (or export the variable) with `VITE_KATAGO_SERVER_URL=http://localhost:2718`.
3. Restart `npm run dev` (or rebuild). When the variable is set, Go Coach sends the full move list to KataGo and plays the returned best move. If the variable is omitted, it automatically falls back to the built-in heuristic bot so the UI remains usable offline.

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
