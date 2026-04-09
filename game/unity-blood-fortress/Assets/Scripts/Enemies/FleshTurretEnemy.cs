using BloodFortress.Core;
using UnityEngine;

namespace BloodFortress.Enemies
{
    public class FleshTurretEnemy : EnemyBase
    {
        [SerializeField] private ProjectileDamage acidProjectilePrefab;
        [SerializeField] private Transform projectileSpawnPoint;
        [SerializeField] private float projectileSpeedScale = 1f;

        protected override bool CanChasePlayer() => false;

        protected override void RunPatrol()
        {
            if (Rb != null)
            {
                Rb.velocity = new Vector2(0f, Rb.velocity.y);
            }
        }

        protected override void RunChase()
        {
            if (Rb != null)
            {
                Rb.velocity = new Vector2(0f, Rb.velocity.y);
            }
        }

        protected override void PerformAttack()
        {
            if (PlayerTarget == null)
            {
                return;
            }

            base.PerformAttack();
            if (acidProjectilePrefab == null)
            {
                return;
            }

            Vector3 spawn = projectileSpawnPoint != null ? projectileSpawnPoint.position : transform.position;
            ProjectileDamage projectile = Instantiate(acidProjectilePrefab, spawn, Quaternion.identity);
            Vector2 direction = (PlayerTarget.position - spawn).normalized * projectileSpeedScale;
            projectile.Fire(direction, transform);
        }
    }
}
