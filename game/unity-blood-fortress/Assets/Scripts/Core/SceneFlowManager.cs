using System.Collections;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace BloodFortress.Core
{
    public enum SceneId
    {
        Boot = 0,
        IntroCutscene = 1,
        Graveyard = 2,
        ChapelAndLab = 3,
        BossArena = 4,
        FauxVictory = 5,
        Ending = 6
    }

    public sealed class SceneFlowManager : SingletonMono<SceneFlowManager>
    {
        [Header("Scene Names")]
        [SerializeField] private string bootScene = "Boot";
        [SerializeField] private string introScene = "IntroCutscene";
        [SerializeField] private string graveyardScene = "Graveyard";
        [SerializeField] private string chapelAndLabScene = "ChapelAndLab";
        [SerializeField] private string bossArenaScene = "BossArena";
        [SerializeField] private string fauxVictoryScene = "FauxVictory";
        [SerializeField] private string endingScene = "Ending";

        private bool _isLoading;

        protected override bool Persistent => true;

        public void LoadScene(SceneId sceneId, bool resetRunData = false)
        {
            if (_isLoading)
            {
                return;
            }

            StartCoroutine(LoadSceneRoutine(sceneId, resetRunData));
        }

        private IEnumerator LoadSceneRoutine(SceneId sceneId, bool resetRunData)
        {
            _isLoading = true;

            if (resetRunData)
            {
                GameStateManager.Instance.ResetRunData();
            }

            string sceneName = ResolveSceneName(sceneId);
            AsyncOperation operation = SceneManager.LoadSceneAsync(sceneName, LoadSceneMode.Single);
            while (!operation.isDone)
            {
                yield return null;
            }

            _isLoading = false;
        }

        public string ResolveSceneName(SceneId sceneId)
        {
            return sceneId switch
            {
                SceneId.Boot => bootScene,
                SceneId.IntroCutscene => introScene,
                SceneId.Graveyard => graveyardScene,
                SceneId.ChapelAndLab => chapelAndLabScene,
                SceneId.BossArena => bossArenaScene,
                SceneId.FauxVictory => fauxVictoryScene,
                SceneId.Ending => endingScene,
                _ => graveyardScene,
            };
        }
    }
}
