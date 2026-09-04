# Fluxoid — Product & Technical Spec

> Mobile-first PWA that captures a photo, animates a developing transition, and returns a styled illustration via [Modular Cloud](https://docs.modular.com) (FLUX.2 Klein 4B).

**Status:** Draft v0.1  
**Last updated:** 2026-09-04

---

## 1. Summary

A single-page web app installable on iOS/Android home screens. The user opens the camera, takes a photo, and the app immediately begins a shader-based “developing” animation while the backend transforms the image. When generation completes, the animation morphs into the styled result. **Photos are not stored on the server.** The API is stateless — it transforms and returns PNG bytes. Up to **27 exposures** (disposable-camera standard) are kept on-device in **IndexedDB** and shown in a masonry gallery.

**MVP scope:** one fixed style preset, anonymous usage, camera-only capture, save-to-device (no share), local dev deployment.

---

## 2. Goals & Non-Goals

### Goals (v1)

- Camera capture with front/back camera selection
- Immediate shader transition after shutter (no tap-to-develop)
- Server-side image transform via Modular `FLUX.2-klein-4B` (stateless — no user photo persistence)
- On-device film roll: max **27** styled prints in **IndexedDB** (disposable 35mm standard)
- Masonry gallery of prints on this device only
- PWA installable on mobile home screen
- Configurable input compression before remote call
- Output always 1024px on the long edge, aspect ratio derived from source

### Non-Goals (v1)

- Style picker / multiple concurrent presets in UI
- Social feed, sharing, payments, admin dashboard
- User accounts / authentication
- Offline generation or offline gallery sync
- CI/CD pipeline
- Production deployment (Fly.io planned for later)

---

## 3. App Name

**Fluxoid** — portmanteau of Flux (model) + Polaroid (UX metaphor).

| Context | Value |
|---------|-------|
| Display name | Fluxoid |
| PWA short name | Fluxoid |
| Repo | `flux-style-camera` (unchanged) |

---

## 4. User Flow

```
┌─────────────┐     shutter      ┌──────────────┐     API done      ┌─────────────┐
│   Camera    │ ───────────────► │  Developing  │ ────────────────► │   Result    │
│   (live)    │   auto-start     │  (shader)    │   morph reveal    │  (styled)   │
└─────────────┘                  └──────────────┘                   └─────────────┘
       ▲                                                                  │
       │                          gallery (masonry) ◄──────────────────────┘
       └──────────────── scroll / tap new capture ─────────────────────────
```

1. **Camera view** — live preview in a polaroid-style framed container with viewport padding.
2. **Capture** — freeze frame, begin transform request to server (photo sent once, not stored server-side).
3. **Developing** — `@paper-design/shaders-react` effect loops on the captured image until the styled result is ready.
4. **Reveal** — morph/transition from shader view to final styled image (off-screen canvas render path for future watermark support).
5. **Save** — user can save styled image to device (no native share sheet in v1).
6. **Gallery** — masonry grid of prints on this device; tap to view detail. When the roll is full (27/27), capture is blocked until the user clears the roll (future UX) or deletes prints.

---

## 5. UI / UX Notes (minimal v1)

Detailed visual design deferred; structural requirements:

- **Theme:** light only
- **Layout:** padded viewport container; polaroid frame wraps camera preview / captured / result images
- **Navigation:** camera ↔ gallery (exact chrome TBD)
- **No** style picker, settings screen, or account UI in v1
- **Canvas:** styled output rendered via off-screen canvas → displayed image, enabling future watermark overlay without re-architecture

---

## 6. Shader Transition

**Library:** [`@paper-design/shaders-react`](https://shaders.paper.design)

**Chosen effect:** `water` — fluid developing metaphor aligned with polaroid “print in the tray” UX.

**Behavior:**

| Phase | Duration | Behavior |
|-------|----------|----------|
| **Loop** | Until API returns | Water shader animates continuously over the captured preview |
| **Morph** | ~800–1200ms (tunable) | Crossfade / dissolve from shader output to styled result |
| **Idle** | — | Show final image; enable save |

If generation fails, stop shader loop and show error state with retry option (return to camera or re-submit — TBD in UX pass).

---

## 7. Style Presets (data model)

v1 ships **one preset** loaded from server config on disk. Architecture supports multiple presets for future use.

```typescript
interface StylePreset {
  id: string;              // e.g. "travel-gouache-v1"
  name: string;            // display name (not shown in v1 UI)
  prompt: string;          // pure text; no [IDENTIFICATION ANCHOR]
  referenceImagePath: string; // optional local path to reference image for img2img
  model: string;           // "black-forest-labs/FLUX.2-klein-4B"
  guidanceScale: number;   // 7.5
  steps: number;           // 4
  seed: number | "random"; // 42 for v1, or random per capture — default 42
  enabled: boolean;
}
```

**Modular request shape** (image transform):

- `input`: user message with `input_image` (base64 data URI of downsized capture) + `input_text` (preset prompt)
- If preset includes a reference image, include as additional `input_image` block (multi-reference editing per [Modular image docs](https://docs.modular.com/inference/image.md))
- `provider_options.image`: dimensions computed from aspect ratio (see §8)

Launch preset prompt: the gouache/crayon travel-illustration text from the Modular playground (minus identification anchor placeholder).

---

## 8. Image Processing

### 8.1 Input compression (before Modular)

Configurable server-side (env / config file):

| Setting | Default | Description |
|---------|---------|-------------|
| `INPUT_MIN_WIDTH` | `768` | Minimum width after resize (px) |
| `INPUT_MIN_HEIGHT` | `768` | Minimum height after resize (px) |
| `INPUT_MAX_BYTES` | `1_500_000` | Optional max JPEG/WebP size (~1.5 MB) |
| `INPUT_FORMAT` | `jpeg` | Output format for upload |
| `INPUT_QUALITY` | `85` | JPEG/WebP quality |

**Rules:**

1. Read original capture dimensions from client upload.
2. Scale down (never up) so both dimensions ≥ min width/height while fitting within reasonable bounds.
3. Send compressed buffer to Modular in memory; **do not persist** user photos on disk.
4. Preserve aspect ratio exactly.

### 8.2 Output dimensions (Modular)

**Long edge = 1024px.** Short edge computed from source aspect ratio, snapped to nearest supported dimension (multiples of 8 or 64 per model constraints — verify against Modular API).

Example aspect ratio mapping (approximate buckets for display + API):

| Source ratio | Bucket | Output (W×H) |
|--------------|--------|--------------|
| ~1:1 | square | 1024 × 1024 |
| ~3:4 / 4:3 | portrait / landscape | 768 × 1024 / 1024 × 768 |
| ~2:3 / 3:2 | photo | 683 × 1024 / 1024 × 683 |
| ~9:16 / 16:9 | tall / wide | 576 × 1024 / 1024 × 576 |
| other | nearest standard | computed from ratio |

Return dimensions in response headers (`X-Fluxoid-Aspect-Ratio`, etc.). Client stores output PNG in IndexedDB.

### 8.3 Client film roll (IndexedDB)

| Setting | Value | Notes |
|---------|-------|-------|
| `FILM_CAPACITY` | **27** | Standard exposure count for disposable 35mm (Fujifilm QuickSnap, Kodak FunSaver) — not 20, 28, or 32 |
| Storage | **IndexedDB** | Blob storage; **not** `localStorage` (~5 MB limit is insufficient for ~27 PNGs) |
| Per print | styled PNG + preview JPEG + metadata | ~300 KB–1 MB each → ~8–15 MB total for a full roll |

**Why not localStorage?** Typical quota is ~5 MB per origin. Twenty-seven styled PNGs alone exceed that. IndexedDB is designed for larger binary data and is the standard choice for offline/PWA media caches.

### 8.4 Server data layout (no user photos)

```
server/
  data/
    presets/
      travel-gouache-v1/
        reference.jpg      # optional style reference image
        prompt.txt         # preset prompt text
```

---

## 9. Architecture

### 9.1 Monorepo layout

```
/
├── client/          # Vite + React + TypeScript + shadcn
├── server/          # Bun + Hono (stateless API)
├── docs/
│   └── SPEC.md
├── package.json     # workspace root (optional) or separate lockfiles
└── README.md
```

### 9.2 Stack

| Layer | Technology |
|-------|------------|
| Runtime | [Bun](https://bun.sh) |
| Frontend | Vite, React 19, TypeScript |
| UI | shadcn/ui (`bunx --bun shadcn@latest init --preset b3awmRxb8a --template vite`) |
| Shaders | `@paper-design/shaders-react` |
| Backend | [Hono](https://hono.dev) on Bun (stateless) |
| Client storage | IndexedDB film roll (27 max) |
| AI | Modular Cloud Responses API |
| PWA | `vite-plugin-pwa` |

> **Note:** User referenced a Next.js shadcn template preset; we adapt the same shadcn preset for **Vite + React** (not Next.js) since the app is a client-side SPA with a separate Hono API.

### 9.3 Request flow

```
Client                         Server                         Modular
  │                              │                               │
  │ POST /api/transform          │                               │
  │ (multipart: photo, camera)   │                               │
  ├─────────────────────────────►│ resize in memory              │
  │                              │ POST /v1/responses            │
  │                              ├──────────────────────────────►│
  │                              │◄──────────────────────────────┤
  │◄─────────────────────────────┤ PNG body + metadata headers   │
  │ save to IndexedDB            │ (no server persistence)       │
  │ morph to output              │                               │
```

**Sync request:** Client awaits transform during developing animation (~3–10s with 4 steps). No polling.

### 9.4 Security

- `MODULAR_API_KEY` server-side only; never exposed to client
- CORS restricted to dev origin (`http://localhost:5173`) — configurable
- No auth in v1; rate limiting optional follow-up
- Validate upload MIME type and max file size

---

## 10. API (Hono)

### `POST /api/transform`

Transform a photo and return styled PNG. **Does not persist** the upload or result.

**Request:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `photo` | File (JPEG/PNG) | yes |
| `camera` | `"front"` \| `"back"` | yes |

**Response `200`:** `image/png` body

**Response headers:**

| Header | Description |
|--------|-------------|
| `X-Fluxoid-Aspect-Ratio` | Source aspect ratio (width/height) |
| `X-Fluxoid-Output-Width` | Styled output width (px) |
| `X-Fluxoid-Output-Height` | Styled output height (px) |
| `X-Fluxoid-Preset-Id` | Active preset id |

**Errors:** `502` on upstream Modular failure; `400` on invalid upload.

### `GET /api/health`

Liveness check.

---

## 11. Client film roll schema (IndexedDB)

Store name: `prints` in database `fluxoid`.

```typescript
interface FilmPrint {
  id: string;
  createdAt: string;
  camera: "front" | "back";
  aspectRatio: number;
  outputWidth: number;
  outputHeight: number;
  presetId: string;
  outputBlob: Blob;   // styled PNG from API
  previewBlob: Blob;  // original capture for gallery thumb / re-view
}
```

Max **27** records. Oldest-first eviction is a future option; v1 blocks capture when full.

---

## 12. Modular Integration

**Endpoint:** `POST https://api.modular.com/v1/responses`  
**Model:** `black-forest-labs/FLUX.2-klein-4B`  
**Auth:** `Authorization: Bearer $MODULAR_API_KEY`

**Generation parameters (v1 defaults):**

| Param | Value |
|-------|-------|
| `steps` | 4 |
| `guidance_scale` | 7.5 |
| `seed` | 42 (fixed unless preset seed is NULL) |
| `width` / `height` | from §8.2 |

**Error handling:**

- Retry once on 429/5xx with backoff
- Return 502 to client on terminal failure (no server-side capture record)
- Log request metadata (not API key)

---

## 13. Client

```
App
├── CameraView          # getUserMedia, front/back toggle, shutter, exposure counter
├── DevelopingView      # Water shader + POST /api/transform
├── ResultView          # off-screen canvas → img, save button
└── GalleryView         # masonry grid from IndexedDB, tap → detail
```

**PWA manifest:** name `Fluxoid`, `display: standalone`, light theme, camera permission.

---

## 14. Configuration (environment)

```bash
# server/.env
MODULAR_API_KEY=...
PORT=3000
DATA_DIR=./data
CORS_ORIGIN=http://localhost:5173

# Input compression
INPUT_MIN_WIDTH=768
INPUT_MIN_HEIGHT=768
INPUT_MAX_BYTES=1500000
INPUT_QUALITY=85

# Modular defaults (override per preset where applicable)
MODULAR_STEPS=4
MODULAR_GUIDANCE_SCALE=7.5
MODULAR_SEED=42
```

---

## 15. Testing (backend-first)

### Unit tests

- Aspect ratio → output dimension mapping
- Input resize/compress logic (dimensions, quality, max bytes)
- Prompt assembly (text + optional reference image blocks)
- Capture status state machine → removed (sync transform)
- Film roll capacity enforcement (client)

### Integration tests

- `POST /api/transform` → mocked Modular → PNG + headers
- Error path: Modular failure → `502`

### Test tooling

- `bun test` (built-in)
- Mock Modular HTTP with `fetch` mock or MSW
- Temp directory for `DATA_DIR` per test run

**Not in v1:** snapshot tests, CI, E2E browser tests.

---

## 16. Development Commands (target)

```bash
# Install
bun install

# Server (port 3000)
bun run --cwd server dev

# Client (port 5173)
bun run --cwd client dev

# Tests
bun test --cwd server
```

---

## 17. Future (post-v1)

- Fly.io deployment (stateless API — no photo volume needed)
- Style picker UI (presets on disk)
- Share sheet
- Watermark via off-screen canvas
- `[IDENTIFICATION ANCHOR]` or vision-assisted prompt enrichment
- CI (GitHub Actions)
- Rate limiting / abuse protection for anonymous usage

---

## 18. Open Questions (UX pass)

- Exact polaroid frame dimensions and typography
- Gallery detail interaction (fullscreen? inline expand?)
- Error/retry UX copy and gestures
- Save behavior: download styled only, or styled + original?
- Seed: fixed 42 vs random per capture for variety

---

## Appendix A: Launch Style Preset Prompt

> Placeholder — copy exact playground prompt (without `[IDENTIFICATION ANCHOR]`) into `server/data/presets/travel-gouache-v1/prompt.txt` during backend setup.

Prompt theme: colorful quiet editorial illustration — opaque matte gouache, cut paper, wax crayon, risograph; 5–8 dusty color families; simplified surfaces; no logos/signage; horizontal travel-memory composition.
