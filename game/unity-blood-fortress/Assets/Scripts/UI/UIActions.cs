using BloodFortress.Core;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace BloodFortress.UI
{
    public class UIActions : MonoBehaviour
    {
        public void ResumeGame()
        {
            if (GameStateManager.Instance.CurrentState == GameState.Paused)
            {
                GameStateManager.Instance.TogglePause();
            }
        }

        public void RetryCurrentScene()
        {
            Time.timeScale = 1f;
            Scene active = SceneManager.GetActiveScene();
            SceneManager.LoadScene(active.name, LoadSceneMode.Single);
        }

        public void RestartFromGraveyard()
        {
            Time.timeScale = 1f;
            SceneFlowManager.Instance.LoadScene(SceneId.Graveyard, resetRunData: true);
        }

        public void BackToIntro()
        {
            Time.timeScale = 1f;
            SceneFlowManager.Instance.LoadScene(SceneId.IntroCutscene, resetRunData: true);
        }
    }
}
