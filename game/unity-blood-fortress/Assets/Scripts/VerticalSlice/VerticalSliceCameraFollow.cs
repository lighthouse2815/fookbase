using UnityEngine;

namespace BloodFortress.VerticalSlice
{
    [RequireComponent(typeof(Camera))]
    public class VerticalSliceCameraFollow : MonoBehaviour
    {
        public static VerticalSliceCameraFollow Instance { get; private set; }

        [SerializeField] private float smoothTime = 0.13f;
        [SerializeField] private Vector3 offset = new(0f, 1.2f, -10f);

        private Transform _target;
        private Vector3 _velocity;
        private float _shakeTimer;
        private float _shakeStrength;

        public void SetTarget(Transform target)
        {
            _target = target;
        }

        public void Shake(float strength, float duration)
        {
            _shakeStrength = Mathf.Max(_shakeStrength, strength);
            _shakeTimer = Mathf.Max(_shakeTimer, duration);
        }

        private void Awake()
        {
            Instance = this;
            Camera cam = GetComponent<Camera>();
            cam.orthographic = true;
            cam.orthographicSize = 5.3f;
            cam.backgroundColor = new Color(0.03f, 0.02f, 0.04f, 1f);
        }

        private void LateUpdate()
        {
            if (_target == null)
            {
                return;
            }

            Vector3 desired = new Vector3(_target.position.x, _target.position.y, 0f) + offset;
            Vector3 smooth = Vector3.SmoothDamp(transform.position, desired, ref _velocity, smoothTime);

            if (_shakeTimer > 0f)
            {
                _shakeTimer -= Time.deltaTime;
                float shakeX = Random.Range(-_shakeStrength, _shakeStrength) * 0.16f;
                float shakeY = Random.Range(-_shakeStrength, _shakeStrength) * 0.1f;
                smooth += new Vector3(shakeX, shakeY, 0f);
                _shakeStrength = Mathf.Max(0f, _shakeStrength - Time.deltaTime * 0.35f);
            }

            transform.position = smooth;
        }
    }
}
