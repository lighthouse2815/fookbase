using System;
using System.Collections;
using BloodFortress.Core;
using UnityEngine;

namespace BloodFortress.VerticalSlice
{
    [RequireComponent(typeof(Rigidbody2D))]
    [RequireComponent(typeof(BoxCollider2D))]
    [RequireComponent(typeof(SpriteRenderer))]
    public class VerticalSlicePlayer : MonoBehaviour, IDamageable
    {
        [Header("Movement")]
        [SerializeField] private float moveSpeed = 7.5f;
        [SerializeField] private float jumpForce = 13.5f;
        [SerializeField] private int extraAirJumps = 1;
        [SerializeField] private float maxFallSpeed = -22f;
        [SerializeField] private float dashSpeed = 18f;
        [SerializeField] private float dashDuration = 0.14f;
        [SerializeField] private float dashCooldown = 0.55f;

        [Header("Combat")]
        [SerializeField] private Transform attackPoint;
        [SerializeField] private Vector2 attackBoxSize = new(1.4f, 0.9f);
        [SerializeField] private float attackCooldown = 0.3f;
        [SerializeField] private int attackDamage = 18;

        [Header("Health")]
        [SerializeField] private int maxHp = 120;
        [SerializeField] private int maxRespawns = 2;
        [SerializeField] private float invulnerabilityTime = 0.7f;
        [SerializeField] private float respawnDelay = 0.8f;

        private readonly Collider2D[] _attackHits = new Collider2D[12];

        private Rigidbody2D _rb;
        private BoxCollider2D _box;
        private SpriteRenderer _sprite;
        private Vector3 _checkpoint;
        private int _hp;
        private int _respawnsLeft;
        private int _airJumpsLeft;
        private float _attackTimer;
        private float _dashTimer;
        private float _dashCooldownTimer;
        private float _invulnerabilityTimer;
        private bool _isGrounded;
        private bool _controlsEnabled;
        private bool _isDashing;
        private bool _facingRight = true;
        private bool _isDead;
        private bool _finalDefeatLocked;

        public bool IsAlive => !_isDead;
        public int CurrentHp => _hp;
        public int MaxHp => maxHp;
        public int RemainingRespawns => _respawnsLeft;
        public int FacingSign => _facingRight ? 1 : -1;
        public bool ControlsEnabled => _controlsEnabled;

        public event Action<int, int> HealthChanged;
        public event Action OutOfLives;
        public event Action Respawned;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _box = GetComponent<BoxCollider2D>();
            _sprite = GetComponent<SpriteRenderer>();

            if (attackPoint == null)
            {
                GameObject attackAnchor = new("AttackPoint");
                attackAnchor.transform.SetParent(transform, false);
                attackAnchor.transform.localPosition = new Vector3(0.85f, 0.1f, 0f);
                attackPoint = attackAnchor.transform;
            }

            _rb.gravityScale = 3f;
            _rb.freezeRotation = true;
            _rb.collisionDetectionMode = CollisionDetectionMode2D.Continuous;
            _box.size = new Vector2(0.8f, 1.4f);
        }

        private void Start()
        {
            _checkpoint = transform.position;
            _hp = maxHp;
            _respawnsLeft = maxRespawns;
            _airJumpsLeft = extraAirJumps;
            _controlsEnabled = false;
            HealthChanged?.Invoke(_hp, maxHp);
        }

        private void Update()
        {
            _attackTimer = Mathf.Max(0f, _attackTimer - Time.deltaTime);
            _dashTimer = Mathf.Max(0f, _dashTimer - Time.deltaTime);
            _dashCooldownTimer = Mathf.Max(0f, _dashCooldownTimer - Time.deltaTime);
            _invulnerabilityTimer = Mathf.Max(0f, _invulnerabilityTimer - Time.deltaTime);

            if (!_controlsEnabled || _isDead)
            {
                return;
            }

            if (Input.GetKeyDown(KeyCode.J) || Input.GetMouseButtonDown(0))
            {
                TryAttack();
            }

            if ((Input.GetKeyDown(KeyCode.LeftShift) || Input.GetKeyDown(KeyCode.K)) && !_isDashing)
            {
                TryDash();
            }
        }

