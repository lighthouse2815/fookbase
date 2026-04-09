using UnityEngine;

namespace BloodFortress.Dialogue
{
    [RequireComponent(typeof(Collider2D))]
    public class DialogueTrigger : MonoBehaviour
    {
        [SerializeField] private DialogueSequenceSO sequence;
        [SerializeField] private bool triggerOnce = true;
        [SerializeField] private bool disablePlayerUntilEnd = true;

        private bool _hasTriggered;

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (_hasTriggered && triggerOnce)
            {
                return;
            }

            if (!other.CompareTag("Player"))
            {
                return;
            }

            _hasTriggered = true;
            if (disablePlayerUntilEnd)
            {
                DialogueSystem.Instance.Play(sequence);
            }
            else
            {
                DialogueSystem.Instance.Play(sequence, null);
            }
        }
    }
}
