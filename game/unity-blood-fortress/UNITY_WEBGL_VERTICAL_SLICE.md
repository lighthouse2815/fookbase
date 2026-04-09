# Hiep Si Dang: Phao Dai Mau - Unity 2D WebGL Vertical Slice

## 1. Tom tat kien truc project
Project duoc tach rieng tai `game/unity-blood-fortress` de khong anh huong code web React hien tai.

Kien truc theo module:
- `Core`: Game state, scene flow, pooling, damage contracts, camera effects, boot.
- `Player`: movement, dash, combat, health/respawn.
- `Enemies`: base AI + 4 enemy classes + spawn zone.
- `Boss`: Dr.Phieu state machine, phase transition, faux victory, arena binding.
- `Traps`: hazard controller va hazard group cho phase boss.
- `Dialogue`: sequence data + dialogue runtime + trigger lore.
- `Cutscene`: intro/faux/ending orchestration.
- `Level`: checkpoint, collectible, parallax, scripted horror events, scene transitions.
- `UI`: hp/boss/soul/pause/game over.
- `Audio`: nhac va sfx manager.
- `Data`: ScriptableObject configs de tune nhanh.

## 2. Danh sach scene va luong game
Scene names can bo sung vao Build Settings:
1. `Boot`
2. `IntroCutscene`
3. `Graveyard`
4. `ChapelAndLab`
5. `BossArena`
6. `FauxVictory`
7. `Ending`

Flow:
1. `Boot` -> init singleton -> load `IntroCutscene`
2. `IntroCutscene` -> dialogue Nhi + Dang + Dr.Phieu -> `Graveyard`
3. `Graveyard` -> platform/trap/enemy early game -> transition trigger -> `ChapelAndLab`
4. `ChapelAndLab` -> density cao hon, xac Hiep si Du, scripted horrors -> transition -> `BossArena`
5. `BossArena` -> pre-boss dialogue -> phase 1 / phase 2
6. Player cat HP boss ve 0 -> `FauxVictory`
7. `FauxVictory` cutscene -> `Ending`
8. `Ending` scripted defeat bat buoc cua Dang (khong happy ending)

## 3. Danh sach prefab va he thong chinh
Prefab groups:
- Player:
  - `PlayerRoot` (Rigidbody2D, Collider2D, `PlayerController`, `PlayerCombat`, `PlayerHealth`)
- Enemies:
  - `MutantCrawler`
  - `BrokenLancer`
  - `SewnNun`
  - `FleshTurret`
- Boss:
  - `DrPhieuBoss` (`BossController`)
- Traps:
  - `SpikeTrap`, `SawTrap`, `FallingCeiling`, `FlamePillar`, `ChainSweep`, `AcidPool`, `ExplosiveVial`
- Props/NPC:
  - `NhiDyingNpc`, `DuCorpseStatue`, `HangingCorpse`, `WallHands`, `SilhouetteGhost`
- UI:
  - HUD canvas, Pause panel, GameOver panel, Dialogue panel, Boss bar panel

He thong chinh:
- PlayerController / PlayerCombat / PlayerHealth
- EnemyBase + 4 derived enemy
- BossController + BossArenaController + BossArenaVfxController
- TrapController + BossHazardGroupController
- CollectibleController + CheckpointController
- DialogueSystem + DialogueTrigger + LoreDialogueUnlockTrigger
- CutsceneController + EndingSceneController
- AudioManager + CameraEffectsController + UIManager
- GameStateManager + SceneFlowManager

