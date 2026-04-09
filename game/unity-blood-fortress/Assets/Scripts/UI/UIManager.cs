using BloodFortress.Core;
using BloodFortress.Player;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace BloodFortress.UI
{
    public sealed class UIManager : SingletonMono<UIManager>
    {
        [Header("Player UI")]
        [SerializeField] private Slider playerHpBar;
        [SerializeField] private TMP_Text playerHpText;
        [SerializeField] private TMP_Text soulText;

        [Header("Boss UI")]
        [SerializeField] private CanvasGroup bossPanel;
        [SerializeField] private Slider bossHpBar;
        [SerializeField] private TMP_Text bossNameText;

        [Header("Overlay Panels")]
        [SerializeField] private CanvasGroup pausePanel;
        [SerializeField] private CanvasGroup gameOverPanel;

        private PlayerHealth _playerHealth;

        protected override bool Persistent => false;

        private void OnEnable()
        {
            if (GameStateManager.Instance != null)
            {
                GameStateManager.Instance.OnStateChanged += HandleStateChanged;
                GameStateManager.Instance.OnSoulChanged += HandleSoulChanged;
            }
        }

        private void OnDisable()
        {
            if (GameStateManager.Instance != null)
            {
                GameStateManager.Instance.OnStateChanged -= HandleStateChanged;
                GameStateManager.Instance.OnSoulChanged -= HandleSoulChanged;
            }
        }

        private void Start()
        {
            SetPanelVisible(pausePanel, false);
            SetPanelVisible(gameOverPanel, false);
            SetBossVisible(false);
            RefreshSoulCounter(GameStateManager.Instance != null ? GameStateManager.Instance.SoulFragments : 0);
        }

        public void RegisterPlayer(PlayerHealth playerHealth)
        {
            _playerHealth = playerHealth;
            SetPlayerHealth(playerHealth.CurrentHp, playerHealth.MaxHp);
        }

        public void SetPlayerHealth(int current, int max)
        {
            if (playerHpBar != null)
            {
                playerHpBar.maxValue = max;
                playerHpBar.value = current;
            }

            if (playerHpText != null)
            {
                playerHpText.text = $"HP {current}/{max}";
            }
        }

        public void RefreshSoulCounter(int current)
        {
            if (soulText != null)
            {
                soulText.text = $"Soul Fragments: {current}";
            }
        }

        public void SetBossVisible(bool visible, string bossName = "Dr.Phieu")
        {
            SetPanelVisible(bossPanel, visible);
            if (visible && bossNameText != null)
            {
                bossNameText.text = bossName;
            }
        }

        public void SetBossHealth(float normalized)
        {
            if (bossHpBar != null)
            {
                bossHpBar.value = Mathf.Clamp01(normalized);
            }
        }

        public void ShowGameOver(bool visible)
        {
            SetPanelVisible(gameOverPanel, visible);
        }

        private void HandleStateChanged(GameState previous, GameState current)
        {
            SetPanelVisible(pausePanel, current == GameState.Paused);
            if (current == GameState.GameOver)
            {
                SetPanelVisible(gameOverPanel, true);
            }
        }

        private void HandleSoulChanged(int current, int threshold)
        {
            RefreshSoulCounter(current);
        }

        private static void SetPanelVisible(CanvasGroup panel, bool visible)
        {
            if (panel == null)
            {
                return;
            }

            panel.alpha = visible ? 1f : 0f;
            panel.interactable = visible;
            panel.blocksRaycasts = visible;
        }
    }
}
