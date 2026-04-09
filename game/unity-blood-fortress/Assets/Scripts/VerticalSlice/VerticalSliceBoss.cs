using System;
using System.Collections;
using BloodFortress.Core;
using UnityEngine;

namespace BloodFortress.VerticalSlice
{
    [RequireComponent(typeof(BoxCollider2D))]
    [RequireComponent(typeof(SpriteRenderer))]
    public class VerticalSliceBoss : MonoBehaviour, IDamageable
    {
        [SerializeField] private int maxHp = 420;
        [SerializeField] private int contactDamage = 18;
        [SerializeField] private float moveSpeedPhase1 = 2.4f;
        [SerializeField] private float moveSpeedPhase2 = 4f;
        [SerializeField] private float attackIntervalPhase1 = 2.2f;
        [SerializeField] private float attackIntervalPhase2 = 1.3f;
        [SerializeField] private int bloodBoltDamage = 12;

        private VerticalSlicePlayer _player;
        private SpriteRenderer _sprite;
        private int _hp;
        private float _attackTimer;
        private float _contactTimer;
        private bool _active;
        private bool _alive = true;
        private bool _phaseTwo;
        private bool _performingAttack;
        private bool _facingRight = false;

        public bool IsAlive => _alive;
        public int CurrentHp => _hp;
        public int MaxHp => maxHp;
        public bool Active => _active;
        public bool PhaseTwo => _phaseTwo;

        public event Action EnteredPhaseTwo;
        public event Action BossHpDepleted;

        public void Initialize(VerticalSlicePlayer player)
        {
            _player = player;
        }

        public void ActivateBoss()
        {
            _active = true;
            _attackTimer = 1.4f;
        }

        public void PlayFalseDeathVisual()
        {
            _active = false;
            _performingAttack = false;
            _sprite.color = new Color(0.3f, 0.05f, 0.05f, 0.9f);
        }

        private void Awake()
        {
            _sprite = GetComponent<SpriteRenderer>();
            _hp = maxHp;

            BoxCollider2D box = GetComponent<BoxCollider2D>();
            box.size = new Vector2(1.8f, 2.6f);
        }

        private void Update()
        {
            if (!_active || !_alive || _player == null || !_player.IsAlive)
            {
                return;
            }

            _attackTimer = Mathf.Max(0f, _attackTimer - Time.deltaTime);
            _contactTimer = Mathf.Max(0f, _contactTimer - Time.deltaTime);

            if (!_performingAttack)
            {
                FollowPlayer();
            }

            if (_attackTimer <= 0f && !_performingAttack)
            {
                StartCoroutine(DoAttackPattern());
            }
        }

        public void TakeDamage(DamageData damage)
        {
            if (!_alive)
            {
                return;
            }

            _hp = Mathf.Max(0, _hp - damage.Amount);
            _sprite.color = new Color(1f, 0.55f, 0.55f, 1f);
            Invoke(nameof(RestoreColor), 0.08f);

            if (!_phaseTwo && _hp <= Mathf.CeilToInt(maxHp * 0.45f))
            {
                _phaseTwo = true;
                EnteredPhaseTwo?.Invoke();
                VerticalSliceCameraFollow.Instance?.Shake(0.35f, 0.3f);
            }

            if (_hp > 0)
            {
                return;
            }

            _alive = false;
            _active = false;
            BossHpDepleted?.Invoke();
        }

        private void FollowPlayer()
        {
            float speed = _phaseTwo ? moveSpeedPhase2 : moveSpeedPhase1;
            Vector3 target = _player.transform.position;
            float x = Mathf.MoveTowards(transform.position.x, target.x, speed * Time.deltaTime);
            transform.position = new Vector3(x, transform.position.y, transform.position.z);

            float delta = target.x - transform.position.x;
            if (Mathf.Abs(delta) > 0.05f)
            {
                _facingRight = delta > 0f;
                transform.localScale = new Vector3(_facingRight ? 1f : -1f, 1f, 1f);
            }
        }

