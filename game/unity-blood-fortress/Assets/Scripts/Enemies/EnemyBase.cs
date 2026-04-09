using System.Collections;
using BloodFortress.Core;
using BloodFortress.Data;
using UnityEngine;

namespace BloodFortress.Enemies
{
    [RequireComponent(typeof(Rigidbody2D))]
    public abstract class EnemyBase : MonoBehaviour, IDamageable
    {
        protected enum EnemyState
        {
            Idle = 0,
            Patrol = 1,
            Chase = 2,
            Attack = 3,
            Hurt = 4,
            Dead = 5
        }

        [Header("Config")]
        [SerializeField] protected EnemyConfigSO config;
        [SerializeField] protected Animator animator;
        [SerializeField] protected SpriteRenderer spriteRenderer;
        [SerializeField] protected Transform attackPoint;
        [SerializeField] protected float attackRadius = 0.5f;
        [SerializeField] protected LayerMask playerMask;

        [Header("Patrol")]
        [SerializeField] protected bool canPatrol = true;
        [SerializeField] protected Transform[] patrolPoints;
        [SerializeField] protected float pointReachDistance = 0.2f;

        [Header("Audio")]
        [SerializeField] protected AudioClip hurtSfx;
        [SerializeField] protected AudioClip deathSfx;

        protected Rigidbody2D Rb;
        protected Transform PlayerTarget;
        protected EnemyState State;
        protected bool FacingRight = true;

        private int _currentHp;
        private int _patrolIndex;
        private float _attackTimer;
        private float _hurtTimer;
        private float _contactDamageTimer;

        public bool IsAlive => State != EnemyState.Dead;
        protected int CurrentHp => _currentHp;

        protected virtual void Awake()
        {
            Rb = GetComponent<Rigidbody2D>();
            _currentHp = config != null ? config.maxHp : 40;
            State = canPatrol && patrolPoints != null && patrolPoints.Length > 0 ? EnemyState.Patrol : EnemyState.Idle;
        }

        protected virtual void Start()
        {
            GameObject playerObject = GameObject.FindGameObjectWithTag("Player");
            if (playerObject != null)
            {
                PlayerTarget = playerObject.transform;
            }
        }

        protected virtual void Update()
        {
            if (State == EnemyState.Dead)
            {
                return;
            }

            _attackTimer = Mathf.Max(0f, _attackTimer - Time.deltaTime);
            _hurtTimer = Mathf.Max(0f, _hurtTimer - Time.deltaTime);
            _contactDamageTimer = Mathf.Max(0f, _contactDamageTimer - Time.deltaTime);

            if (_hurtTimer > 0f)
            {
                return;
            }

            EvaluateStateMachine();
            RefreshAnimator();
        }

        protected virtual void FixedUpdate()
        {
            if (State == EnemyState.Dead || _hurtTimer > 0f)
            {
                return;
            }

            if (State == EnemyState.Patrol)
            {
                RunPatrol();
            }
            else if (State == EnemyState.Chase)
            {
                RunChase();
            }
            else if (State == EnemyState.Idle)
            {
                Rb.velocity = new Vector2(0f, Rb.velocity.y);
            }
        }

        public virtual void TakeDamage(DamageData damage)
        {
            if (State == EnemyState.Dead)
            {
                return;
            }

            _currentHp = Mathf.Max(0, _currentHp - damage.Amount);
            float resistance = config != null ? config.knockbackResistance : 0.4f;
            Vector2 knock = damage.Knockback * (1f - resistance);
            Rb.velocity = new Vector2(knock.x, knock.y);
            _hurtTimer = 0.18f;
            State = EnemyState.Hurt;

            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySfx(hurtSfx);
            }

            if (_currentHp <= 0)
            {
                Die();
                return;
            }

            if (animator != null)
            {
                animator.SetTrigger("Hit");
            }
        }

        protected virtual void EvaluateStateMachine()
        {
            if (PlayerTarget == null)
            {
                State = EnemyState.Idle;
                return;
            }

            float distance = Vector2.Distance(transform.position, PlayerTarget.position);
            float aggroRange = config != null ? config.aggroRange : 5f;
            float attackRange = config != null ? config.attackRange : 1.2f;

            if (distance <= attackRange && _attackTimer <= 0f)
            {
                State = EnemyState.Attack;
                PerformAttack();
                return;
            }

            if (distance <= aggroRange && CanChasePlayer())
            {
                State = EnemyState.Chase;
                return;
            }

            State = canPatrol && patrolPoints != null && patrolPoints.Length > 0 ? EnemyState.Patrol : EnemyState.Idle;
        }

