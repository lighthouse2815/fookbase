using System.Collections;
using BloodFortress.Dialogue;
using UnityEngine;

namespace BloodFortress.Level
{
    [RequireComponent(typeof(Collider2D))]
    public class NpcLastWordsController : MonoBehaviour
    {
        [SerializeField] private DialogueSequenceSO lastWordsSequence;
        [SerializeField] private Animator dyingNpcAnimator;
        [SerializeField] private string deathTrigger = "Die";
        [SerializeField] private bool triggerOnce = true;

        private bool _triggered;

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (_triggered && triggerOnce)
            {
                return;
            }

            if (!other.CompareTag("Player"))
            {
                return;
            }

            _triggered = true;
            StartCoroutine(RunLastWordsRoutine());
        }

        private IEnumerator RunLastWordsRoutine()
        {
            bool done = false;
            DialogueSystem.Instance.Play(lastWordsSequence, () => done = true);
            while (!done)
            {
                yield return null;
            }

            if (dyingNpcAnimator != null)
            {
                dyingNpcAnimator.SetTrigger(deathTrigger);
            }
        }
    }
}
