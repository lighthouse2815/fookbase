using BloodFortress.Core;
using BloodFortress.Data;
using TMPro;
using UnityEngine;

namespace BloodFortress.Dialogue
{
    [RequireComponent(typeof(Collider2D))]
    public class LoreDialogueUnlockTrigger : MonoBehaviour
    {
        [SerializeField] private CollectibleLoreConfigSO loreConfig;
        [SerializeField] private DialogueSequenceSO hiddenLoreSequence;
        [SerializeField] private TMP_Text worldHintText;

        private bool _consumed;

        private void Start()
        {
            if (worldHintText != null)
            {
                worldHintText.gameObject.SetActive(false);
            }
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (_consumed || !other.CompareTag("Player"))
            {
                return;
            }

            int threshold = loreConfig != null ? loreConfig.unlockThreshold : 10;
            if (GameStateManager.Instance.SoulFragments < threshold)
            {
                if (worldHintText != null)
                {
                    worldHintText.gameObject.SetActive(true);
                    worldHintText.text = $"Need {threshold} soul fragments to awaken Du's memory.";
                }
                return;
            }

            _consumed = true;
            if (worldHintText != null)
            {
                worldHintText.gameObject.SetActive(false);
            }
            DialogueSystem.Instance.Play(hiddenLoreSequence);
        }
    }
}