## 4. Script C# can tao
Tat ca scripts da duoc scaffold trong `Assets/Scripts`:
- `Core/BootLoader.cs`
- `Core/GameStateManager.cs`
- `Core/SceneFlowManager.cs`
- `Core/CameraEffectsController.cs`
- `Core/IDamageable.cs`
- `Core/DamageData.cs`
- `Core/ProjectileDamage.cs`
- `Core/ComponentPool.cs`
- `Core/SingletonMono.cs`
- `Player/PlayerController.cs`
- `Player/PlayerCombat.cs`
- `Player/PlayerHealth.cs`
- `Enemies/EnemyBase.cs`
- `Enemies/MutantCrawlerEnemy.cs`
- `Enemies/BrokenLancerEnemy.cs`
- `Enemies/SewnNunEnemy.cs`
- `Enemies/FleshTurretEnemy.cs`
- `Enemies/EnemySpawnerZone.cs`
- `Boss/BossController.cs`
- `Boss/BossArenaController.cs`
- `Boss/BossArenaVfxController.cs`
- `Traps/TrapController.cs`
- `Traps/BossHazardGroupController.cs`
- `Dialogue/DialogueSequenceSO.cs`
- `Dialogue/DialogueSystem.cs`
- `Dialogue/DialogueTrigger.cs`
- `Dialogue/LoreDialogueUnlockTrigger.cs`
- `Level/CheckpointController.cs`
- `Level/CollectibleController.cs`
- `Level/HorrorEventController.cs`
- `Level/NpcLastWordsController.cs`
- `Level/ParallaxLayerController.cs`
- `Level/SceneTransitionTrigger.cs`
- `Level/LevelSceneBootstrap.cs`
- `Cutscene/CutsceneController.cs`
- `Cutscene/EndingSceneController.cs`
- `Audio/AudioManager.cs`
- `UI/UIManager.cs`
- `UI/UIActions.cs`
- `Data/PlayerConfigSO.cs`
- `Data/EnemyConfigSO.cs`
- `Data/BossConfigSO.cs`
- `Data/TrapConfigSO.cs`
- `Data/CollectibleLoreConfigSO.cs`

## 5. Noi dung cutscene/dialogue
### Intro (Nhi + Dang + voice Dr.Phieu)
- Nhi: "Kingdom nay khong con la vuong quoc. No la lo mo song."
- Dang: "Ta di khap nghia dia, mo bi dao tu ben trong."
- Nhi: "Dr.Phieu tung la thai y hoc gia. Khi dich benh den, han xin quyen mo xe nguoi hap hoi."
- Nhi: "Mau do xuong ham, thit duoc khau vao da. Dan lang bien dang thanh quai."
- Dang: "Hiep si Du da giu cong phia bac den luc guc nga."
- Dr.Phieu (echo): "Dang, nguoi khong den de cuu ai. Nguoi den de cho ta mau."
- Dang: "Ta den de ket thuc ac mong nay, du biet minh se chet."

### Pre-boss
- Dr.Phieu: "Nguoi khong den de cuu ai ca. Nguoi chi den de chet dung cho."
- Dang: "Neu ta phai chet, thi it nhat bong toi se nho ten ta."
- Dr.Phieu: "Khong, Dang. Thu con lai cua nguoi se khong phai cai ten... ma la tieng het."

### Faux victory + Ending
- Dr.Phieu nga xuong trong khoanh khac.
- Loi phao dai song hoac Dr.Phieu noi: "Mau cua nguoi la nguyen lieu cuoi cung."
- Luu trinh ending: Dang that bai, bi nuot vao ket cau song cua lau dai.
- Final line: "Truyen thuyet ve Hiep Si Dang chi con la tieng goi tu tuong da."

## 6. Cach set up trong Unity Editor
1. Open Unity Hub -> Add project folder `game/unity-blood-fortress`.
2. Dung Unity `2022.3.62f1` (xem `ProjectSettings/ProjectVersion.txt`).
3. Confirm Packages from `Packages/manifest.json` are restored.
4. Tao scenes theo ten dung nhu section 2 va add vao Build Settings theo dung thu tu.
5. Tao layers/tag:
   - Tags: `Player`, `Enemy`, `Boss`, `Collectible`, `Trap`
   - Layers: `Ground`, `Player`, `EnemyHitbox`, `PlayerHitbox`, `Hazard`
6. Tao ScriptableObject instances:
   - `PlayerConfig`
   - `EnemyConfig_*` cho 4 enemy
   - `BossConfig_DrPhieu`
   - `TrapConfig_*`
   - `CollectibleLoreConfig`
   - `DialogueSequence_*` (Intro, PreBoss, FauxVictory, Ending, DuLore)
