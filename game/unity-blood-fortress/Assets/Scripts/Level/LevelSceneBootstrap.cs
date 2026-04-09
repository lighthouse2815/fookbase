using BloodFortress.Core;
using BloodFortress.UI;
using UnityEngine;

namespace BloodFortress.Level
{
    public class LevelSceneBootstrap : MonoBehaviour
    {
        [SerializeField] private GameState stateOnSceneStart = GameState.Gameplay;
        [SerializeField] private bool resetRunDataOnStart;
        [SerializeField] private AudioClip sceneMusic;

        private void Start()
        {
            if (resetRunDataOnStart)
            {
                GameStateManager.Instance.ResetRunData();
            }

            GameStateManager.Instance.SetState(stateOnSceneStart);
            UIManager.Instance?.RefreshSoulCounter(GameStateManager.Instance.SoulFragments);

            if (AudioManager.Instance != null && sceneMusic != null)
            {
                AudioManager.Instance.PlayMusic(sceneMusic, true);
            }
        }
    }
}
