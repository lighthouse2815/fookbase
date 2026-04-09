using System.Collections.Generic;
using BloodFortress.Core;
using BloodFortress.Data;
using UnityEngine;

namespace BloodFortress.Player
{
    public class PlayerCombat : MonoBehaviour
    {
        [SerializeField] private PlayerConfigSO config;
        [SerializeField] private PlayerController playerController;
        [SerializeField] private Transform attackPoint;
        [SerializeField] private Vector2 attackBox = new(1.4f, 0.9f);
        [SerializeField] private LayerMask hitMask;
        [SerializeField] private KeyCode attackKey = KeyCode.J;
        [SerializeField] private Animator animator;
        [SerializeField] private AudioClip swordSwingSfx;

        private readonly Collider2D[] _hits = new Collider2D[12];
        private readonly HashSet<IDamageable> _damageables = new();
        private float _attackCooldownTimer;
        private float _activeWindowTimer;

        private void Update()
        {
            _attackCooldownTimer = Mathf.Max(0f, _attackCooldownTimer - Time.deltaTime);
            _activeWindowTimer = Mathf.Max(0f, _activeWindowTimer - Time.deltaTime);

            if (!CanAttack())
            {
                return;
            }

            if (!Input.GetKeyDown(attackKey))
            {
                return;
            }

            BeginAttack();
        }

        private void FixedUpdate()
        {
            if (_activeWindowTimer <= 0f)
            {
                return;
            }

            ResolveAttackHit();
        }

        private bool CanAttack()
        {
            if (playerController == null || config == null)
            {
                return false;
            }

            if (playerController.IsDashing || _attackCooldownTimer > 0f)
            {
                return false;
            }

            GameState state = GameStateManager.Instance.CurrentState;
            return state == GameState.Gameplay || state == GameState.BossFight;
        }

        private void BeginAttack()
        {
            _attackCooldownTimer = config.attackCooldown;
            _activeWindowTimer = config.attackActiveWindow;
            _damageables.Clear();

            if (animator != null)
            {
                animator.SetTrigger("Attack");
            }

            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySfx(swordSwingSfx);
            }
        }

        private void ResolveAttackHit()
        {
            Vector2 point = attackPoint != null ? (Vector2)attackPoint.position : (Vector2)transform.position;
            int count = Physics2D.OverlapBoxNonAlloc(point, attackBox, 0f, _hits, hitMask);

            for (int i = 0; i < count; i++)
            {
                Collider2D hit = _hits[i];
                if (hit == null)
                {
                    continue;
                }

                IDamageable damageable = hit.GetComponentInParent<IDamageable>();
                if (damageable == null || !damageable.IsAlive || _damageables.Contains(damageable))
                {
                    continue;
                }

                _damageables.Add(damageable);
                Vector2 knockback = new(playerController.FacingDirection * 3.4f, 1.6f);
                damageable.TakeDamage(new DamageData(config.baseAttackDamage, knockback, transform));
                if (CameraEffectsController.Instance != null)
                {
                    CameraEffectsController.Instance.Shake(0.55f, 0.08f);
                }
            }
        }

        private void OnDrawGizmosSelected()
        {
            Vector2 point = attackPoint != null ? (Vector2)attackPoint.position : (Vector2)transform.position;
            Gizmos.color = Color.red;
            Gizmos.DrawWireCube(point, attackBox);
        }
    }
}