        private void FixedUpdate()
        {
            RefreshGrounded();

            if (!_controlsEnabled || _isDead)
            {
                _rb.velocity = new Vector2(0f, _rb.velocity.y);
                return;
            }

            if (_isDashing)
            {
                _rb.velocity = new Vector2(FacingSign * dashSpeed, 0f);
                if (_dashTimer <= 0f)
                {
                    _isDashing = false;
                }

                return;
            }

            float moveInput = Input.GetAxisRaw("Horizontal");
            float y = Mathf.Max(_rb.velocity.y, maxFallSpeed);
            _rb.velocity = new Vector2(moveInput * moveSpeed, y);

            if (Mathf.Abs(moveInput) > 0.05f)
            {
                _facingRight = moveInput > 0f;
                transform.localScale = new Vector3(_facingRight ? 1f : -1f, 1f, 1f);
            }

            if (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow))
            {
                TryJump();
            }
        }

        public void SetControlEnabled(bool enabled)
        {
            _controlsEnabled = enabled;
            if (!enabled)
            {
                _rb.velocity = new Vector2(0f, _rb.velocity.y);
            }
        }

        public void SetCheckpoint(Vector3 worldPosition)
        {
            _checkpoint = worldPosition;
        }

        public void ApplyTrapDamage(int damage, Vector2 knockback)
        {
            TakeDamage(new DamageData(damage, knockback, transform));
        }

        public void ForceScriptedFinalDefeat()
        {
            _finalDefeatLocked = true;
            _hp = 0;
            HealthChanged?.Invoke(_hp, maxHp);
            StartCoroutine(DeathRoutine());
        }

        public void TakeDamage(DamageData damage)
        {
            if (_isDead || _invulnerabilityTimer > 0f)
            {
                return;
            }

            _invulnerabilityTimer = invulnerabilityTime;
            _hp = Mathf.Max(0, _hp - damage.Amount);
            _rb.velocity = new Vector2(damage.Knockback.x, damage.Knockback.y);
            HealthChanged?.Invoke(_hp, maxHp);
            VerticalSliceCameraFollow.Instance?.Shake(0.22f, 0.13f);

            if (_hp > 0)
            {
                return;
            }

            StartCoroutine(DeathRoutine());
        }

        private IEnumerator DeathRoutine()
        {
            if (_isDead)
            {
                yield break;
            }

            _isDead = true;
            _controlsEnabled = false;
            _rb.velocity = Vector2.zero;
            _sprite.color = new Color(0.8f, 0.2f, 0.2f, 0.9f);
            yield return new WaitForSeconds(respawnDelay);

            if (_finalDefeatLocked || _respawnsLeft <= 0)
            {
                OutOfLives?.Invoke();
                yield break;
            }

            _respawnsLeft--;
            _isDead = false;
            _hp = maxHp;
            _invulnerabilityTimer = 1f;
            transform.position = _checkpoint;
            _rb.velocity = Vector2.zero;
            _sprite.color = Color.white;
            HealthChanged?.Invoke(_hp, maxHp);
            Respawned?.Invoke();
        }

        private void TryJump()
        {
            if (_isGrounded)
            {
                _rb.velocity = new Vector2(_rb.velocity.x, jumpForce);
                _airJumpsLeft = extraAirJumps;
                _isGrounded = false;
                return;
            }

            if (_airJumpsLeft <= 0)
            {
                return;
            }

            _airJumpsLeft--;
            _rb.velocity = new Vector2(_rb.velocity.x, jumpForce);
            _isGrounded = false;
        }

        private void TryDash()
        {
            if (_dashCooldownTimer > 0f)
            {
                return;
            }

            _isDashing = true;
            _dashTimer = dashDuration;
            _dashCooldownTimer = dashCooldown;
        }

        private void TryAttack()
        {
            if (_attackTimer > 0f)
            {
                return;
            }

            _attackTimer = attackCooldown;
            Vector2 point = attackPoint != null
                ? (Vector2)attackPoint.position
                : (Vector2)transform.position + Vector2.right * (FacingSign * 0.85f);

            int hits = Physics2D.OverlapBoxNonAlloc(point, attackBoxSize, 0f, _attackHits);
            for (int i = 0; i < hits; i++)
            {
                Collider2D hit = _attackHits[i];
                if (hit == null)
                {
                    continue;
                }

                IDamageable damageable = hit.GetComponentInParent<IDamageable>();
                if (damageable == null || ReferenceEquals(damageable, this) || !damageable.IsAlive)
                {
                    continue;
                }

                Vector2 knockback = new(FacingSign * 4.2f, 1.6f);
                damageable.TakeDamage(new DamageData(attackDamage, knockback, transform));
            }
        }

        private void RefreshGrounded()
        {
            Bounds b = _box.bounds;
            RaycastHit2D hit = Physics2D.BoxCast(
                b.center,
                new Vector2(b.size.x * 0.92f, b.size.y * 0.92f),
                0f,
                Vector2.down,
                0.08f
            );

            _isGrounded = hit.collider != null && !hit.collider.isTrigger;
            if (_isGrounded)
            {
                _airJumpsLeft = extraAirJumps;
            }
        }

        private void OnDrawGizmosSelected()
        {
            Vector2 point = attackPoint != null
                ? (Vector2)attackPoint.position
                : (Vector2)transform.position + Vector2.right * (FacingSign * 0.85f);

            Gizmos.color = Color.red;
            Gizmos.DrawWireCube(point, attackBoxSize);
        }
    }
}
