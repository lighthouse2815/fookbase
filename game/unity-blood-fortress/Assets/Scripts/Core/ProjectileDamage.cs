using UnityEngine;

namespace BloodFortress.Core
{
    [RequireComponent(typeof(Collider2D))]
    public class ProjectileDamage : MonoBehaviour
    {
        [SerializeField] private int damage = 10;
        [SerializeField] private float speed = 8f;
        [SerializeField] private float lifetime = 3f;
        [SerializeField] private Vector2 knockback = new(2.8f, 1.4f);
        [SerializeField] private LayerMask hitLayers;

        private Vector2 _direction = Vector2.right;
        private float _timer;
        private Transform _owner;

        public void Fire(Vector2 direction, Transform owner, int overrideDamage = -1)
        {
            _direction = direction.normalized;
            _owner = owner;
            _timer = lifetime;
            if (overrideDamage > -1)
            {
                damage = overrideDamage;
            }
        }

        private void Update()
        {
            float dt = Time.deltaTime;
            transform.Translate(_direction * (speed * dt), Space.World);
            _timer -= dt;
            if (_timer <= 0f)
            {
                gameObject.SetActive(false);
            }
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if ((hitLayers.value & (1 << other.gameObject.layer)) == 0)
            {
                return;
            }

            if (_owner != null && other.transform == _owner)
            {
                return;
            }

            IDamageable damageable = other.GetComponentInParent<IDamageable>();
            if (damageable != null && damageable.IsAlive)
            {
                Vector2 kb = new(Mathf.Sign(_direction.x) * knockback.x, knockback.y);
                damageable.TakeDamage(new DamageData(damage, kb, _owner != null ? _owner : transform));
            }

            gameObject.SetActive(false);
        }
    }
}
