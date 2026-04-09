using BloodFortress.Core;
using TMPro;
using UnityEngine;
using UnityEngine.Events;

namespace BloodFortress.Level
{
    [RequireComponent(typeof(Collider2D))]
    public class HorrorEventController : MonoBehaviour
    {
        public enum HorrorEventType
        {
            HangingCorpseSwing = 0,
            BackgroundSilhouetteDash = 1,
            WallHandEmerge = 2,
            WhisperNameFromStone = 3,
            DyingNpcLastLine = 4
        }

        [SerializeField] private HorrorEventType eventType;
        [SerializeField] private bool triggerOnce = true;
        [SerializeField] private AudioClip eventSfx;
        [SerializeField] private TMP_Text optionalSubtitle;
        [SerializeField] private string subtitleText = "Dang...";
        [SerializeField] private Animator linkedAnimator;
        [SerializeField] private string animatorTrigger = "Trigger";
        [SerializeField] private UnityEvent onTriggered;

        private bool _triggered;

        private void Start()
        {
            if (optionalSubtitle != null)
            {
                optionalSubtitle.gameObject.SetActive(false);
            }
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!other.CompareTag("Player"))
            {
                return;
            }

            if (_triggered && triggerOnce)
            {
                return;
            }

            _triggered = true;
            ExecuteEvent();
        }

        private void ExecuteEvent()
        {
            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySfx(eventSfx);
            }

            if (linkedAnimator != null && !string.IsNullOrWhiteSpace(animatorTrigger))
            {
                linkedAnimator.SetTrigger(animatorTrigger);
            }

            if (optionalSubtitle != null && !string.IsNullOrWhiteSpace(subtitleText))
            {
                optionalSubtitle.gameObject.SetActive(true);
                optionalSubtitle.text = subtitleText;
            }

            if (CameraEffectsController.Instance != null)
            {
                float shake = eventType == HorrorEventType.WhisperNameFromStone ? 0.35f : 0.6f;
                CameraEffectsController.Instance.Shake(shake, 0.25f);
            }

            onTriggered?.Invoke();
        }
    }
}
