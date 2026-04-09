using System.Collections;
using BloodFortress.Core;
using BloodFortress.Dialogue;
using UnityEngine;

namespace BloodFortress.Cutscene
{
    public class CutsceneController : MonoBehaviour
    {
        public enum CutsceneKind
        {
            Intro = 0,
            FauxVictory = 1,
            Ending = 2
        }

        [SerializeField] private CutsceneKind kind;
        [SerializeField] private DialogueSequenceSO dialogueSequence;
        [SerializeField] private SceneId nextScene = SceneId.Graveyard;
        [SerializeField] private float postDialogueDelay = 1f;
        [SerializeField] private bool autoLoadNextScene = true;
        [SerializeField] private AudioClip cutsceneMusic;

        private bool _finished;

        private IEnumerator Start()
        {
            if (AudioManager.Instance != null && cutsceneMusic != null)
            {
                AudioManager.Instance.PlayMusic(cutsceneMusic, true);
            }

            switch (kind)
            {
                case CutsceneKind.Intro:
                    GameStateManager.Instance.SetState(GameState.IntroCutscene);
                    break;
                case CutsceneKind.FauxVictory:
                    GameStateManager.Instance.SetState(GameState.FauxVictory);
                    break;
                case CutsceneKind.Ending:
                    GameStateManager.Instance.SetState(GameState.Ending);
                    break;
            }

            bool done = false;
            DialogueSystem.Instance.Play(dialogueSequence, () => done = true);
            while (!done)
            {
                yield return null;
            }

            _finished = true;
            if (!autoLoadNextScene)
            {
                yield break;
            }

            yield return new WaitForSeconds(postDialogueDelay);
            SceneFlowManager.Instance.LoadScene(nextScene);
        }

        private void Update()
        {
            if (kind != CutsceneKind.Ending || !_finished || autoLoadNextScene)
            {
                return;
            }

            if (!Input.GetKeyDown(KeyCode.Return) && !Input.GetKeyDown(KeyCode.R))
            {
                return;
            }

            SceneFlowManager.Instance.LoadScene(SceneId.Graveyard, resetRunData: true);
        }
    }
}
