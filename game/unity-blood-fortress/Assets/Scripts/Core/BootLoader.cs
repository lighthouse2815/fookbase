using System.Collections;
using UnityEngine;

namespace BloodFortress.Core
{
    public class BootLoader : MonoBehaviour
    {
        [SerializeField] private float bootDelaySeconds = 0.2f;

        private IEnumerator Start()
        {
            // Ensure singleton services are alive before moving to intro.
            _ = GameStateManager.Instance;
            _ = SceneFlowManager.Instance;

            GameStateManager.Instance.ResetRunData();
            GameStateManager.Instance.SetState(GameState.Boot);

            yield return new WaitForSeconds(bootDelaySeconds);
            SceneFlowManager.Instance.LoadScene(SceneId.IntroCutscene);
        }
    }
}