        protected virtual bool CanChasePlayer() => true;

        protected virtual void RunPatrol()
        {
            if (patrolPoints == null || patrolPoints.Length == 0 || config == null)
            {
                State = EnemyState.Idle;
                return;
            }

            Transform targetPoint = patrolPoints[_patrolIndex];
            float direction = Mathf.Sign(targetPoint.position.x - transform.position.x);
            float speed = config.moveSpeed * 0.7f;

            Rb.velocity = new Vector2(direction * speed, Rb.velocity.y);
            UpdateFacing(direction);

            if (Mathf.Abs(targetPoint.position.x - transform.position.x) <= pointReachDistance)
            {
                _patrolIndex = (_patrolIndex + 1) % patrolPoints.Length;
            }
        }

        protected virtual void RunChase()
        {
            if (PlayerTarget == null || config == null)
            {
                return;
            }

            float direction = Mathf.Sign(PlayerTarget.position.x - transform.position.x);
            Rb.velocity = new Vector2(direction * config.moveSpeed, Rb.velocity.y);
            UpdateFacing(direction);
        }

        protected virtual void PerformAttack()
        {
            _attackTimer = config != null ? config.attackCooldown : 1.2f;

            if (animator != null)
            {
                animator.SetTrigger("Attack");
            }

            if (attackPoint == null || PlayerTarget == null)
            {
                return;
            }

            Collider2D hit = Physics2D.OverlapCircle(attackPoint.position, attackRadius, playerMask);
            if (hit == null)
            {
                return;
            }

            IDamageable damageable = hit.GetComponentInParent<IDamageable>();
            if (damageable == null || !damageable.IsAlive)
            {
                return;
            }

            int attackDamage = config != null ? config.attackDamage : 10;
            Vector2 knock = new(Mathf.Sign(PlayerTarget.position.x - transform.position.x) * 2.6f, 1.4f);
            damageable.TakeDamage(new DamageData(attackDamage, knock, transform));
        }

        protected virtual void Die()
        {
            State = EnemyState.Dead;
            Rb.velocity = Vector2.zero;
            Rb.simulated = false;

            Collider2D[] colliders = GetComponentsInChildren<Collider2D>();
            foreach (Collider2D col in colliders)
            {
                col.enabled = false;
            }

            if (animator != null)
            {
                animator.SetTrigger("Die");
            }

            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySfx(deathSfx);
            }

            DropSouls();
            Destroy(gameObject, 1.8f);
        }

        private void DropSouls()
        {
            if (config == null || config.soulFragmentPrefab == null || config.soulDropCount <= 0)
            {
                return;
            }

            for (int i = 0; i < config.soulDropCount; i++)
            {
                Vector3 offset = new(Random.Range(-0.3f, 0.3f), Random.Range(0.1f, 0.4f), 0f);
                Instantiate(config.soulFragmentPrefab, transform.position + offset, Quaternion.identity);
            }
        }

        private void UpdateFacing(float direction)
        {
            if (Mathf.Approximately(direction, 0f))
            {
                return;
            }

            bool shouldFaceRight = direction > 0f;
            if (FacingRight == shouldFaceRight)
            {
                return;
            }

            FacingRight = shouldFaceRight;
            Vector3 scale = transform.localScale;
            scale.x = Mathf.Abs(scale.x) * (FacingRight ? 1f : -1f);
            transform.localScale = scale;
        }

        private void RefreshAnimator()
        {
            if (animator == null)
            {
                return;
            }

            animator.SetFloat("Speed", Mathf.Abs(Rb.velocity.x));
            animator.SetBool("Dead", State == EnemyState.Dead);
        }

        private void OnCollisionStay2D(Collision2D collision)
        {
            if (State == EnemyState.Dead || _contactDamageTimer > 0f)
            {
                return;
            }

            if (!collision.collider.CompareTag("Player") || config == null)
            {
                return;
            }

            IDamageable damageable = collision.collider.GetComponentInParent<IDamageable>();
            if (damageable == null || !damageable.IsAlive)
            {
                return;
            }

            _contactDamageTimer = 0.6f;
            Vector2 knock = new(Mathf.Sign(collision.transform.position.x - transform.position.x) * 1.7f, 1f);
            damageable.TakeDamage(new DamageData(Mathf.RoundToInt(config.contactDamage), knock, transform));
        }

        private void OnDrawGizmosSelected()
        {
            if (attackPoint == null)
            {
                return;
            }

            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(attackPoint.position, attackRadius);
        }
    }
}
