# ArcadeForge Launch Plan

## 1. Announcement Plan

### Platform Priority (in order)

| # | Platform | Format | Why |
|---|----------|--------|-----|
| 1 | **Hacker News** | Show HN post | Developer audience, high-signal traffic, sets the narrative |
| 2 | **Reddit r/gamedev** | Self-post | Largest gamedev community, loves tools and workflow posts |
| 3 | **Reddit r/indiegaming** | Self-post | Indie-friendly audience that values creativity over polish |
| 4 | **Twitter/X** | Thread (5-7 tweets) | Shareable, visual, reaches AI and gamedev audiences |
| 5 | **Product Hunt** | Full launch | Structured discovery platform, drives sustained traffic |
| 6 | **Dev.to** | Article | Long-form technical audience, good SEO, evergreen |
| 7 | **Reddit r/webdev** | Self-post | Web developers who might not follow gamedev |
| 8 | **Reddit r/javascript** | Self-post | JS community, appreciates vanilla JS + no-build approach |
| 9 | **Reddit r/artificial** | Self-post | AI enthusiasts interested in creative AI applications |
| 10 | **Reddit r/sideproject** | Self-post | Community built for exactly this kind of launch |
| 11 | **Discord communities** | Message in #showcase channels | Gamedev, indie dev, and AI-focused servers |
| 12 | **GitHub Release** | v0.1.0 release notes | Canonical source, linked from everywhere else |

### Timing Strategy

**Day 0 (Tuesday or Wednesday, 9-10am ET):**
- Publish GitHub Release first (this is your canonical link)
- Post to Hacker News (Show HN) — Tuesday-Wednesday mornings get the best engagement
- Post to r/gamedev and r/indiegaming

**Day 0, afternoon:**
- Launch Twitter/X thread — schedule for 12-1pm ET for US lunch-break scrolling
- Post to r/webdev, r/javascript

**Day 1:**
- Post to r/artificial and r/sideproject
- Share in Discord communities (gamedev, indie dev, AI servers)

**Day 2-3:**
- Launch on Product Hunt (Tuesday or Wednesday, launches go live at 12:01am PT)
- Publish Dev.to article

**Why stagger?**
- Avoids looking like spam if the same people follow multiple channels
- Lets you incorporate early feedback into later posts
- Product Hunt works best when you already have some external buzz

**General posting tips:**
- Engage genuinely with every comment in the first 2 hours
- Have 2-3 demo games ready to link to on the hub
- Prepare a 30-second screen recording or GIF of the create flow
- Do not ask for upvotes — let the work speak for itself

---

## 2. Copy Drafts

### a) One-Line Tagline

> **ArcadeForge: Chat with AI, get a playable browser game. Seven genres, zero boilerplate.**

### b) Elevator Pitch

ArcadeForge is an open-source CLI that turns a conversation with AI into a fully playable browser game. You describe your idea, an AI creative partner asks the right questions, and minutes later you have a complete HTML5 Canvas game — no engine to learn, no build step, no framework. It supports 7 genres from endless runners to tower defense, works with multiple AI providers (Gemini, GPT, Claude, or local Ollama), and ships with a community hub where players can share and discover games.

### c) Show HN / Reddit Post

**Title:** Show HN: ArcadeForge — Chat with AI, get a playable browser game

I built ArcadeForge, an open-source CLI tool that generates complete, playable browser games through a creative conversation with AI. You run `npx arcadeforge create`, describe your game idea, and an AI creative partner guides you through decisions about theme, difficulty, visual style, and mechanics. A few minutes later, you have a standalone HTML5 Canvas game — no frameworks, no build step, just vanilla JavaScript you can open, play, and modify.

The tool supports 7 genres: Runner, Arena, Puzzle, Story/Visual Novel, RPG/Adventure, Tower Defense, and Racing. Each genre has a hand-built game engine template with real gameplay depth — collectibles, power-ups, wave systems, dialog trees, skill trees, map editors. The AI does not write the game code from scratch (which tends to produce broken games). Instead, it configures and tunes a proven engine template based on your creative direction, so the result actually works.

What makes this different from "ask ChatGPT to write a game" is that the output is reliably playable. The templates are solid vanilla JS engines. The AI's job is creative direction, not code generation. You can also bring your own AI provider — Google Gemini, OpenAI GPT, Anthropic Claude, or a local Ollama model. And there is a community hub built with Next.js and Supabase where you can publish your game and browse what others have built.

It is MIT-licensed and the whole thing runs as a single npm package. Would love feedback from this community — try it with `npx arcadeforge create` and let me know what breaks.

GitHub: [link]
Hub: [link]

### d) Twitter/X Thread

**Tweet 1:**
I built ArcadeForge — an open-source CLI that turns a conversation with AI into a fully playable browser game.

Run one command. Chat about your idea. Get a real game.

