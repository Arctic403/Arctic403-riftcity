# SINGLE PLAYER GDD — RiftCity (one-page)

## Purpose
Focus RiftCity on a polished, enjoyable single-player experience before reintroducing multiplayer. This document defines the core loop, player activities, progression, onboarding, encounters, and a short sprint backlog so we can ship a satisfying solo experience quickly.

## One-line core loop
Explore → Encounter → Resolve → Reward → Upgrade

## Core player activities (3–5)
- Exploration: move, discover landmarks, and find encounters/loot.
- Combat/Encounters: engage AI foes or environmental challenges with shoot/avoid/use mechanics.
- Resolution: defeat or circumvent encounters using player skill and resources.
- Reward & Upgrade: pick up loot/currency, choose meaningful upgrades.
- Short-term goals: reach next checkpoint/area or clear a named encounter.

## Design goals & acceptance criteria
- Fun repeatable loop: Playtesters can complete the core loop in 5–10 minutes and feel motivated to repeat it.
- Tight controls: Movement, aiming, and input have no perceptible lag and feel responsive.
- Clear progression: Players make meaningful upgrade choices with visible effects.
- Predictable difficulty: Encounters scale and avoid exploit loops.
- Onboarding: New players complete the tutorial and first encounter within 2 minutes.
- Save/resume: Progress persists across sessions; no unintended progress loss.

## Progression model (short)
- Currency: small pickups (scrap) from encounters and exploration.
- Upgrades: short-term (consumables), mid-term (weapons/abilities), long-term (unlocked systems).
- Upgrade choices present trade-offs (e.g., damage vs. mobility).
- Clear visual feedback for upgrade impact (numbers, UI tooltips).

## Tutorial & Onboarding
- Entry: short interactive tutorial scene that teaches movement, aiming, and the first combat mechanic.
- Contextual hints: subtle UI hints appear during first playthrough for new mechanics.
- Acceptance: A new player completes movement + first combat encounter without external instructions.

## AI & Encounter templates (start with 5)
1. Grunt swarm (1–4 weak enemies): teaches aim & area control.
2. Ranger (medium enemy with ranged attacks): teaches dodging and cover use.
3. Heavy (tanky foe with slow, telegraphed attacks): teaches timing and resource use.
4. Ambush (enemies spawn during exploration): teaches scanning and threat prioritization.
5. Mini-boss (mixed attack patterns, stage change): teaches patterns and escape mechanics.

Spawner/Tuning notes:
- Each encounter has a difficulty parameter (easy/medium/hard) and a budget value.
- Use data-driven tuning (config file or JSON) so designers can adjust spawn counts, health, damage, and reward values without recompiling.

## Save system & checkpoints
- Lightweight checkpoint per region/encounter completion.
- Autosave on checkpoint + manual save option in the pause menu.
- On crash, restore to last checkpoint; acceptance: no lost progress beyond last checkpoint.

## UX / HUD (must-haves)
- Health and resource bars.
- Enemy indicators (directional off-screen markers) and target health for focused foes.
- Loot pickup popups and a compact inventory/upgrade UI.

## Telemetry (minimal)
Events to record:
- Session start/end, tutorial completion, encounter start/end, death location, upgrade choices.
Purpose: collect data from early playtests (target >=20 sessions) to iterate balance.

## Short sprint backlog (first 2 weeks)
1. Implement one-page GDD (this file).
2. Add basic save/checkpoint system (file-based).
3. Implement interactive tutorial scene (movement + first combat mechanic).
4. Create spawner and 5 encounter templates, data-driven tuning configs.
5. Add simple telemetry hooks for tutorial completion and deaths.
6. Polish controls (input mapping and responsiveness) and add basic HUD elements.

## Implementation notes & priorities
- Make tuning data editable at runtime if engine supports it (hot-reload). Otherwise, keep a JSON/YAML config file.
- Start with deterministic AI (no networking) and deterministic spawn patterns for balancing.
- Keep single-player systems isolated from multiplayer code (feature flags or modularization) to avoid regressions when multiplayer returns.

## Next steps (recommended immediate actions)
- Implement items 2–6 from the sprint backlog.
- Playtest a loop build internally, collect telemetry from 20 sessions, and iterate balance.



