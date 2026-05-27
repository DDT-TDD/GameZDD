# Changelog - GameZDD

All notable changes to the GameZDD Retro Game Collection will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

---

## [1.1.0] - 2026-05-27

### Added
- Added full support and implementation for all 16 classic games in the collection:
  - Pac-Man
  - Maze Munch (Procedural Mazes)
  - Hero Quest (Lolo Adventure)
  - Tunnel Quest (Mole Mania)
  - Box Pusher (Sokoban)
  - Sokoban Master (100 levels)
  - Super Jumper (Super Mario style physics)
  - Barrel Climber (Donkey Kong style climbing)
  - Chef Rush (BurgerTime walking puzzle)
  - Sailor Quest (Popeye platform jump)
  - Block Fall (Tetris)
  - Memory Cards (Card flip matching)
  - Block Blast (Block clear matching)
  - Brick Breaker (Arkanoid physics breaker)
  - Bubble Pop (Puzzle Bubble matching)
  - Marble Chain (Zuma marble chain shooting)
- Created comprehensive [CHANGELOG.md](CHANGELOG.md) to log project progression and feature releases.
- Verified and fine-tuned core script dependencies and engine classes under the [engine/](engine/) directory.

### Changed
- Upgraded project release to version 1.1.0 in [package.json](package.json) and [launcher.html](launcher.html).
- Patched typography to use modernized, beautiful fonts (Orbitron and Rajdhani) for all games via [scripts/patchFonts.js](scripts/patchFonts.js).
- Migrated default panel designs, labels, and backgrounds to styled retro look via [scripts/patchDarkTheme.js](scripts/patchDarkTheme.js).
- Updated [README.md](README.md) and [QUICK_START.md](QUICK_START.md) to accurately reflect the completed list of 16 playable games, eliminating all placeholder "Coming Soon" statuses.
- Polished the [launcher.html](launcher.html) and [launcher.js](launcher.js) to show exactly 16 games, properly rendering real game progress bars, saved scores, and slot saves.

### Fixed
- Audited all games for playability and verified that control schemes, game loops, audio effects, and level progression systems run smoothly under Electron and standard web browsers.
- Standardized save/load storage keys across all games utilizing [engine/saveManager.js](engine/saveManager.js).
- Updated [package.json](package.json) and packaging parameters in [Launch GameZDD.bat](Launch%20GameZDD.bat) to refer to the new version 1.1.0 release.