7 genres. Multiple AI providers. No engine to learn.

[demo GIF placeholder]

**Tweet 2:**
How it works:

1. `npx arcadeforge create`
2. AI asks about your game — theme, style, mechanics
3. It picks the right genre engine and tunes it to your vision
4. You get a complete HTML5 Canvas game — vanilla JS, no build step

The AI directs. The engines deliver.

**Tweet 3:**
7 genres, each with a hand-built engine:

- Endless Runner (collectibles, power-ups, parallax)
- Arena Shooter (waves, weapon upgrades, boss fights)
- Puzzle (combos, special pieces, time challenges)
- Story / Visual Novel (branching dialog, characters)
- RPG / Adventure (top-down, skill trees, quests)
- Tower Defense (pathfinding, tower types, upgrade tiers)
- Racing (tracks, drifting, AI opponents)

**Tweet 4:**
Bring your own AI:

- Google Gemini
- OpenAI GPT
- Anthropic Claude
- Local models via Ollama

One command to switch: `arcadeforge config`

Works offline with Ollama. No vendor lock-in.

**Tweet 5:**
Built a game you are proud of? Publish it.

ArcadeForge has a community hub where you can:
- Deploy your game with `arcadeforge deploy`
- Browse and play games others have built
- Remix any published game as a starting point

[hub screenshot placeholder]

**Tweet 6:**
Try it right now:

```
npx arcadeforge create
```

That is it. No signup, no API key required to start (uses free-tier Gemini by default).

MIT licensed. Contributions welcome.

GitHub: [link]

**Tweet 7:**
What is next:

- Multiplayer templates
- Custom asset generation (AI sprites and tilesets)
- More genres (platformer, card game, simulation)
- Plugin system for community-built engines

This is v0.1 — the foundation. If you build something cool with it, I want to see it.

### e) Product Hunt

**Tagline:**
Chat with AI, get a playable browser game — 7 genres, zero boilerplate

**Short Description:**
ArcadeForge is an open-source CLI that generates complete HTML5 Canvas games through creative conversation with AI. Describe your idea, and an AI creative partner configures one of 7 genre engines (runner, arena, puzzle, story, RPG, tower defense, racing) to match your vision. No framework to learn, no build step. Works with Gemini, GPT, Claude, or local Ollama. Publish to the community hub and browse what others have built.

**First Comment (Maker's Comment):**
Hey Product Hunt! I am the developer behind ArcadeForge.

I kept seeing AI demos that generate "games" — usually broken JavaScript that sort of runs if you squint. I wanted something different: games that actually play well, with real mechanics, powered by battle-tested engines.

So I built ArcadeForge. The AI does not write game code from scratch. Instead, it acts as a creative director — it asks about your vision, picks the right genre engine, and tunes every parameter to bring your idea to life. The result is a standalone vanilla JS game that you can play immediately, modify freely, and share with anyone.

The 7 genre engines each have genuine depth. The arena shooter has wave systems and boss fights. The RPG has skill trees and quest logic. The tower defense has real pathfinding. These are not demos — they are starting points for real games.

I would love your feedback. Try `npx arcadeforge create` and tell me what you think. What genres should I add next? What would make this more useful for you?

### f) Dev.to Article Outline

**Title:** "I Built a CLI That Turns AI Conversations Into Playable Browser Games"

**Sections:**

1. **The Problem With AI-Generated Games**
   - AI can write code, but "write me a game" produces fragile, shallow results
   - The gap between "it runs" and "it plays well" is enormous
   - Template-driven approach: let AI direct, let engines deliver

2. **How ArcadeForge Works**
   - Architecture overview: CLI + templates + AI providers + hub
   - The creative conversation flow (with example transcript)
   - How config generation bridges AI output and engine input

3. **The 7 Genre Engines**
   - Walk through each genre with screenshots
   - Highlight the depth: not toy demos, real game mechanics
   - Vanilla JS, HTML5 Canvas, zero dependencies — explain why

4. **Multi-Provider AI**
   - Why provider choice matters (cost, privacy, quality)
   - How the provider abstraction works
   - Running fully local with Ollama

5. **The Community Hub**
   - Deploy with one command
   - Browse, play, and remix games
   - Built with Next.js + Supabase

6. **Technical Decisions Worth Discussing**
   - Why vanilla JS over a framework
   - Why templates over raw code generation
   - Why a CLI over a web app
   - Monorepo structure with npm workspaces

7. **Try It and What Is Next**
   - `npx arcadeforge create` — zero setup required
   - Roadmap: multiplayer, custom assets, more genres, plugins
   - Link to GitHub, hub, and contributing guide

**Key points to emphasize throughout:**
- Open source and MIT licensed
- Works offline with local models
- Games are yours — plain files, no lock-in
- The AI is a creative partner, not a code generator
- Community-driven roadmap
