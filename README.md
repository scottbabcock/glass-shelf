# Glass Shelf

A [Decky Loader](https://decky.xyz) plugin for Steam's Game Mode that replaces the Library with a glassy, two-panel **Spotlight Library**: a game grid on one side and a full-bleed artwork inspector on the other.

> **Status: early development (0.x).** Glass Shelf is being stripped down to a lean MVP, then optimized, before plugin integrations are added back. Expect breaking changes.

## Credits

Glass Shelf is a fork of **Glance Library** by [shak18](https://github.com/shak18), which grew out of **[Game Glance](https://github.com/michpalm/game-glance)** by Michael Palma. Both are MIT licensed; see [LICENSE](LICENSE) and [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

## Roadmap

1. **MVP**: remove HowLongToBeat, third-party plugin integrations (TabMaster, Unifideck, Heroic) and most settings.
2. **Optimize**: understand, simplify and speed up the core library view.
3. **Integrations**: detect popular Decky plugins that conflict with or complement the Glass UI, and support them deliberately.

## Features (current)

- **Spotlight Library**: replaces `/library`, `/library/games` and `/library/all` with a game grid plus an inspector panel (artwork, play time, achievements, install size, description).
- **Accent glow** sampled from each game's hero art.
- **Controller and touch**: D-pad/stick navigation, L1/R1 to switch tabs, View for the game menu, B to go back.
- **Safe fallback**: if the Spotlight Library fails to render, Steam's own Library is shown.

## Development

Prerequisites: Node.js 18+, [pnpm](https://pnpm.io) 9 (`npx pnpm@9` works if it isn't installed), Python 3 for backend tests and packaging.

```bash
pnpm install          # install dependencies
pnpm typecheck        # TypeScript type-check
pnpm test             # Vitest unit tests
python -m pytest tests/py   # backend tests (needs pytest)
pnpm build            # bundle to dist/
pnpm dev              # browser playground with mocked Decky/Steam APIs
pnpm package          # build out/glass-shelf.zip for Decky
```

### Trying it on a Steam Deck

1. On the Deck: Decky settings → **Developer mode** on.
2. On your computer: `pnpm package`, then `scripts/serve.sh` to serve `out/` on your network.
3. On the Deck: Decky → Developer → **Install plugin from URL** and enter the URL printed by `serve.sh`.

### Project layout

| Path | What lives there |
|---|---|
| `src/index.tsx` | Plugin entry: loads settings, patches the Library route, Quick Access settings panel |
| `src/patches/libraryPage.tsx` | Hooks Steam's Library route and swaps in the Spotlight Library |
| `src/library/` | The Spotlight Library UI, data building, sorting, artwork and CSS |
| `src/data/` | Settings, caching, Steam data access, updater |
| `main.py`, `py_modules/glass_shelf/` | Python backend methods the frontend calls via `@decky/api` |
| `playground/` | Vite browser playground with Decky mocks |
| `tests/` | Vitest (TS) and pytest (`tests/py`) suites |

## Releasing

The in-plugin updater checks this repo's GitHub releases. To publish version `X.Y.Z`:

1. Bump `version` in `package.json` and `plugin.json`.
2. `pnpm package`.
3. Create a GitHub release tagged `vX.Y.Z` and attach `out/glass-shelf.zip` (the asset must keep that exact name).