7. Gan scripts vao prefabs/scene objects dung vai tro.
8. Wire UI references cho `UIManager` va `DialogueSystem`.
9. Wire transitions:
   - `BootLoader` trong Boot scene
   - `CutsceneController(kind=Intro)` trong Intro scene
   - `SceneTransitionTrigger` tu Graveyard -> ChapelAndLab -> BossArena
   - `BossArenaController` trong BossArena
   - `CutsceneController(kind=FauxVictory)` trong FauxVictory
   - `CutsceneController(kind=Ending)` hoac `EndingSceneController` trong Ending

## 7. Code day du cho cac script loi
Code da duoc viet day du trong cac file C# sau (khong phai pseudo-code):
- `Assets/Scripts/Player/PlayerController.cs`
- `Assets/Scripts/Player/PlayerCombat.cs`
- `Assets/Scripts/Player/PlayerHealth.cs`
- `Assets/Scripts/Enemies/EnemyBase.cs`
- `Assets/Scripts/Enemies/MutantCrawlerEnemy.cs`
- `Assets/Scripts/Enemies/BrokenLancerEnemy.cs`
- `Assets/Scripts/Enemies/SewnNunEnemy.cs`
- `Assets/Scripts/Enemies/FleshTurretEnemy.cs`
- `Assets/Scripts/Boss/BossController.cs`
- `Assets/Scripts/Traps/TrapController.cs`
- `Assets/Scripts/Dialogue/DialogueSystem.cs`
- `Assets/Scripts/Cutscene/CutsceneController.cs`
- `Assets/Scripts/Core/GameStateManager.cs`
- `Assets/Scripts/Core/SceneFlowManager.cs`
- `Assets/Scripts/UI/UIManager.cs`
- `Assets/Scripts/Audio/AudioManager.cs`
- `Assets/Scripts/Core/CameraEffectsController.cs`

Tat ca module loi tuong tac thong qua state/data layer, de de mo rong va tune balancing.

## 8. Huong dan build WebGL
1. Unity -> File -> Build Settings.
2. Chon platform `WebGL` -> `Switch Platform`.
3. Player Settings:
   - Color Space: `Linear` (neu target browser/device cho phep)
   - Compression Format: `Gzip` hoac `Brotli`
   - Publishing Settings:
     - Decompression Fallback: `On` neu host khong set headers
4. Add scenes theo thu tu:
   - Boot, IntroCutscene, Graveyard, ChapelAndLab, BossArena, FauxVictory, Ending
5. Build vao folder vi du: `Builds/WebGL`.
6. Nhung vao web qua iframe:
   - `index.html` trong output WebGL
7. Test tren Chrome/Edge desktop + mobile browser profile.

## 9. Goi y toi uu WebGL
- Dung sprite atlas de giam draw call.
- Giam texture size placeholders (512/1024), chi tang khi can.
- Han che shader phuc tap; uu tien URP 2D lit/unlit don gian.
- Reuse projectile/hit VFX qua pooling (`ComponentPool`).
- Tranh Instantiate/Destroy lien tuc trong update loops.
- Giam particle count khi build WebGL.
- Tat log debug o production build.
- Boss pattern update theo timer/coroutine thay vi allocations moi frame.
- Audio clips:
  - Music: Vorbis quality vua phai
  - SFX ngan: compressed in memory

## 10. Cho placeholder asset co the thay sau nay
Placeholder areas da duoc chuan hoa de thay art de dang:
- Character sprites + animator clips trong:
  - `Assets/Art/Characters`
  - `Assets/Animations`
- Enemy visual + VFX:
  - `Assets/Art/Enemies`
  - `Assets/Art/VFX`
- Boss visual + mutation forms:
  - `Assets/Art/Boss`
- Environment tiles/parallax props:
  - `Assets/Art/Environment`
- UI skin:
  - `Assets/Art/UI`
- Audio final:
  - `Assets/Audio/Music`
  - `Assets/Audio/SFX`

Asset hooks giu o level Prefab + Animator + ScriptableObject, nen thay visual/audio khong can doi gameplay core.
