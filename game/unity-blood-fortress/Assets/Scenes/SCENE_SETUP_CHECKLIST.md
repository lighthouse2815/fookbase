# Scene Setup Checklist

## Boot
- Create empty `Bootstrap` object
- Attach:
  - `GameStateManager`
  - `SceneFlowManager`
  - `AudioManager`
  - `BootLoader`

## IntroCutscene
- `CutsceneController` with `kind = Intro`, next scene `Graveyard`
- Dialogue canvas + `DialogueSystem`
- Nhi NPC model, Dr.Phieu echo SFX source, gothic background layers

## Graveyard
- `LevelSceneBootstrap` with state `Gameplay`
- Player prefab + HUD
- Early traps + weak enemies
- At least one `HorrorEventController`
- Exit `SceneTransitionTrigger` to `ChapelAndLab`

## ChapelAndLab
- Add denser props: chains, surgery tables, blood writings
- Place `NpcLastWordsController` for wounded NPC beat
- Place `LoreDialogueUnlockTrigger` near Du corpse
- More enemy composition and trap combos
- Exit `SceneTransitionTrigger` to `BossArena`

## BossArena
- `BossArenaController` + `BossController`
- `BossHazardGroupController`
- Strong camera and red pulse VFX setup
- Pre-boss dialogue sequence

## FauxVictory
- `CutsceneController` with `kind = FauxVictory`, next scene `Ending`
- Frame boss false death, then reveal final trap

## Ending
- `CutsceneController` with `kind = Ending`
- Optional `EndingSceneController` for restart input
- Final visual: Dang consumed by living fortress
