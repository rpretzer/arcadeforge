# Changelog

## 1.0.0

Initial release of ArcadeForge.

### CLI

- Interactive game creation wizard with Creative Partner AI mode.
- `--quick` flag for instant game generation with random defaults.
- `arcadeforge config` command for AI provider selection and model configuration.
- `arcadeforge serve` dev server with live feedback widget.
- `arcadeforge remix` for AI-powered iteration using playtest notes.
- `arcadeforge playtest` for local game testing with feedback collection.
- `arcadeforge deploy` to submit games to the ArcadeForge Hub.
- Provider abstraction layer supporting Google Gemini, OpenAI, Anthropic, and Ollama.
- Auto-detection of available AI providers from environment variables.
- Zod-based config validation for all genres.
- Persistent user settings stored in `~/.arcadeforge/config.json`.

### Templates

- **Runner:** Side-scrolling with collectibles, power-ups, obstacle variety, and progressive speed.
- **Arena:** Top-down shooter with wave system, enemy types, weapon upgrades, and boss fights.
- **Puzzle:** Match-3 with combo system, special pieces (bomb, rainbow, lightning), and timed challenges.
- **Story:** Branching narrative with dialogue system, choices, and multiple endings.
- **RPG:** Top-down exploration with NPCs, quests, inventory, and turn-based encounters.
- **Tower Defense:** Path-based with tower placement, upgrades, enemy waves, and resource management.
- **Racing:** Circuit racing with acceleration, drifting, AI opponents, and lap tracking.
- All templates: pause/resume, control hints overlay, vanilla JS + HTML5 Canvas, zero build step.

### Hub

- Next.js 14 community platform with Supabase backend.
- Game browsing with genre and vibe filtering.
- Individual game pages with embedded player.
- Game submission API for CLI integration.
- Admin moderation panel with approval workflow.
- Dark arcade-themed UI with Tailwind CSS.

### Infrastructure

- npm workspaces monorepo (cli, hub, templates).
- Automatic CLI build on `npm install` via postinstall script.
- Global install support via `npm link`.
- `npx arcadeforge` support for zero-install usage.
