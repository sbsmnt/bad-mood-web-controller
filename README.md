# CBA BAD MOOD editor

A React + TypeScript Web MIDI editor for the Chase Bliss BAD MOOD pedal.

## Run locally

The project runs on any OS that supports Node.js 24 (LTS) and pnpm 11.

If you use `nvm`, the included `.nvmrc` selects Node.js 24; CI reads the same file:

```sh
nvm install
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

If Node.js is already installed without `nvm`, verify it with `node --version`, enable Corepack, and run the final two commands above.

Open the local URL in Chrome or Edge, choose **Enable MIDI**, approve the MIDI permission prompt, select the MIDI output connected to the pedal, and leave the channel at the BAD MOOD default of **2** unless the pedal has been reconfigured.

Web MIDI requires a secure context. `localhost` is allowed, while a deployed build must use HTTPS. Chrome or Edge is recommended; Safari does not currently expose the Web MIDI API used by the editor.

## Code quality

[Biome](https://biomejs.dev) formats and lints the project; the rules live in `biome.json`.

```sh
pnpm check       # formatting, lint, and import order (what CI should run)
pnpm check:fix   # apply safe fixes and format everything
pnpm lint        # lint only
pnpm format      # format only
pnpm typecheck   # TypeScript project build, no emit
pnpm test        # run the unit tests once
pnpm test:watch  # re-run tests on change
```

GitHub Actions (`.github/workflows/ci.yml`) runs `biome ci`, the typecheck, and the unit tests on every push and on pull requests into `main`.

Unit tests use [Vitest](https://vitest.dev) and sit next to the code they cover (`*.test.ts`). They focus on the parts that talk to the pedal or keep your data: MIDI message bytes, the Web MIDI connection (with a fake browser MIDI API), browser preset storage, the parameter map's integrity (unique ids and CCs, values in range, manual defaults), the FLIP chord and stepped clock tables, the mode-aware knob labels, and the synth envelope maths.

The lint setup enables Biome's recommended rules plus its React domain (Rules of Hooks, exhaustive effect dependencies, stable list keys), stricter accessibility checks, `import type` for type-only imports, and no unused imports, variables, or parameters. Any suppression must say why in its `biome-ignore` comment. With the recommended VS Code extension installed, files are formatted and imports organized on save.

## Architecture

- `src/pedal/badMood.ts` is the hardware-neutral parameter model derived from the official August 2026 MIDI manual.
- `src/midi/` owns raw Web MIDI access and message encoding. It has no React UI dependencies except the adapter hook.
- `src/components/` renders reusable editor controls.
- `src/App.tsx` coordinates editor state, commands, views, and the local preset library.
- `public/manifest.webmanifest` and `public/sw.js` provide installable, offline-capable PWA behavior in production.

## MVP behavior

- Stable MIDI output selection by port ID, with hot-plug refresh
- MIDI channels 1–16 (default 2)
- Documented CC controls, toggles, subdivisions, footswitch states, DIP switches, and selected utilities
- Program Change recall for Live mode / presets 1–122
- Preset save via CC 111
- Confirmation before overwrite and factory reset operations

This project controls physical BAD MOOD hardware; it does not emulate its audio processing.
