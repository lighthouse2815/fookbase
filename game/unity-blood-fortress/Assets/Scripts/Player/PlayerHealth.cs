using System.Collections;
using BloodFortress.Core;
using BloodFortress.Data;
using BloodFortress.UI;
using UnityEngine;

namespace BloodFortress.Player
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class PlayerHealth : MonoBehaviour, IDamageable
    {
        [SerializeField] private PlayerConfigSO config;
        [SerializeField] private PlayerController playerController;
        [SerializeField] private SpriteRenderer spriteRenderer;
        [SerializeField] private AudioClip hurtSfx;
        [SerializeField] private AudioClip deathSfx;

        private Rigidbody2D _rb;
        private Transform _currentCheckpoint;
        private Vector3 _spawnPoint;
        private int _currentHp;
        private int _remainingRespawns;
        private float _invulnerabilityTimer;
        private bool _isDead;

        public bool IsAlive => !_isDead;
        public int CurrentHp => _currentHp;
        public int MaxHp => config != null ? config.maxHp : 100;

        private void Awake()
        {
            _rb = GetComponent<Rigidbody2D>();
            _spawnPoint = transform.position;
            _currentHp = MaxHp;
            _remainingRespawns = config != null ? config.maxRespawns : 2;
        }

        private void Start()
        {
            UIManager.Instance?.RegisterPlayer(this);
            UIManager.Instance?.SetPlayerHealth(_currentHp, MaxHp);
        }

        private void Update()
        {
            _invulnerabilityTimer = Mathf.Max(0f, _invulnerabilityTimer - Time.deltaTime);

            if (CameraEffectsController.Instance != null)
            {
                float lowHealth = Mathf.InverseLerp(MaxHp * 0.6f, 0f, _currentHp);
                CameraEffectsController.Instance.SetLowHealthVignette(lowHealth * 0.75f);
            }
        }

        public void SetCheckpoint(Transform checkpoint)
        {
            _currentCheckpoint = checkpoint;
        }

        public void TakeDamage(DamageData damage)
        {
            if (_isDead || _invulnerabilityTimer > 0f)
            {
                return;
            }

            _currentHp = Mathf.Max(0, _currentHp - damage.Amount);
            _invulnerabilityTimer = config != null ? config.invulnerabilityTime : 0.6f;

            _rb.velocity = new Vector2(damage.Knockback.x, damage.Knockback.y);
            UIManager.Instance?.SetPlayerHealth(_currentHp, MaxHp);

            if (CameraEffectsController.Instance != null)
            {
                CameraEffectsController.Instance.Shake(0.8f, 0.12f);
                CameraEffectsController.Instance.FlashHit();
            }

            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySfx(hurtSfx);
            }

            if (_currentHp > 0)
            {
                StartCoroutine(HitBlinkRoutine(0.15f));
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
            playerController?.ForceStopMovement();

            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySfx(deathSfx);
            }

            yield return new WaitForSeconds(config != null ? config.respawnDelay : 1f);

            if (_remainingRespawns > 0)
            {
                _remainingRespawns--;
                Respawn();
                yield break;
            }

            GameStateManager.Instance.RequestGameOver();
            UIManager.Instance?.ShowGameOver(true);
        }

        private void Respawn()
        {
            _isDead = false;
            _currentHp = MaxHp;
            _invulnerabilityTimer = config != null ? config.invulnerabilityTime : 0.6f;

            Transform target = _currentCheckpoint;
            Vector3 respawnPos = target != null ? target.position : _spawnPoint;
            transform.position = respawnPos;
            _rb.velocity = Vector2.zero;

            UIManager.Instance?.SetPlayerHealth(_currentHp, MaxHp);
            UIManager.Instance?.ShowGameOver(false);
        }

        private IEnumerator HitBlinkRoutine(float duration)
        {
            if (spriteRenderer == null)
            {
                yield break;
            }

            float timer = duration;
            while (timer > 0f)
            {
                timer -= Time.deltaTime;
                spriteRenderer.enabled = !spriteRenderer.enabled;
                yield return new WaitForSeconds(0.05f);
            }

            spriteRenderer.enabled = true;
        }
    }
}
