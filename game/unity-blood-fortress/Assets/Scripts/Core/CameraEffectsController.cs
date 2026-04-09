using System.Collections;
using UnityEngine;
using UnityEngine.UI;

namespace BloodFortress.Core
{
    public sealed class CameraEffectsController : SingletonMono<CameraEffectsController>
    {
        [SerializeField] private Camera targetCamera;
        [SerializeField] private CanvasGroup hitFlashOverlay;
        [SerializeField] private CanvasGroup vignetteOverlay;
        [SerializeField] private float maxShakeOffset = 0.55f;
        [SerializeField] private float shakeDecay = 4.8f;

        private Vector3 _cameraOriginLocal;
        private float _shakeStrength;
        private float _shakeTimeLeft;

        protected override bool Persistent => false;

        private void Start()
        {
            if (targetCamera == null)
            {
                targetCamera = Camera.main;
            }

            if (targetCamera != null)
            {
                _cameraOriginLocal = targetCamera.transform.localPosition;
            }
        }

        private void Update()
        {
            UpdateShake();
        }

        public void Shake(float strength, float duration)
        {
            _shakeStrength = Mathf.Max(_shakeStrength, strength);
            _shakeTimeLeft = Mathf.Max(_shakeTimeLeft, duration);
        }

        public void FlashHit(float duration = 0.12f, float alpha = 0.7f)
        {
            if (hitFlashOverlay == null)
            {
                return;
            }

            StopCoroutine(nameof(HitFlashRoutine));
            StartCoroutine(HitFlashRoutine(duration, alpha));
        }

        public void SetLowHealthVignette(float normalizedIntensity)
        {
            if (vignetteOverlay == null)
            {
                return;
            }

            vignetteOverlay.alpha = Mathf.Clamp01(normalizedIntensity);
        }

        private void UpdateShake()
        {
            if (targetCamera == null)
            {
                return;
            }

            if (_shakeTimeLeft <= 0f || _shakeStrength <= 0f)
            {
                targetCamera.transform.localPosition = _cameraOriginLocal;
                return;
            }

            _shakeTimeLeft -= Time.unscaledDeltaTime;
            _shakeStrength = Mathf.MoveTowards(_shakeStrength, 0f, shakeDecay * Time.unscaledDeltaTime);

            float offsetX = Random.Range(-1f, 1f) * _shakeStrength * maxShakeOffset;
            float offsetY = Random.Range(-1f, 1f) * _shakeStrength * maxShakeOffset;
            targetCamera.transform.localPosition = _cameraOriginLocal + new Vector3(offsetX, offsetY, 0f);
        }

        private IEnumerator HitFlashRoutine(float duration, float alpha)
        {
            hitFlashOverlay.alpha = alpha;
            yield return new WaitForSeconds(duration);
            hitFlashOverlay.alpha = 0f;
        }
    }
}
