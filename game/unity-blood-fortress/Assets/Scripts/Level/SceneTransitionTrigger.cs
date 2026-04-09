using BloodFortress.Core;
using BloodFortress.Dialogue;
using UnityEngine;

namespace BloodFortress.Level
{
    [RequireComponent(typeof(Collider2D))]
    public class SceneTransitionTrigger : MonoBehaviour
    {
        [SerializeField] private SceneId nextScene;
        [SerializeField] private bool resetRunDataOnTransition;
        [SerializeField] private DialogueSequenceSO optionalSequenceBeforeTransition;
        [SerializeField] private float delayAfterDialogue = 0.35f;

        private bool _entered;

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (_entered || !other.CompareTag("Player"))
            {
                return;
            }

            _entered = true;
            if (optionalSequenceBeforeTransition != null)
            {
                DialogueSystem.Instance.Play(optionalSequenceBeforeTransition, TransitionNow);
                return;
            }

            TransitionNow();
        }

        private void TransitionNow()
        {
            Invoke(nameof(LoadNext), delayAfterDialogue);
        }

        private void LoadNext()
        {
            SceneFlowManager.Instance.LoadScene(nextScene, resetRunDataOnTransition);
        }
    }
}
