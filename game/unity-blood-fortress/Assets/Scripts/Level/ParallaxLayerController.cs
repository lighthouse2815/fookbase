using UnityEngine;

namespace BloodFortress.Level
{
    public class ParallaxLayerController : MonoBehaviour
    {
        [SerializeField] private Transform cameraTransform;
        [SerializeField] private float parallaxFactor = 0.2f;
        [SerializeField] private bool lockY = true;

        private Vector3 _originPosition;
        private Vector3 _cameraOrigin;

        private void Start()
        {
            if (cameraTransform == null && Camera.main != null)
            {
                cameraTransform = Camera.main.transform;
            }

            _originPosition = transform.position;
            if (cameraTransform != null)
            {
                _cameraOrigin = cameraTransform.position;
            }
        }

        private void LateUpdate()
        {
            if (cameraTransform == null)
            {
                return;
            }

            Vector3 delta = cameraTransform.position - _cameraOrigin;
            float y = lockY ? _originPosition.y : _originPosition.y + delta.y * parallaxFactor;
            transform.position = new Vector3(_originPosition.x + delta.x * parallaxFactor, y, _originPosition.z);
        }
    }
}