        private IEnumerator DoAttackPattern()
        {
            _performingAttack = true;
            _attackTimer = _phaseTwo ? attackIntervalPhase2 : attackIntervalPhase1;

            float roll = UnityEngine.Random.value;
            if (roll < (_phaseTwo ? 0.42f : 0.55f))
            {
                yield return StartCoroutine(RushAttack());
            }
            else
            {
                yield return StartCoroutine(BloodBoltVolley(_phaseTwo ? 3 : 1));
            }

            if (_phaseTwo && UnityEngine.Random.value < 0.45f)
            {
                yield return StartCoroutine(SlamShockwave());
            }

            _performingAttack = false;
        }

        private IEnumerator RushAttack()
        {
            float rushTime = _phaseTwo ? 0.42f : 0.3f;
            float rushSpeed = _phaseTwo ? 12.5f : 9f;
            float dir = _player.transform.position.x >= transform.position.x ? 1f : -1f;
            float timer = 0f;

            while (timer < rushTime)
            {
                timer += Time.deltaTime;
                transform.position += Vector3.right * dir * rushSpeed * Time.deltaTime;
                yield return null;
            }
        }

        private IEnumerator BloodBoltVolley(int amount)
        {
            for (int i = 0; i < amount; i++)
            {
                SpawnBloodBolt();
                yield return new WaitForSeconds(0.12f);
            }
        }

        private IEnumerator SlamShockwave()
        {
            VerticalSliceCameraFollow.Instance?.Shake(0.28f, 0.2f);
            for (int i = 0; i < 4; i++)
            {
                GameObject pulse = VerticalSlicePrefabUtil.CreateSolidBox(
                    $"BossPulse_{i}",
                    new Vector3(_player.transform.position.x + (i - 1.5f) * 1.2f, -1.6f, 0f),
                    new Vector2(0.8f, 0.65f),
                    new Color(0.85f, 0.07f, 0.07f, 0.9f),
                    true
                );

                VerticalSliceHazard hazard = pulse.AddComponent<VerticalSliceHazard>();
                hazard.Configure(16, new Vector2(0f, 5.5f), false, 0.15f);
                Destroy(pulse, 0.8f);
            }

            yield return new WaitForSeconds(0.25f);
        }

        private void SpawnBloodBolt()
        {
            float dir = _player.transform.position.x >= transform.position.x ? 1f : -1f;
            Vector3 pos = transform.position + new Vector3(dir * 1.2f, 0.4f, 0f);
            GameObject bolt = VerticalSlicePrefabUtil.CreateSolidBox(
                "BloodBolt",
                pos,
                new Vector2(0.35f, 0.35f),
                new Color(0.95f, 0.2f, 0.2f, 1f),
                true
            );

            VerticalSliceProjectile projectile = bolt.AddComponent<VerticalSliceProjectile>();
            projectile.Configure(new Vector2(dir * (_phaseTwo ? 13f : 10f), UnityEngine.Random.Range(-0.35f, 0.35f)), bloodBoltDamage);
            Destroy(bolt, 4f);
        }

        private void RestoreColor()
        {
            if (_sprite != null)
            {
                _sprite.color = _phaseTwo
                    ? new Color(0.75f, 0.2f, 0.2f, 1f)
                    : new Color(0.85f, 0.85f, 0.85f, 1f);
            }
        }

        private void OnCollisionStay2D(Collision2D collision)
        {
            if (!_active || !_alive || _contactTimer > 0f)
            {
                return;
            }

            VerticalSlicePlayer player = collision.collider.GetComponentInParent<VerticalSlicePlayer>();
            if (player == null || !player.IsAlive)
            {
                return;
            }

            _contactTimer = 0.9f;
            float knockX = player.transform.position.x >= transform.position.x ? 6f : -6f;
            player.ApplyTrapDamage(contactDamage, new Vector2(knockX, 3f));
        }
    }
}
