# Contributing to ArcadeForge

Thanks for your interest in contributing!

## Getting Started

```bash
git clone <repo-url>
cd GameGenie
npm install
```

## Project Structure

- `cli/` — CLI wizard (TypeScript). Build with `npm run build:cli`.
- `templates/` — Game templates (vanilla JS). Each genre has its own folder.
- `hub/` — Community website (Next.js + Supabase).
- `docs/` — Documentation.

## Development

### CLI
```bash
cd cli
npm install
npm run dev -- create    # Run CLI in dev mode
```

### Templates
Open any template's `index.html` via a local server:
```bash
cd templates/runner
npx serve .
```

### Hub
```bash
cd hub
npm install
npm run dev
```

## Adding a New Template

1. Create a new folder in `templates/` (e.g., `templates/platformer/`)
2. Follow the existing structure: `index.html`, `src/` with modular JS files, `README.md.tmpl`
3. Every template **must** have a `src/config.js` as the parameterization surface
4. Add a template config generator in `cli/src/templates/`
5. Add the genre to the `Genre` type in `cli/src/snapshot.ts`
6. Wire it into the questionnaire and generator

## Code Conventions

- **CLI:** TypeScript, strict mode, no `any`
- **Templates:** Vanilla JS (ES modules), no build step, Canvas 2D API only
- **Hub:** Next.js App Router, TypeScript, Tailwind CSS

## Template Requirements

- 60fps target with `requestAnimationFrame`
- Instant restart (R key or click)
- On-screen control instructions
- Responsive canvas
- Placeholder art using Canvas drawing
- `config.js` for all tunables

## Pull Requests

1. Create a feature branch
2. Make your changes
3. Test manually (templates should be playable, CLI should generate working games)
4. Submit a PR with a clear description
