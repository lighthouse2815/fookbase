using BloodFortress.Core;
using UnityEngine;

namespace BloodFortress.Cutscene
{
    public class EndingSceneController : MonoBehaviour
    {
        [SerializeField] private KeyCode retryKey = KeyCode.R;
        [SerializeField] private KeyCode retryAltKey = KeyCode.Return;

        private void Update()
        {
            if (!Input.GetKeyDown(retryKey) && !Input.GetKeyDown(retryAltKey))
            {
                return;
            }

            SceneFlowManager.Instance.LoadScene(SceneId.Graveyard, resetRunData: true);
        }
    }
}
