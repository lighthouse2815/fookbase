using BloodFortress.Core;
using BloodFortress.Data;
using UnityEngine;

namespace BloodFortress.Player
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class PlayerController : MonoBehaviour
    {
        [SerializeField] private PlayerConfigSO config;
        [SerializeField] private Transform groundCheck;
        [SerializeField] private float groundCheckRadius = 0.18f;
        [SerializeField] private LayerMask groundMask;
        [SerializeField] private Animator animator;
        [SerializeField] private KeyCode jumpKey = KeyCode.Space;
        [SerializeField] private KeyCode dashKey = KeyCode.LeftShift;

        private Rigidbody2D _rb;
        private float _horizontalInput;
        private bool _isGrounded;
        private bool _isDashing;
        private float _dashCooldownTimer;
        private float _dashTimeLeft;
        private float _coyoteTimer;
        private float _jumpBufferTimer;
        private int _airJumpsRemaining;
        private bool _facingRight = true;

        public bool IsGrounded => _isGrounded;
        public bool IsDashing => _isDashing;
        public int FacingDirection => _facingRight ? 1 : -1;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _airJumpsRemaining = config.maxAirJumps;
        }

        private void Update()
        {
            HandlePauseInput();
            UpdateInput();
            UpdateTimers();
            RefreshAnimator();
        }

        private void FixedUpdate()
        {
            RefreshGroundState();
            ApplyHorizontalMovement(Time.fixedDeltaTime);
            ApplyDash(Time.fixedDeltaTime);
        }

        public void ForceStopMovement()
        {
            _horizontalInput = 0f;
            _rb.velocity = new Vector2(0f, _rb.velocity.y);
        }

        private void HandlePauseInput()
        {
            if (Input.GetKeyDown(KeyCode.Escape) || Input.GetKeyDown(KeyCode.P))
            {
                GameStateManager.Instance.TogglePause();
            }
        }

        private void UpdateInput()
        {
            if (!CanReceiveInput())
            {
                _horizontalInput = 0f;
                return;
            }

            _horizontalInput = Input.GetAxisRaw("Horizontal");

            if (Input.GetKeyDown(jumpKey))
            {
                _jumpBufferTimer = config.jumpBuffer;
            }

            if (Input.GetKeyDown(dashKey))
            {
                TryStartDash();
            }

            if (_jumpBufferTimer > 0f)
            {
                TryConsumeJump();
            }
        }

        private void UpdateTimers()
        {
            _jumpBufferTimer = Mathf.Max(0f, _jumpBufferTimer - Time.deltaTime);
            _dashCooldownTimer = Mathf.Max(0f, _dashCooldownTimer - Time.deltaTime);
            _coyoteTimer = _isGrounded ? config.coyoteTime : Mathf.Max(0f, _coyoteTimer - Time.deltaTime);

            if (!_isDashing)
            {
                return;
            }

            _dashTimeLeft = Mathf.Max(0f, _dashTimeLeft - Time.deltaTime);
            if (_dashTimeLeft <= 0f)
            {
                _isDashing = false;
            }
        }

        private void ApplyHorizontalMovement(float dt)
        {
            if (_isDashing)
            {
                return;
            }

            float currentX = _rb.velocity.x;
            float targetX = _horizontalInput * config.moveSpeed;
            float accel = _isGrounded ? config.acceleration : config.acceleration * config.airControlPercent;
            float nextX = Mathf.MoveTowards(currentX, targetX, accel * dt);
            float nextY = Mathf.Max(_rb.velocity.y, config.maxFallSpeed);

            _rb.velocity = new Vector2(nextX, nextY);
            UpdateFacing(nextX);
        }

        private void ApplyDash(float dt)
        {
            if (!_isDashing)
            {
                return;
            }

            float direction = Mathf.Approximately(_horizontalInput, 0f) ? FacingDirection : Mathf.Sign(_horizontalInput);
            _rb.velocity = new Vector2(direction * config.dashSpeed, 0f);
            UpdateFacing(_rb.velocity.x);
        }

        private void RefreshGroundState()
        {
            Vector2 checkPosition = groundCheck != null ? (Vector2)groundCheck.position : (Vector2)transform.position + Vector2.down * 0.8f;
            _isGrounded = Physics2D.OverlapCircle(checkPosition, groundCheckRadius, groundMask);
            if (_isGrounded)
            {
                _airJumpsRemaining = config.maxAirJumps;
            }
        }

        private bool TryConsumeJump()
        {
            if (!CanReceiveInput())
            {
                return false;
            }

            bool useGroundJump = _isGrounded || _coyoteTimer > 0f;
            if (useGroundJump)
            {
                _rb.velocity = new Vector2(_rb.velocity.x, config.jumpForce);
                _jumpBufferTimer = 0f;
                _coyoteTimer = 0f;
                _isGrounded = false;
                return true;
            }

            if (_airJumpsRemaining <= 0)
            {
                return false;
            }

            _airJumpsRemaining--;
            _rb.velocity = new Vector2(_rb.velocity.x, config.jumpForce);
            _jumpBufferTimer = 0f;
            _isGrounded = false;
            return true;
        }

        private void TryStartDash()
        {
            if (_isDashing || _dashCooldownTimer > 0f || !CanReceiveInput())
            {
                return;
            }

            _isDashing = true;
            _dashTimeLeft = config.dashDuration;
            _dashCooldownTimer = config.dashCooldown;
        }

        private bool CanReceiveInput()
        {
            GameState state = GameStateManager.Instance.CurrentState;
            return state == GameState.Gameplay || state == GameState.BossFight;
        }

        private void UpdateFacing(float horizontalVelocity)
        {
            if (Mathf.Abs(horizontalVelocity) < 0.01f)
            {
                return;
            }

            bool shouldFaceRight = horizontalVelocity > 0f;
            if (_facingRight == shouldFaceRight)
            {
                return;
            }

            _facingRight = shouldFaceRight;
            Vector3 scale = transform.localScale;
            scale.x = Mathf.Abs(scale.x) * (_facingRight ? 1f : -1f);
            transform.localScale = scale;
        }

        private void RefreshAnimator()
        {
            if (animator == null)
            {
                return;
            }

            animator.SetFloat("Speed", Mathf.Abs(_rb.velocity.x));
            animator.SetFloat("VerticalSpeed", _rb.velocity.y);
            animator.SetBool("Grounded", _isGrounded);
            animator.SetBool("Dashing", _isDashing);
        }

        private void OnDrawGizmosSelected()
        {
            Vector2 checkPosition = groundCheck != null ? (Vector2)groundCheck.position : (Vector2)transform.position + Vector2.down * 0.8f;
            Gizmos.color = Color.cyan;
            Gizmos.DrawWireSphere(checkPosition, groundCheckRadius);
        }
    }
}
