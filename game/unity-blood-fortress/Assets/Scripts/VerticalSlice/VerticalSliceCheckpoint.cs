using UnityEngine;

namespace BloodFortress.VerticalSlice
{
    public class VerticalSliceCheckpoint : MonoBehaviour
    {
        private VerticalSliceDirector _director;
        private SpriteRenderer _renderer;
        private bool _activated;

        public void Initialize(VerticalSliceDirector director)
        {
            _director = director;
        }

        private void Awake()
        {
            _renderer = GetComponent<SpriteRenderer>();
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            VerticalSlicePlayer player = other.GetComponentInParent<VerticalSlicePlayer>();
            if (player == null || !player.IsAlive)
            {
                return;
            }

            player.SetCheckpoint(transform.position + Vector3.up * 1.3f);
            _activated = true;
            if (_renderer != null)
            {
                _renderer.color = new Color(0.85f, 0.85f, 0.2f, 1f);
            }

            _director?.NotifyCheckpointReached();
        }

        private void Update()
        {
            if (_renderer == null)
            {
                return;
            }

            if (_activated)
            {
                return;
            }

            float pulse = Mathf.InverseLerp(-1f, 1f, Mathf.Sin(Time.time * 5f));
            _renderer.color = Color.Lerp(
                new Color(0.25f, 0.15f, 0.1f, 0.95f),
                new Color(0.7f, 0.25f, 0.2f, 1f),
                pulse
            );
        }
    }
}
