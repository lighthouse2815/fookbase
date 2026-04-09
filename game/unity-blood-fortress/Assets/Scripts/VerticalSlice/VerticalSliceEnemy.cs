using BloodFortress.Core;
using UnityEngine;

namespace BloodFortress.VerticalSlice
{
    [RequireComponent(typeof(BoxCollider2D))]
    [RequireComponent(typeof(SpriteRenderer))]
    public class VerticalSliceEnemy : MonoBehaviour, IDamageable
    {
        [SerializeField] private int maxHp = 36;
        [SerializeField] private int contactDamage = 14;
        [SerializeField] private float moveSpeed = 2.2f;
        [SerializeField] private float patrolRange = 2.4f;
        [SerializeField] private float chaseRange = 7.5f;
        [SerializeField] private float hitCooldown = 1f;

        private VerticalSlicePlayer _player;
        private SpriteRenderer _sprite;
        private Vector3 _origin;
        private int _hp;
        private float _hitTimer;
        private bool _alive = true;
        private bool _facingRight = true;

        public bool IsAlive => _alive;

        public void Initialize(VerticalSlicePlayer player)
        {
            _player = player;
        }

        private void Awake()
        {
            _sprite = GetComponent<SpriteRenderer>();
            _origin = transform.position;
            _hp = maxHp;

            BoxCollider2D box = GetComponent<BoxCollider2D>();
            box.size = new Vector2(0.8f, 1.2f);
        }

        private void Update()
        {
            if (!_alive)
            {
                return;
            }

            _hitTimer = Mathf.Max(0f, _hitTimer - Time.deltaTime);

            float targetX = _origin.x + Mathf.Sin(Time.time * moveSpeed) * patrolRange;
            if (_player != null && _player.IsAlive)
            {
                float distance = Mathf.Abs(_player.transform.position.x - transform.position.x);
                if (distance <= chaseRange)
                {
                    targetX = Mathf.MoveTowards(
                        transform.position.x,
                        _player.transform.position.x,
                        moveSpeed * 1.7f * Time.deltaTime
                    );
                }
            }

            float delta = targetX - transform.position.x;
            transform.position = new Vector3(targetX, transform.position.y, transform.position.z);
            if (Mathf.Abs(delta) > 0.01f)
            {
                _facingRight = delta > 0f;
                transform.localScale = new Vector3(_facingRight ? 1f : -1f, 1f, 1f);
            }
        }

        public void TakeDamage(DamageData damage)
        {
            if (!_alive)
            {
                return;
            }

            _hp = Mathf.Max(0, _hp - damage.Amount);
            _sprite.color = new Color(1f, 0.45f, 0.45f, 1f);

            if (_hp > 0)
            {
                Invoke(nameof(RestoreColor), 0.12f);
                return;
            }

            _alive = false;
            _sprite.color = new Color(0.4f, 0.05f, 0.05f, 0.85f);
            Destroy(gameObject, 0.2f);
        }

        private void RestoreColor()
        {
            if (_sprite != null && _alive)
            {
                _sprite.color = Color.white;
            }
        }

        private void OnCollisionStay2D(Collision2D collision)
        {
            if (!_alive || _hitTimer > 0f)
            {
                return;
            }

            VerticalSlicePlayer player = collision.collider.GetComponentInParent<VerticalSlicePlayer>();
            if (player == null || !player.IsAlive)
            {
                return;
            }

            _hitTimer = hitCooldown;
            float knockX = player.transform.position.x >= transform.position.x ? 4.2f : -4.2f;
            player.ApplyTrapDamage(contactDamage, new Vector2(knockX, 2.1f));
        }
    }
}
