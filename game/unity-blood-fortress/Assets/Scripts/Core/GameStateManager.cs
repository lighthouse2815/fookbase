using System;
using UnityEngine;

namespace BloodFortress.Core
{
    public enum GameState
    {
        Boot = 0,
        IntroCutscene = 1,
        Gameplay = 2,
        BossIntro = 3,
        BossFight = 4,
        FauxVictory = 5,
        Ending = 6,
        Paused = 7,
        GameOver = 8
    }

    public sealed class GameStateManager : SingletonMono<GameStateManager>
    {
        [SerializeField] private int loreUnlockThreshold = 12;

        public event Action<GameState, GameState> OnStateChanged;
        public event Action<int, int> OnSoulChanged;
        public event Action<bool> OnLoreUnlocked;

        public GameState CurrentState { get; private set; } = GameState.Boot;
        public int SoulFragments { get; private set; }
        public bool LoreUnlocked { get; private set; }
        public GameState StateBeforePause { get; private set; } = GameState.Gameplay;

        public bool IsGameplayState =>
            CurrentState == GameState.Gameplay ||
            CurrentState == GameState.BossFight;

        protected override bool Persistent => true;

        public void SetState(GameState nextState)
        {
            if (CurrentState == nextState)
            {
                return;
            }

            GameState previous = CurrentState;
            CurrentState = nextState;

            Time.timeScale = nextState == GameState.Paused ? 0f : 1f;
            OnStateChanged?.Invoke(previous, nextState);
        }

        public void SetGameplayState(GameState nextState)
        {
            if (nextState != GameState.Gameplay && nextState != GameState.BossFight && nextState != GameState.BossIntro)
            {
                Debug.LogWarning($"Ignored SetGameplayState call with unsupported value: {nextState}");
                return;
            }

            SetState(nextState);
        }

        public void TogglePause()
        {
            if (CurrentState == GameState.Paused)
            {
                SetState(StateBeforePause);
                return;
            }

            if (CurrentState == GameState.Gameplay || CurrentState == GameState.BossFight)
            {
                StateBeforePause = CurrentState;
                SetState(GameState.Paused);
            }
        }

        public void RequestGameOver()
        {
            SetState(GameState.GameOver);
        }

        public void AddSoulFragment(int amount = 1)
        {
            SoulFragments = Mathf.Max(0, SoulFragments + amount);
            OnSoulChanged?.Invoke(SoulFragments, loreUnlockThreshold);

            if (LoreUnlocked || SoulFragments < loreUnlockThreshold)
            {
                return;
            }

            LoreUnlocked = true;
            OnLoreUnlocked?.Invoke(true);
        }

        public void ResetRunData()
        {
            SoulFragments = 0;
            LoreUnlocked = false;
            OnSoulChanged?.Invoke(SoulFragments, loreUnlockThreshold);
            OnLoreUnlocked?.Invoke(false);
            Time.timeScale = 1f;
        }
    }
}
