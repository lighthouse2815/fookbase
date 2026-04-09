using System.Collections.Generic;
using BloodFortress.Core;
using BloodFortress.Data;
using UnityEngine;

namespace BloodFortress.Traps
{
    [RequireComponent(typeof(Collider2D))]
    public class TrapController : MonoBehaviour
    {
        public enum TrapType
        {
            SpikePop = 0,
            RotatingSaw = 1,
            FallingCeiling = 2,
            FlamePillar = 3,
            ChainSweep = 4,
            AcidPool = 5,
            ExplosiveVial = 6
        }

        [SerializeField] private TrapType trapType;
        [SerializeField] private TrapConfigSO trapConfig;
        [SerializeField] private bool startActive = true;
        [SerializeField] private bool cycleEnabled = true;
        [SerializeField] private bool moveEnabled;
        [SerializeField] private Transform movingPart;
        [SerializeField] private AudioClip triggerSfx;
        [SerializeField] private GameObject triggerVfx;

        private readonly Dictionary<int, float> _damageCooldowns = new();
        private Vector3 _moveOrigin;
        private float _timer;
        private bool _active;

        public bool IsActive => _active;

        private void Awake()
        {
            _active = startActive;
            if (movingPart != null)
            {
                _moveOrigin = movingPart.localPosition;
            }
        }

        private void Update()
        {
            if (cycleEnabled && trapConfig != null)
            {
                _timer += Time.deltaTime;
                float cycleLength = trapConfig.activeDuration + trapConfig.inactiveDuration;
                if (cycleLength > 0.01f)
                {
                    float cycleTime = _timer % cycleLength;
                    _active = cycleTime < trapConfig.activeDuration;
                }
            }

            if (moveEnabled && movingPart != null && trapConfig != null)
            {
                float x = Mathf.Sin(Time.time * trapConfig.moveSpeed) * trapConfig.moveAmplitude;
                movingPart.localPosition = _moveOrigin + Vector3.right * x;
            }

            CleanupCooldowns();
        }

        public void SetActive(bool isActive)
        {
            _active = isActive;
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!_active)
            {
                return;
            }

            if (trapType != TrapType.ExplosiveVial)
            {
                return;
            }

            if (!other.CompareTag("Player"))
            {
                return;
            }

            TriggerExplosion(other);
        }

        private void OnTriggerStay2D(Collider2D other)
        {
            if (!_active || trapConfig == null)
            {
                return;
            }

            IDamageable damageable = other.GetComponentInParent<IDamageable>();
            if (damageable == null || !damageable.IsAlive)
            {
                return;
            }

            int id = other.GetInstanceID();
            if (_damageCooldowns.TryGetValue(id, out float nextTime) && Time.time < nextTime)
            {
                return;
            }

            _damageCooldowns[id] = Time.time + trapConfig.damageTickInterval;
            Vector2 knock = ComputeKnockback(other.transform.position);
            damageable.TakeDamage(new DamageData(trapConfig.damage, knock, transform));

            if (CameraEffectsController.Instance != null)
            {
                CameraEffectsController.Instance.Shake(0.35f, 0.08f);
            }
        }

        private void TriggerExplosion(Collider2D source)
        {
            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySfx(triggerSfx);
            }

            if (triggerVfx != null)
            {
                Instantiate(triggerVfx, transform.position, Quaternion.identity);
            }

            Collider2D[] hits = Physics2D.OverlapCircleAll(transform.position, 1.25f);
            foreach (Collider2D hit in hits)
            {
                if (!hit.CompareTag("Player"))
                {
                    continue;
                }

                IDamageable damageable = hit.GetComponentInParent<IDamageable>();
                if (damageable == null || !damageable.IsAlive)
                {
                    continue;
                }

                int damage = trapConfig != null ? Mathf.RoundToInt(trapConfig.damage * 1.5f) : 18;
                Vector2 knock = ComputeKnockback(hit.transform.position) * 1.4f;
                damageable.TakeDamage(new DamageData(damage, knock, transform));
            }

            gameObject.SetActive(false);
        }

        private Vector2 ComputeKnockback(Vector3 targetPosition)
        {
            float horizontal = Mathf.Sign(targetPosition.x - transform.position.x);
            float y = trapType == TrapType.FallingCeiling ? -1.8f : 1.1f;
            return new Vector2(horizontal * 2f, y);
        }

        private void CleanupCooldowns()
        {
            if (_damageCooldowns.Count == 0)
            {
                return;
            }

            List<int> remove = null;
            foreach (KeyValuePair<int, float> entry in _damageCooldowns)
            {
                if (Time.time <= entry.Value + 0.02f)
                {
                    continue;
                }

                remove ??= new List<int>();
                remove.Add(entry.Key);
            }

            if (remove == null)
            {
                return;
            }

            for (int i = 0; i < remove.Count; i++)
            {
                _damageCooldowns.Remove(remove[i]);
            }
        }

        private void OnDrawGizmosSelected()
        {
            if (trapType != TrapType.ExplosiveVial)
            {
                return;
            }

            Gizmos.color = Color.red;
            Gizmos.DrawWireSphere(transform.position, 1.25f);
        }
    }
}
