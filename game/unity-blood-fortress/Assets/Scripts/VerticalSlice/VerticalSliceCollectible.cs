using UnityEngine;

namespace BloodFortress.VerticalSlice
{
    public class VerticalSliceCollectible : MonoBehaviour
    {
        [SerializeField] private int value = 1;

        private VerticalSliceDirector _director;
        private float _baseY;

        public void Initialize(VerticalSliceDirector director, int collectibleValue = 1)
        {
            _director = director;
            value = Mathf.Max(1, collectibleValue);
            _baseY = transform.position.y;
        }

        private void Update()
        {
            transform.position = new Vector3(
                transform.position.x,
                _baseY + Mathf.Sin(Time.time * 4f + transform.position.x * 0.2f) * 0.08f,
                transform.position.z
            );
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            VerticalSlicePlayer player = other.GetComponentInParent<VerticalSlicePlayer>();
            if (player == null || !player.IsAlive)
            {
                return;
            }

            _director?.AddSoul(value);
            Destroy(gameObject);
        }
    }
}
