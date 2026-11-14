# Glass Shelf

A [Decky Loader](https://decky.xyz) plugin for Steam's Game Mode that replaces **Home** and the **Library** with a glassy Spotlight design: full-bleed game art behind smoked-glass panels.

> **Status: early development (0.x).** The MVP is in place; next comes understanding and optimizing the core, then deliberate plugin integrations. Expect breaking changes.

## Credits

Glass Shelf is a fork of **Glance Library** by [shak18](https://github.com/shak18), which grew out of **[Game Glance](https://github.com/michpalm/game-glance)** by Michael Palma. Spotlight Home is ported from Game Glance 3.4.0. Both projects are MIT licensed; see [LICENSE](LICENSE) and [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).

## Roadmap

1. ~~**MVP**: remove HowLongToBeat, third-party plugin integrations (TabMaster, Unifideck, Heroic) and settings.~~ Done.
2. **Optimize**: understand, simplify and speed up the core library view.
3. **Integrations**: detect popular Decky plugins that conflict with or complement the Glass UI, and support them deliberately.

## Features (current)

### Spotlight Home
- **Hero**: the selected recent game's art full-screen, with its title, last played, play time and achievements.
- **Actions**: Play (or Resume / Download / Update with progress), controller settings, game info, Steam Cloud status.
- **Recent games row**: L1/R1 or Left/Right to move through your recent games, ending in a card that opens the Library.
- **Feed** (press Down): What's New (news and recently updated games), Friends (who's playing what), Recommended (games to play next and wishlist deals), Collections.
- **Status bar**: clock, battery, connection and your avatar.
- **Safe fallback**: if Home fails to render, Steam's own Home is shown.

### Spotlight Library
- **Grid and inspector**: replaces `/library`, `/library/games` and `/library/all` with a game grid plus an inspector panel (artwork, play time, achievements, install size, description).
- **Accent glow** sampled from each game's hero art.
- **Controller and touch**: D-pad/stick navigation, L1/R1 to switch tabs, View for the game menu, B to go back.
- **Collections**: fanned covers with automatic console icons, plus **Customize Art** (Y) for a custom image or icon per collection.
- **Safe fallback**: if the Library fails to render, Steam's own Library is shown.

### No settings

Glass Shelf is opinionated: there is nothing to configure. The fixed choices live in `src/library/design.ts` and as constants in `src/home/`. It only remembers what you choose inside the library: the sort order and any custom collection art. To turn it off, disable the plugin in Decky.

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
| `src/index.tsx` | Plugin entry: loads prefs, patches the Home and Library routes, Quick Access panel |
| `src/patches/` | Hook Steam's Home and Library routes and swap in the Spotlight views |
| `src/home/` | Spotlight Home: hero, actions, recent games row, feed sheet, status bar and their CSS |
| `src/library/` | The Spotlight Library UI, data building, sorting, artwork, CSS and fixed design constants |
| `src/data/` | Remembered prefs, caching, Steam data access, updater |
| `main.py`, `py_modules/glass_shelf/` | Python backend methods the frontend calls via `@decky/api` |
| `playground/` | Vite browser playground with Decky mocks |
| `tests/` | Vitest (TS) and pytest (`tests/py`) suites |

## Releasing

Releases are built and published by GitHub Actions (`.github/workflows/release.yml`); the in-plugin updater picks them up from this repo's releases.

1. `pnpm bump 0.2.0` sets the version in `package.json` and `plugin.json`. Commit it as `chore(release): v0.2.0` and get it onto `main` (directly or through a PR).
2. Tag the commit on `main` and push the tag, which starts the Release workflow:
   ```bash
   git switch main && git pull
   git tag v0.2.0
   git push origin v0.2.0
   ```

The workflow checks the tag matches both version fields, runs typecheck and all tests, packages `glass-shelf.zip`, and creates a GitHub release with generated notes and the zip attached.

A tag with a suffix (`pnpm bump 0.2.0-beta.1`, tag `v0.2.0-beta.1`) is published as a **pre-release**: the updater ignores those, so they're safe for testing on your own Deck.
