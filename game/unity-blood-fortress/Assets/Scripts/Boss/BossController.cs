using System;
using System.Collections;
using BloodFortress.Core;
using BloodFortress.Data;
using BloodFortress.Player;
using BloodFortress.Traps;
using BloodFortress.UI;
using UnityEngine;

namespace BloodFortress.Boss
{
    [RequireComponent(typeof(Rigidbody2D))]
    public class BossController : MonoBehaviour, IDamageable
    {
        public enum BossState
        {
            Dormant = 0,
            PhaseOne = 1,
            Transition = 2,
            PhaseTwo = 3,
            FauxDeath = 4
        }

        [SerializeField] private BossConfigSO config;
        [SerializeField] private Animator animator;
        [SerializeField] private Rigidbody2D rb;
        [SerializeField] private Transform projectileSpawn;
        [SerializeField] private Transform[] teleportAnchors;
        [SerializeField] private BossHazardGroupController hazardGroup;
        [SerializeField] private AudioClip mutationSfx;
        [SerializeField] private AudioClip roarSfx;

        private PlayerHealth _player;
        private int _currentHp;
        private bool _battleStarted;
        private bool _invulnerable;
        private bool _phaseTwoEntered;
        private Coroutine _brainRoutine;

        public event Action<float> OnBossHpChanged;
        public event Action OnFauxVictory;
        public event Action<int> OnPhaseChanged;

        public bool IsAlive => _battleStarted && _currentHp > 0;
        public BossState State { get; private set; } = BossState.Dormant;
        public int CurrentHp => _currentHp;
        public int MaxHp => config != null ? config.maxHp : 900;

        private void Awake()
        {
            if (rb == null)
            {
                rb = GetComponent<Rigidbody2D>();
            }

            _currentHp = MaxHp;
        }

        public void StartBattle(PlayerHealth player)
        {
            if (_battleStarted || config == null)
            {
                return;
            }

            _player = player;
            _battleStarted = true;
            State = BossState.PhaseOne;
            _currentHp = MaxHp;
            UIManager.Instance?.SetBossVisible(true, "Dr.Phieu");
            UIManager.Instance?.SetBossHealth(1f);
            GameStateManager.Instance.SetState(GameState.BossFight);
            hazardGroup?.SetPhase(1);
            OnPhaseChanged?.Invoke(1);

            _brainRoutine = StartCoroutine(BossBrainRoutine());
        }

        public void TakeDamage(DamageData damage)
        {
            if (!_battleStarted || _invulnerable || State == BossState.FauxDeath || _currentHp <= 0)
            {
                return;
            }

            _currentHp = Mathf.Max(0, _currentHp - damage.Amount);
            OnBossHpChanged?.Invoke((float)_currentHp / MaxHp);
            UIManager.Instance?.SetBossHealth((float)_currentHp / MaxHp);

            if (_currentHp <= 0)
            {
                StartCoroutine(FauxDeathRoutine());
                return;
            }

            if (!_phaseTwoEntered && _currentHp <= Mathf.RoundToInt(MaxHp * config.phaseTwoHpThresholdNormalized))
            {
                StartCoroutine(PhaseTransitionRoutine());
            }
        }

        private IEnumerator BossBrainRoutine()
        {
            yield return new WaitForSeconds(0.5f);
            while (_battleStarted && State != BossState.FauxDeath)
            {
                if (State == BossState.PhaseOne)
                {
                    yield return RunPhaseOnePattern();
                }
                else if (State == BossState.PhaseTwo)
                {
                    yield return RunPhaseTwoPattern();
                }
                else
                {
                    yield return null;
                }
            }
        }

        private IEnumerator RunPhaseOnePattern()
        {
            int pattern = UnityEngine.Random.Range(0, 4);
            switch (pattern)
            {
                case 0:
                    yield return ScalpelRushRoutine(config.scalpelRushDamage, 11f);
                    break;
                case 1:
                    yield return SyringeVolleyRoutine(3, config.syringeVolleyDamage, 0.28f);
                    break;
                case 2:
                    yield return VialThrowRoutine(2, config.vialThrowDamage);
                    break;
                default:
                    yield return SummonCorpseHandsRoutine(config.corpseHandDamage);
                    break;
            }

            yield return new WaitForSeconds(config.idleBetweenPatterns);
        }

        private IEnumerator RunPhaseTwoPattern()
        {
            int pattern = UnityEngine.Random.Range(0, 4);
            switch (pattern)
            {
                case 0:
                    yield return BloodSlamRoutine(config.bloodSlamDamage);
                    break;
                case 1:
                    yield return FleshSweepRoutine(config.fleshSweepDamage);
                    break;
                case 2:
                    yield return BioStormRoutine(4, config.bioStormDamage);
                    break;
                default:
                    yield return SyringeVolleyRoutine(5, config.syringeVolleyDamage + 2, 0.18f);
                    break;
            }

            yield return new WaitForSeconds(config.idleBetweenPatterns * 0.8f);
        }

