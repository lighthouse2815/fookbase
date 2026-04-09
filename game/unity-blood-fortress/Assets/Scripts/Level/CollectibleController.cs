using BloodFortress.Core;
using BloodFortress.UI;
using UnityEngine;

namespace BloodFortress.Level
{
    [RequireComponent(typeof(Collider2D))]
    public class CollectibleController : MonoBehaviour
    {
        [SerializeField] private int soulValue = 1;
        [SerializeField] private AudioClip pickupSfx;
        [SerializeField] private GameObject pickupVfx;
        [SerializeField] private float bobAmplitude = 0.14f;
        [SerializeField] private float bobSpeed = 2.8f;

        private Vector3 _startPos;

        private void Start()
        {
            _startPos = transform.localPosition;
        }

        private void Update()
        {
            float offsetY = Mathf.Sin(Time.time * bobSpeed) * bobAmplitude;
            transform.localPosition = _startPos + Vector3.up * offsetY;
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!other.CompareTag("Player"))
            {
                return;
            }

            GameStateManager.Instance.AddSoulFragment(soulValue);
            UIManager.Instance?.RefreshSoulCounter(GameStateManager.Instance.SoulFragments);

            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySfx(pickupSfx);
            }

            if (pickupVfx != null)
            {
                Instantiate(pickupVfx, transform.position, Quaternion.identity);
            }

            Destroy(gameObject);
        }
    }
}
