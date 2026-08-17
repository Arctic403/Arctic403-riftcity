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

## Save system & checkpoints (updated)
We allow randomness and hand-tuned variance in outcomes, but saves must still support reproducible debugging when needed.

- Save format: Local JSON save as canonical (human-readable and versioned). Keep lightweight checkpoints for progress.
  - Example structure (high level):
    {
      "version": "1.0",
      "player_id": "<uuid>",
      "timestamp": "<iso>",
      "checkpoint_id": "<region_or_encounter>",
      "player_state": { /* health, inventory, upgrades etc. */ },
      "choice_history": [ {"encounter":"e1","choice":"c2","time":"..."}, ... ],
      "rng_seed": 123456789,
      "notes": { /* optional debug metadata */ }
    }
- Randomness and tuned variance:
  - Outcomes may include randomized elements (loot rolls, procedural modifiers, RNG-driven spawn timings) and designer-tuned variance (hand-placed modifiers, scripted behaviors).
  - To support reproducible debugging, the save includes an rng_seed that initialises the game RNG when loading a checkpoint. Loading with the same choice_history + rng_seed should reproduce the same sequence of RNG-based events.
  - Designers may also optionally record "event_seeds" for long-running encounters that need separate determinism.
- Checkpoint behavior:
  - Autosave on checkpoint reach and allow manual save in pause menu.
  - On load, restore player_state, choice_history, and re-seed RNG with saved rng_seed. If a designer wants true non-determinism, they can ignore the saved seed and generate a new one (but include that choice in telemetry).
  - Acceptance: No lost progress beyond last checkpoint; ability to reproduce a session for debugging when using saved seeds.
- Hospitalization, not death:
  - Players do not die in RiftCity; when health or critical status would otherwise cause a death state, the player becomes hospitalized.
  - Hospitalization transitions the player to a hospital state/scene where recovery options are presented (immediate revive with penalty, wait and recover, or use items/currency to speed recovery).
  - Hospitalization consequences are designer-tuned: examples include loss of a fraction of carried currency, temporary stat penalties, time penalty, or forced respawn at a nearby hospital checkpoint.
  - On hospitalization, the save system should record the event in choice_history and may optionally advance the rng_seed for subsequent events; the canonical save restores the player to the hospital/respawn point consistent with the checkpoint rules.
  - Acceptance: Players never permanently lose their character; hospitalization is a recoverable state with clear player-facing feedback on penalties and options.
- Replay & partial determinism:
  - Full replay (input recording) is optional — we prioritise lightweight JSON saves. If full replay is needed for QA, we can add an input log that records player inputs or deterministic event logs.
- Save compatibility & versioning:
  - Include a version string in the save file and upgrade code to migrate older saves if formats change.
- Cloud sync (optional):
  - Keep local JSON as canonical; later we can add optional cloud sync (encrypted) or export features, but do not rely on cloud for basic playtests.

## UX / HUD (must-haves)
- Health and resource bars.
- Enemy indicators (directional off-screen markers) and target health for focused foes.
- Loot pickup popups and a compact inventory/upgrade UI.

## Telemetry (minimal)
Events to record:
- Session start/end, tutorial completion, encounter start/end, hospitalization events and locations, upgrade choices.
Purpose: collect data from early playtests (target >=20 sessions) to inform balance.

## Short sprint backlog (first 2 weeks)
1. Implement one-page GDD (this file).
2. Add basic save/checkpoint system (file-based) with rng_seed support.
3. Implement interactive tutorial scene (movement + first combat mechanic).
4. Create spawner and 5 encounter templates, data-driven tuning configs.
5. Add simple telemetry hooks for tutorial completion and hospitalization events.
6. Polish controls (input mapping and responsiveness) and add basic HUD elements.

## Implementation notes & priorities
- Make tuning data editable at runtime if engine supports it (hot-reload). Otherwise, keep a JSON/YAML config file.
- Start with deterministic AI (no networking) and deterministic spawn patterns for balancing; introduce tuned variance and randomness per the save spec above.
- Keep single-player systems isolated from multiplayer code (feature flags or modularization) to avoid regressions when multiplayer returns.

## Next steps (recommended immediate actions)
- Implement items 2–6 from the sprint backlog.
- Playtest a loop build internally, collect telemetry from 20 sessions, and iterate balance.