        private IEnumerator ScalpelRushRoutine(int damage, float speed)
        {
            animator?.SetTrigger("Rush");
            if (_player != null)
            {
                Vector2 dir = (_player.transform.position.x > transform.position.x) ? Vector2.right : Vector2.left;
                rb.velocity = new Vector2(dir.x * speed, rb.velocity.y);
                yield return new WaitForSeconds(0.42f);

                if (Vector2.Distance(transform.position, _player.transform.position) < 1.8f)
                {
                    _player.TakeDamage(new DamageData(damage, new Vector2(dir.x * 4f, 2.2f), transform));
                }
            }

            rb.velocity = Vector2.zero;
            yield return new WaitForSeconds(0.2f);
        }

        private IEnumerator SyringeVolleyRoutine(int count, int damage, float delay)
        {
            animator?.SetTrigger("Cast");
            for (int i = 0; i < count; i++)
            {
                SpawnProjectile(config.syringeProjectilePrefab, damage);
                yield return new WaitForSeconds(delay);
            }
        }

        private IEnumerator VialThrowRoutine(int count, int damage)
        {
            animator?.SetTrigger("Throw");
            for (int i = 0; i < count; i++)
            {
                SpawnProjectile(config.vialProjectilePrefab, damage);
                yield return new WaitForSeconds(0.32f);
            }
        }

        private IEnumerator SummonCorpseHandsRoutine(int damage)
        {
            animator?.SetTrigger("Summon");
            if (_player != null)
            {
                Vector3 offset = new(UnityEngine.Random.Range(-2f, 2f), -0.8f, 0f);
                if (config.fleshWavePrefab != null)
                {
                    ProjectileDamage hand = Instantiate(config.fleshWavePrefab, _player.transform.position + offset, Quaternion.identity)
                        .GetComponent<ProjectileDamage>();
                    if (hand != null)
                    {
                        hand.Fire(Vector2.up, transform, damage);
                    }
                }
            }

            yield return new WaitForSeconds(0.55f);
        }

        private IEnumerator BloodSlamRoutine(int damage)
        {
            animator?.SetTrigger("Heavy");
            CameraEffectsController.Instance?.Shake(1.1f, 0.28f);
            if (_player != null && Vector2.Distance(transform.position, _player.transform.position) < 2.6f)
            {
                Vector2 knock = new(Mathf.Sign(_player.transform.position.x - transform.position.x) * 5.4f, 3f);
                _player.TakeDamage(new DamageData(damage, knock, transform));
            }

            yield return new WaitForSeconds(0.65f);
        }

        private IEnumerator FleshSweepRoutine(int damage)
        {
            animator?.SetTrigger("Sweep");
            if (_player != null && Vector2.Distance(transform.position, _player.transform.position) < 2.2f)
            {
                Vector2 knock = new(Mathf.Sign(_player.transform.position.x - transform.position.x) * 4.2f, 2.4f);
                _player.TakeDamage(new DamageData(damage, knock, transform));
            }

            yield return new WaitForSeconds(0.52f);
        }

        private IEnumerator BioStormRoutine(int bursts, int damage)
        {
            animator?.SetTrigger("Cast");
            for (int i = 0; i < bursts; i++)
            {
                SpawnProjectile(config.bioStormProjectilePrefab, damage);
                CameraEffectsController.Instance?.Shake(0.45f, 0.1f);
                yield return new WaitForSeconds(0.22f);
            }
        }

        private IEnumerator PhaseTransitionRoutine()
        {
            if (_phaseTwoEntered || State == BossState.Transition || State == BossState.FauxDeath)
            {
                yield break;
            }

            _phaseTwoEntered = true;
            _invulnerable = true;
            State = BossState.Transition;
            animator?.SetTrigger("Mutate");
            AudioManager.Instance?.PlaySfx(mutationSfx);
            CameraEffectsController.Instance?.Shake(1.3f, 0.45f);

            yield return new WaitForSeconds(config.phaseTransitionInvulnerableTime);

            hazardGroup?.SetPhase(2);
            OnPhaseChanged?.Invoke(2);
            State = BossState.PhaseTwo;
            _invulnerable = false;
        }

        private IEnumerator FauxDeathRoutine()
        {
            if (State == BossState.FauxDeath)
            {
                yield break;
            }

            State = BossState.FauxDeath;
            _invulnerable = true;
            rb.velocity = Vector2.zero;
            animator?.SetTrigger("FalseDeath");
            AudioManager.Instance?.PlaySfx(roarSfx);
            CameraEffectsController.Instance?.Shake(1.8f, 0.6f);
            GameStateManager.Instance.SetState(GameState.FauxVictory);

            if (_brainRoutine != null)
            {
                StopCoroutine(_brainRoutine);
            }

            yield return new WaitForSeconds(config.fauxVictoryPause);
            OnFauxVictory?.Invoke();
        }

        private void SpawnProjectile(GameObject projectilePrefab, int damage)
        {
            if (projectilePrefab == null || _player == null)
            {
                return;
            }

            Vector3 spawnPos = projectileSpawn != null ? projectileSpawn.position : transform.position;
            ProjectileDamage projectile = Instantiate(projectilePrefab, spawnPos, Quaternion.identity)
                .GetComponent<ProjectileDamage>();

            if (projectile == null)
            {
                return;
            }

            Vector2 direction = (_player.transform.position - spawnPos).normalized;
            projectile.Fire(direction, transform, damage);
        }
    }
}
