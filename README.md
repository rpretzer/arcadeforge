# ArcadeForge

**AI-powered game creation.** Idea to playable browser game in one command.

```bash
npx arcadeforge create
```

That's it. ArcadeForge walks you through everything -- pick a genre, choose a vibe, name your game, and it generates a complete, playable HTML5 game with a built-in dev server so you can play immediately.

Want to skip the prompts?

```bash
npx arcadeforge create --quick
```

This generates a game with random defaults -- great for seeing what ArcadeForge can do in seconds.

## Genres

| Genre | Description |
| :--- | :--- |
| **Runner** | Side-scrolling obstacle course with collectibles, power-ups, and increasing speed. |
| **Arena** | Top-down shooter with waves of enemies, weapon upgrades, and boss fights. |
| **Puzzle** | Match-3 grid game with combos, special pieces, and timed challenges. |
| **Story** | Branching narrative adventure with choices, dialogue, and multiple endings. |
| **RPG** | Top-down exploration with NPCs, quests, inventory, and turn-based encounters. |
| **Tower Defense** | Place and upgrade towers to defend against waves of enemies on a path. |
| **Racing** | Circuit racing with acceleration, drifting, AI opponents, and lap times. |

All templates are vanilla JavaScript + HTML5 Canvas with zero build step.

## Commands

| Command | Description |
| :--- | :--- |
| `arcadeforge create` | Create a new game interactively. Add `--quick` to skip prompts. |
| `arcadeforge serve` | Launch local dev server with live feedback widget. |
| `arcadeforge remix` | Iterate on your game using AI and your playtest notes. |
| `arcadeforge playtest` | Run your game locally and collect feedback. |
| `arcadeforge deploy` | Deploy to the web and submit to the ArcadeForge Hub. |
| `arcadeforge config` | Configure your AI provider and model preferences. |

## AI Providers

ArcadeForge works without any AI provider -- the manual wizard creates games just fine. To unlock AI-powered features (Creative Partner mode, smart config generation, remixing), configure a provider:

```bash
arcadeforge config
```

| Provider | Key | Notes |
| :--- | :--- | :--- |
| **Google Gemini** | `GOOGLE_API_KEY` | Default. Uses `gemini-2.0-flash`. |
| **OpenAI** | `OPENAI_API_KEY` | Uses `gpt-4o`. |
| **Anthropic** | `ANTHROPIC_API_KEY` | Uses `claude-sonnet-4-5-20250929`. |
| **Ollama** | None (local) | Uses `llama3`. No API key needed. |

Keys can be set as environment variables or saved via `arcadeforge config`. If multiple keys are present, ArcadeForge auto-detects in the order above.

## ArcadeForge Hub

The Hub is a community platform where players can browse, play, and rate games created with ArcadeForge. Deploy your game with `arcadeforge deploy` to share it with the community.

The Hub is built with Next.js 14, Supabase, and Tailwind CSS. See [hub/README.md](hub/README.md) for setup instructions.

## Project Structure

```
cli/             TypeScript CLI engine
  src/
    index.ts           Entry point and command router
    conversation.ts    Creative Partner (AI director) logic
    ai.ts              LLM integration layer
    providers/         Provider adapters (Google, OpenAI, Anthropic, Ollama)
    settings.ts        User config persistence (~/.arcadeforge/config.json)
    validation.ts      Zod schemas for config validation
    templates/         Per-genre config generators
    generator.ts       Template copier and config injector
    serve.ts           Dev server with feedback injection
    remix.ts           AI-powered iteration
    deploy.ts          Hub deployment
    snapshot.ts        Type definitions and snapshot builder
templates/       Vanilla JS game engines (7 genres)
hub/             Next.js community platform
```

## Development

```bash
# Clone and install (builds CLI automatically)
git clone <repo-url>
cd arcadeforge
npm install

# Run from source
npm run arcadeforge -- create

# Or link globally
cd cli && npm link
arcadeforge create
```

### Build Commands

| Command | Description |
| :--- | :--- |
| `npm run build:cli` | Build the CLI from TypeScript source. |
| `npm run dev:hub` | Start the Hub in development mode. |
| `npm run arcadeforge -- <cmd>` | Run CLI commands from the repo root. |

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b my-feature`).
3. Make your changes and ensure the CLI builds cleanly (`npm run build:cli`).
4. Submit a pull request with a clear description of what changed and why.

Game template contributions are especially welcome -- see `templates/` for examples.

## License

MIT
