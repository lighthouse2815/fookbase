using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace BloodFortress.VerticalSlice
{
    public class VerticalSliceDirector : MonoBehaviour
    {
        private enum GamePhase
        {
            IntroDialogue,
            Playing,
            BossDialogue,
            BossFight,
            FauxVictory,
            Ending,
            GameOver,
            Paused
        }

        private readonly struct DialogueLine
        {
            public readonly string Speaker;
            public readonly string Text;

            public DialogueLine(string speaker, string text)
            {
                Speaker = speaker;
                Text = text;
            }
        }

        [SerializeField] private int soulsForHiddenLore = 12;

        private VerticalSlicePlayer _player;
        private VerticalSliceBoss _boss;
        private VerticalSliceCameraFollow _cameraFollow;
        private Transform _levelRoot;

        private GamePhase _phase = GamePhase.IntroDialogue;
        private GamePhase _phaseBeforePause = GamePhase.Playing;
        private readonly Queue<DialogueLine> _dialogueQueue = new();
        private Action _dialogueCompleted;
        private DialogueLine _currentDialogue;
        private bool _dialogueVisible;

        private int _souls;
        private int _playerHp;
        private int _playerMaxHp = 120;
        private bool _loreUnlocked;
        private bool _bossUiVisible;
        private bool _scriptedEndingInProgress;
        private bool _duMomentShown;
        private bool _shadowMomentShown;
        private bool _whisperMomentShown;

        private string _toastText = string.Empty;
        private float _toastTimer;

        private GUIStyle _titleStyle;
        private GUIStyle _bodyStyle;
        private GUIStyle _smallStyle;

        private void Start()
        {
            BuildRuntimeSlice();
            BindEvents();
            BeginIntroDialogue();
        }

        private void Update()
        {
            if (_player == null)
            {
                return;
            }

            _toastTimer = Mathf.Max(0f, _toastTimer - Time.unscaledDeltaTime);

            if (_dialogueVisible && (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Return)))
            {
                AdvanceDialogue();
                return;
            }

            if ((_phase == GamePhase.Playing || _phase == GamePhase.BossFight || _phase == GamePhase.Paused) && Input.GetKeyDown(KeyCode.Escape))
            {
                TogglePause();
            }

            if (_phase == GamePhase.Playing)
            {
                UpdateHorrorMoments();
                TryStartBossIntro();
            }

            if (_phase == GamePhase.GameOver && Input.GetKeyDown(KeyCode.R))
            {
                Time.timeScale = 1f;
                SceneManager.LoadScene(SceneManager.GetActiveScene().name);
            }
        }

        public void AddSoul(int amount)
        {
            _souls += Mathf.Max(1, amount);
            ShowToast("Thu thap: Manh Linh Hon nhuom mau.");

            if (_loreUnlocked || _souls < soulsForHiddenLore)
            {
                return;
            }

            _loreUnlocked = true;
            ShowToast("Lore an mo khoa: 'Trong nha nguyen, Hiep si Du da quyt mau vao da de canh bao Dang.'");
        }

        public void NotifyCheckpointReached()
        {
            ShowToast("Checkpoint kich hoat.");
        }

        private void BuildRuntimeSlice()
        {
            EnsureCamera();

            _levelRoot = new GameObject("VerticalSliceLevel").transform;
            BuildBackground();
            BuildPlatformsAndTraps();
            SpawnPlayer();
            BuildCollectibles();
            BuildEnemiesAndNpc();
            SpawnBoss();
        }

        private void BindEvents()
        {
            _player.HealthChanged += OnPlayerHealthChanged;
            _player.OutOfLives += OnPlayerOutOfLives;
            _player.Respawned += () => ShowToast("Dang dung day tu diem moc.");
            _boss.EnteredPhaseTwo += OnBossPhaseTwo;
            _boss.BossHpDepleted += OnBossHpDepleted;
        }

        private void BeginIntroDialogue()
        {
            _phase = GamePhase.IntroDialogue;
            _player.SetControlEnabled(false);

            BeginDialogue(
                new[]
                {
                    new DialogueLine("Nhi (nu tu hap hoi)", "Dang... dung nhin ve lang nua. Dr.Phieu da bien noi do thanh xuong toi."),
                    new DialogueLine("Dang", "Ta thay mui sat gi va thit chay toi tan tan tim. Cac hiep si khac dau roi?"),
                    new DialogueLine("Nhi", "Nguoi chet, ke hoa dien. Hiep si Du da guc trong nha nguyen khi giu cua cho ta."),
                    new DialogueLine("Giong vong cua Dr.Phieu", "Ta tung la thai y cua vuong quoc. Nay ta la bac si cua su tien hoa."),
                    new DialogueLine("Dang", "Ta khong vao day de lam anh hung. Ta vao day de ket thuc ac mong, du biet minh se chet.")
                },
                () =>
                {
                    _phase = GamePhase.Playing;
                    _player.SetControlEnabled(true);
                    ShowToast("Tien vao Phao Dai Mau.");
                }
            );
        }

        private void TryStartBossIntro()
        {
            if (_boss == null || _boss.Active || _player.transform.position.x < 129f)
            {
                return;
            }

            _phase = GamePhase.BossDialogue;
            _player.SetControlEnabled(false);
            _bossUiVisible = true;

            BeginDialogue(
                new[]
                {
                    new DialogueLine("Dr.Phieu", "Nguoi khong den de cuu ai ca. Nguoi chi den de chet dung cho."),
                    new DialogueLine("Dang", "Neu ta phai chet, thi it nhat bong toi se nho ten ta."),
                    new DialogueLine("Dr.Phieu", "Khong, Dang. Thu con lai cua nguoi se khong phai la cai ten... ma la tieng het.")
                },
                () =>
                {
                    _phase = GamePhase.BossFight;
                    _player.SetControlEnabled(true);
                    _boss.ActivateBoss();
                    ShowToast("Tran chien voi Dr.Phieu bat dau.");
                }
            );
        }

        private void OnPlayerHealthChanged(int hp, int maxHp)
        {
            _playerHp = hp;
            _playerMaxHp = maxHp;
        }

        private void OnPlayerOutOfLives()
        {
            if (_scriptedEndingInProgress)
            {
                return;
            }

            _phase = GamePhase.GameOver;
            _player.SetControlEnabled(false);
            ShowToast("Hiep si Dang da guc nga.");
        }

        private void OnBossPhaseTwo()
        {
            ShowToast("Dr.Phieu bien dang thanh khoi thit song.");
        }

        private void OnBossHpDepleted()
        {
            if (_phase != GamePhase.BossFight)
            {
                return;
            }

            StartCoroutine(FauxVictorySequence());
        }

        private IEnumerator FauxVictorySequence()
        {
            _phase = GamePhase.FauxVictory;
            _player.SetControlEnabled(false);
            _bossUiVisible = false;
            _boss.PlayFalseDeathVisual();
            VerticalSliceCameraFollow.Instance?.Shake(0.45f, 0.4f);
            yield return new WaitForSeconds(0.4f);

            BeginDialogue(
                new[]
                {
                    new DialogueLine("Dang", "Ket thuc roi... ?"),
                    new DialogueLine("Dr.Phieu", "Khong. Ngai vang nay can nguyen lieu cuoi cung.")
                },
                () => StartCoroutine(EndingDefeatSequence())
            );
        }

        private IEnumerator EndingDefeatSequence()
        {
            _phase = GamePhase.Ending;
            _scriptedEndingInProgress = true;
            yield return new WaitForSeconds(0.35f);

            if (_player != null && _player.IsAlive)
            {
                _player.ForceScriptedFinalDefeat();
            }

            BeginDialogue(
                new[]
                {
                    new DialogueLine("Dr.Phieu", "Dang, nguoi chi la manh ghep cuoi de hoan thien pha dai song."),
                    new DialogueLine("Tuong da trong pha dai", "Tieng het cua Dang bi vut vao tung khe da."),
                    new DialogueLine("Narration", "Truyen thuyet ve Hiep si Dang khong con la cai ten... chi con am thanh bi nghien nat trong tuong.")
                },
                () =>
                {
                    _phase = GamePhase.GameOver;
                    _player.SetControlEnabled(false);
                }
            );
        }

        private void TogglePause()
        {
            if (_phase == GamePhase.Paused)
            {
                _phase = _phaseBeforePause;
                Time.timeScale = 1f;
                _player.SetControlEnabled(_phase == GamePhase.Playing || _phase == GamePhase.BossFight);
                return;
            }

            _phaseBeforePause = _phase;
            _phase = GamePhase.Paused;
            Time.timeScale = 0f;
            _player.SetControlEnabled(false);
        }

        private void UpdateHorrorMoments()
        {
            float x = _player.transform.position.x;
            if (!_duMomentShown && x > 52f)
            {
                _duMomentShown = true;
                ShowToast("Moment: Xac Hiep si Du nam guc truoc nha nguyen vo.");
            }

            if (!_shadowMomentShown && x > 86f)
            {
                _shadowMomentShown = true;
                ShowToast("Moment: Bong nguoi lao qua hanh lang roi bien mat.");
            }

            if (!_whisperMomentShown && x > 110f)
            {
                _whisperMomentShown = true;
                ShowToast("Moment: Tieng thi tham goi ten Dang vang trong tuong da.");
            }
        }

        private void BeginDialogue(IEnumerable<DialogueLine> lines, Action onCompleted)
        {
            _dialogueQueue.Clear();
            foreach (DialogueLine line in lines)
            {
                _dialogueQueue.Enqueue(line);
            }

            _dialogueCompleted = onCompleted;
            _dialogueVisible = true;
            AdvanceDialogue();
        }

        private void AdvanceDialogue()
        {
            if (_dialogueQueue.Count > 0)
            {
                _currentDialogue = _dialogueQueue.Dequeue();
                return;
            }

            _dialogueVisible = false;
            Action callback = _dialogueCompleted;
            _dialogueCompleted = null;
            callback?.Invoke();
        }

        private void ShowToast(string text)
        {
            _toastText = text;
            _toastTimer = 2.8f;
        }

        private void EnsureCamera()
        {
            Camera cam = Camera.main;
            if (cam == null)
            {
                GameObject camGo = new("Main Camera");
                cam = camGo.AddComponent<Camera>();
                camGo.tag = "MainCamera";
                cam.orthographic = true;
                cam.orthographicSize = 5.3f;
                cam.backgroundColor = new Color(0.03f, 0.02f, 0.04f, 1f);
            }

            _cameraFollow = cam.GetComponent<VerticalSliceCameraFollow>();
            if (_cameraFollow == null)
            {
                _cameraFollow = cam.gameObject.AddComponent<VerticalSliceCameraFollow>();
            }
        }

        private void BuildBackground()
        {
            GameObject far = VerticalSlicePrefabUtil.CreateSolidBox(
                "FarBackdrop",
                new Vector3(92f, 18f, 0f),
                new Vector2(260f, 80f),
                new Color(0.04f, 0.03f, 0.05f, 1f),
                false,
                _levelRoot
            );
            far.GetComponent<BoxCollider2D>().enabled = false;
            far.GetComponent<SpriteRenderer>().sortingOrder = -50;

            GameObject mist = VerticalSlicePrefabUtil.CreateSolidBox(
                "Mist",
                new Vector3(94f, 3f, 0f),
                new Vector2(240f, 16f),
                new Color(0.18f, 0.03f, 0.03f, 0.15f),
                false,
                _levelRoot
            );
            mist.GetComponent<BoxCollider2D>().enabled = false;
            mist.GetComponent<SpriteRenderer>().sortingOrder = -30;
        }

        private void BuildPlatformsAndTraps()
        {
            CreatePlatform("Ground", new Vector2(95f, -3.7f), new Vector2(240f, 3.2f), new Color(0.14f, 0.1f, 0.1f));
            CreatePlatform("GraveyardStep_01", new Vector2(11f, -0.2f), new Vector2(8f, 0.9f), new Color(0.2f, 0.15f, 0.15f));
            CreatePlatform("GraveyardStep_02", new Vector2(21f, 1.7f), new Vector2(6f, 0.9f), new Color(0.2f, 0.15f, 0.15f));
            CreatePlatform("GraveyardStep_03", new Vector2(30f, 3.1f), new Vector2(5f, 0.9f), new Color(0.21f, 0.13f, 0.13f));

            CreatePlatform("ChapelHall_01", new Vector2(49f, 0.7f), new Vector2(11f, 1f), new Color(0.25f, 0.17f, 0.14f));
            CreatePlatform("ChapelHall_02", new Vector2(63f, 2.4f), new Vector2(7f, 1f), new Color(0.25f, 0.17f, 0.14f));
            CreatePlatform("LabBridge_01", new Vector2(79f, 1.6f), new Vector2(9f, 1f), new Color(0.28f, 0.12f, 0.12f));
            CreatePlatform("LabBridge_02", new Vector2(93f, 3.4f), new Vector2(6f, 1f), new Color(0.28f, 0.12f, 0.12f));
            CreatePlatform("LabBridge_03", new Vector2(106f, 0.8f), new Vector2(12f, 1f), new Color(0.28f, 0.12f, 0.12f));

            CreatePlatform("BossArenaFloor", new Vector2(148f, -1.6f), new Vector2(38f, 0.95f), new Color(0.36f, 0.08f, 0.08f));
            CreatePlatform("BossBackWall", new Vector2(166.8f, 4.7f), new Vector2(1.3f, 15f), new Color(0.3f, 0.08f, 0.08f));
            CreatePlatform("BossFrontWall", new Vector2(128.2f, 4.7f), new Vector2(1.3f, 15f), new Color(0.3f, 0.08f, 0.08f));

            CreateHazard("SpikePit_01", new Vector2(38f, -2.2f), new Vector2(5.5f, 0.6f), 24, new Vector2(0f, 6f));
            CreateHazard("SawTrap_01", new Vector2(56f, -2.05f), new Vector2(2.6f, 0.5f), 20, new Vector2(0f, 5f));
            CreateHazard("ChainSweep_01", new Vector2(73f, 0.1f), new Vector2(0.45f, 3f), 17, new Vector2(5.4f, 3.4f));
            CreateHazard("AcidPool_01", new Vector2(99f, -2.25f), new Vector2(5.2f, 0.65f), 28, new Vector2(0f, 7f));
            CreateHazard("BloodPool_Arena", new Vector2(148f, -2.4f), new Vector2(24f, 0.55f), 26, new Vector2(0f, 8f));

            CreateCheckpoint(new Vector2(33f, -0.15f));
            CreateCheckpoint(new Vector2(95f, 4.1f));
        }

        private void BuildCollectibles()
        {
            Vector2[] soulPoints =
            {
                new(14f, 1.4f), new(22f, 3.1f), new(28f, 4.3f), new(45f, 1.8f),
                new(51f, 2.3f), new(59f, 3.7f), new(67f, 4.4f), new(75f, 2.8f),
                new(83f, 3.8f), new(92f, 4.9f), new(105f, 2.4f), new(113f, 2.2f),
                new(121f, 1.6f), new(136f, 0.8f), new(143f, 1.8f), new(152f, 1.2f)
            };

            for (int i = 0; i < soulPoints.Length; i++)
            {
                GameObject soul = VerticalSlicePrefabUtil.CreateSolidBox(
                    $"SoulFragment_{i:00}",
                    new Vector3(soulPoints[i].x, soulPoints[i].y, 0f),
                    new Vector2(0.45f, 0.45f),
                    new Color(0.95f, 0.75f, 0.2f, 1f),
                    true,
                    _levelRoot
                );
                soul.GetComponent<SpriteRenderer>().sortingOrder = 8;
                VerticalSliceCollectible collectible = soul.AddComponent<VerticalSliceCollectible>();
                collectible.Initialize(this, 1);
            }
        }

        private void BuildEnemiesAndNpc()
        {
            CreateEnemy("DanLangBienDi", new Vector2(26f, -2.2f), new Color(0.56f, 0.38f, 0.38f, 1f), 1f);
            CreateEnemy("HiepSiMucNat", new Vector2(54f, -2.2f), new Color(0.45f, 0.47f, 0.42f, 1f), 1.25f);
            CreateEnemy("NuTuBiKhauMieng", new Vector2(82f, -2.2f), new Color(0.54f, 0.44f, 0.58f, 1f), 1f);
            CreateEnemy("KhoiThitTuong", new Vector2(112f, -2.2f), new Color(0.58f, 0.2f, 0.2f, 1f), 1.4f);

            GameObject duCorpse = VerticalSlicePrefabUtil.CreateSolidBox(
                "Corpse_HiepSiDu",
                new Vector3(71f, -1.35f, 0f),
                new Vector2(2.4f, 0.65f),
                new Color(0.34f, 0.14f, 0.14f, 1f),
                false,
                _levelRoot
            );
            duCorpse.GetComponent<BoxCollider2D>().enabled = false;
            duCorpse.GetComponent<SpriteRenderer>().sortingOrder = 2;
        }

        private void SpawnPlayer()
        {
            GameObject playerGo = VerticalSlicePrefabUtil.CreateSolidBox(
                "HiepSiDang_Player",
                new Vector3(2f, -1.2f, 0f),
                new Vector2(0.8f, 1.4f),
                new Color(0.82f, 0.86f, 0.92f, 1f),
                false,
                _levelRoot
            );
            playerGo.GetComponent<SpriteRenderer>().sortingOrder = 10;

            _player = playerGo.AddComponent<VerticalSlicePlayer>();
            _playerHp = _player.CurrentHp;
            _playerMaxHp = _player.MaxHp;
            _cameraFollow.SetTarget(playerGo.transform);
        }

        private void SpawnBoss()
        {
            GameObject bossGo = VerticalSlicePrefabUtil.CreateSolidBox(
                "DrPhieu_Boss",
                new Vector3(150f, -0.35f, 0f),
                new Vector2(1.8f, 2.6f),
                new Color(0.85f, 0.85f, 0.85f, 1f),
                false,
                _levelRoot
            );
            bossGo.GetComponent<SpriteRenderer>().sortingOrder = 10;
            _boss = bossGo.AddComponent<VerticalSliceBoss>();
            _boss.Initialize(_player);
        }

        private void CreateEnemy(string name, Vector2 position, Color color, float scale)
        {
            GameObject enemyGo = VerticalSlicePrefabUtil.CreateSolidBox(
                name,
                new Vector3(position.x, position.y, 0f),
                new Vector2(0.8f * scale, 1.2f * scale),
                color,
                false,
                _levelRoot
            );
            enemyGo.GetComponent<SpriteRenderer>().sortingOrder = 9;
            VerticalSliceEnemy enemy = enemyGo.AddComponent<VerticalSliceEnemy>();
            enemy.Initialize(_player);
        }

        private void CreateCheckpoint(Vector2 position)
        {
            GameObject checkpoint = VerticalSlicePrefabUtil.CreateSolidBox(
                "Checkpoint",
                new Vector3(position.x, position.y, 0f),
                new Vector2(0.52f, 1.7f),
                new Color(0.55f, 0.18f, 0.12f, 1f),
                true,
                _levelRoot
            );
            checkpoint.GetComponent<SpriteRenderer>().sortingOrder = 8;
            VerticalSliceCheckpoint checkpointScript = checkpoint.AddComponent<VerticalSliceCheckpoint>();
            checkpointScript.Initialize(this);
        }

        private void CreatePlatform(string name, Vector2 position, Vector2 size, Color color)
        {
            GameObject platform = VerticalSlicePrefabUtil.CreateSolidBox(
                name,
                new Vector3(position.x, position.y, 0f),
                size,
                color,
                false,
                _levelRoot
            );
            platform.GetComponent<SpriteRenderer>().sortingOrder = 0;
        }

        private void CreateHazard(string name, Vector2 position, Vector2 size, int damage, Vector2 knockback)
        {
            GameObject hazard = VerticalSlicePrefabUtil.CreateSolidBox(
                name,
                new Vector3(position.x, position.y, 0f),
                size,
                new Color(0.75f, 0.1f, 0.1f, 0.95f),
                true,
                _levelRoot
            );
            hazard.GetComponent<SpriteRenderer>().sortingOrder = 3;
            VerticalSliceHazard hazardScript = hazard.AddComponent<VerticalSliceHazard>();
            hazardScript.Configure(damage, knockback, false);
        }

        private void SetupGui()
        {
            if (_titleStyle != null)
            {
                return;
            }

            _titleStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 24,
                fontStyle = FontStyle.Bold,
                alignment = TextAnchor.MiddleCenter,
                normal = { textColor = new Color(0.96f, 0.86f, 0.84f, 1f) }
            };

            _bodyStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 18,
                wordWrap = true,
                alignment = TextAnchor.UpperLeft,
                normal = { textColor = new Color(0.93f, 0.93f, 0.93f, 1f) }
            };

            _smallStyle = new GUIStyle(GUI.skin.label)
            {
                fontSize = 14,
                wordWrap = true,
                alignment = TextAnchor.MiddleLeft,
                normal = { textColor = new Color(0.88f, 0.84f, 0.8f, 1f) }
            };
        }

        private void OnGUI()
        {
            SetupGui();
            DrawHud();
            DrawDialogue();
            DrawToast();
            DrawOverlayStates();
        }

        private void DrawHud()
        {
            Rect hpBack = new(24f, 20f, 280f, 22f);
            DrawBar(hpBack, _playerMaxHp > 0 ? (float)_playerHp / _playerMaxHp : 0f, new Color(0f, 0f, 0f, 0.55f), new Color(0.84f, 0.12f, 0.12f, 0.95f));
            GUI.Label(new Rect(hpBack.x, hpBack.y - 20f, 330f, 18f), $"HP Dang: {_playerHp}/{_playerMaxHp}", _smallStyle);
            GUI.Label(new Rect(24f, 46f, 300f, 22f), $"Soul Fragments: {_souls}", _smallStyle);

            if (_bossUiVisible && _boss != null && (_phase == GamePhase.BossFight || _phase == GamePhase.FauxVictory))
            {
                Rect bossBack = new(Screen.width - 364f, 20f, 340f, 22f);
                DrawBar(
                    bossBack,
                    _boss.MaxHp > 0 ? Mathf.Clamp01((float)_boss.CurrentHp / _boss.MaxHp) : 0f,
                    new Color(0f, 0f, 0f, 0.6f),
                    new Color(0.74f, 0.05f, 0.05f, 0.95f)
                );
                GUI.Label(new Rect(bossBack.x, bossBack.y - 20f, 340f, 18f), "Dr.Phieu", _smallStyle);
            }
        }

        private void DrawDialogue()
        {
            if (!_dialogueVisible)
            {
                return;
            }

            Rect panel = new(40f, Screen.height - 190f, Screen.width - 80f, 140f);
            DrawFilledRect(panel, new Color(0f, 0f, 0f, 0.72f));
            GUI.Label(new Rect(panel.x + 20f, panel.y + 14f, panel.width - 40f, 26f), _currentDialogue.Speaker, _titleStyle);
            GUI.Label(new Rect(panel.x + 20f, panel.y + 48f, panel.width - 40f, 60f), _currentDialogue.Text, _bodyStyle);
            GUI.Label(new Rect(panel.x + 20f, panel.y + 110f, panel.width - 40f, 22f), "[Space/Enter] tiep tuc", _smallStyle);
        }

        private void DrawToast()
        {
            if (_toastTimer <= 0f || string.IsNullOrWhiteSpace(_toastText))
            {
                return;
            }

            Rect box = new(Screen.width * 0.5f - 280f, 88f, 560f, 34f);
            DrawFilledRect(box, new Color(0f, 0f, 0f, 0.64f));
            GUI.Label(new Rect(box.x + 14f, box.y + 7f, box.width - 20f, 22f), _toastText, _smallStyle);
        }

        private void DrawOverlayStates()
        {
            if (_phase == GamePhase.Paused)
            {
                DrawFilledRect(new Rect(0f, 0f, Screen.width, Screen.height), new Color(0f, 0f, 0f, 0.55f));
                GUI.Label(new Rect(0f, Screen.height * 0.45f, Screen.width, 40f), "PAUSED", _titleStyle);
                GUI.Label(new Rect(0f, Screen.height * 0.45f + 38f, Screen.width, 30f), "Nhan ESC de tiep tuc.", _smallStyle);
            }

            if (_phase != GamePhase.GameOver)
            {
                return;
            }

            DrawFilledRect(new Rect(0f, 0f, Screen.width, Screen.height), new Color(0f, 0f, 0f, 0.67f));
            GUI.Label(new Rect(0f, Screen.height * 0.43f, Screen.width, 42f), "THE LAST KNIGHT FELL", _titleStyle);
            GUI.Label(new Rect(0f, Screen.height * 0.43f + 40f, Screen.width, 30f), "Nhan R de choi lai.", _smallStyle);
        }

        private void DrawBar(Rect rect, float ratio, Color background, Color fill)
        {
            DrawFilledRect(rect, background);
            Rect fillRect = new(rect.x + 2f, rect.y + 2f, (rect.width - 4f) * Mathf.Clamp01(ratio), rect.height - 4f);
            DrawFilledRect(fillRect, fill);
        }

        private static void DrawFilledRect(Rect rect, Color color)
        {
            Color previous = GUI.color;
            GUI.color = color;
            GUI.DrawTexture(rect, Texture2D.whiteTexture);
            GUI.color = previous;
        }
    }
}
