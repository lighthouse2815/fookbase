using BloodFortress.Player;
using UnityEngine;

namespace BloodFortress.Level
{
    [RequireComponent(typeof(Collider2D))]
    public class CheckpointController : MonoBehaviour
    {
        [SerializeField] private Transform respawnPoint;
        [SerializeField] private SpriteRenderer flagRenderer;
        [SerializeField] private Color inactiveColor = new(0.35f, 0.2f, 0.2f, 1f);
        [SerializeField] private Color activeColor = new(0.95f, 0.78f, 0.45f, 1f);

        private bool _isActive;

        public Transform RespawnPoint => respawnPoint != null ? respawnPoint : transform;

        private void Start()
        {
            SetVisual(false);
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!other.CompareTag("Player"))
            {
                return;
            }

            PlayerHealth player = other.GetComponentInParent<PlayerHealth>();
            if (player == null)
            {
                return;
            }

            player.SetCheckpoint(RespawnPoint);
            SetVisual(true);
        }

        private void SetVisual(bool active)
        {
            _isActive = active;
            if (flagRenderer == null)
            {
                return;
            }

            flagRenderer.color = active ? activeColor : inactiveColor;
        }
    }
}
