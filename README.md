# Fluxoid

Mobile-first PWA that captures a photo, animates a polaroid-style developing transition, and transforms it into a styled illustration via [Modular Cloud](https://docs.modular.com) (FLUX.2 Klein 4B).

Photos are **not stored on the server**. The API is stateless — it transforms and returns an image. Your **film roll** (27 exposures) lives on-device in **IndexedDB**.

See [`docs/SPEC.md`](docs/SPEC.md) for the full product and technical spec.

## Quick start

From the project root:

```bash
bun install
cp server/.env.example server/.env   # add MODULAR_API_KEY
bun run dev
```

- **API** → http://localhost:3000 (`POST /api/transform`)
- **App** → http://localhost:5173

## Architecture

| Layer | Storage |
|-------|---------|
| Server | Stateless — preset prompt on disk only, no user photos |
| Client | IndexedDB film roll, max **27** exposures (disposable camera standard) |

## Tests

```bash
bun test
bun run test:modular   # live Modular API smoke test
```
