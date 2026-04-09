using BloodFortress.Core;
using UnityEngine;

namespace BloodFortress.Enemies
{
    public class SewnNunEnemy : EnemyBase
    {
        [SerializeField] private float screamRange = 3f;
        [SerializeField] private int screamDamage = 9;

        protected override bool CanChasePlayer() => false;

        protected override void PerformAttack()
        {
            if (PlayerTarget == null)
            {
                return;
            }

            float distance = Vector2.Distance(transform.position, PlayerTarget.position);
            if (distance > screamRange)
            {
                return;
            }

            base.PerformAttack();
            IDamageable player = PlayerTarget.GetComponentInParent<IDamageable>();
            if (player != null && player.IsAlive)
            {
                Vector2 knock = new(Mathf.Sign(PlayerTarget.position.x - transform.position.x) * 1.6f, 0.9f);
                player.TakeDamage(new DamageData(screamDamage, knock, transform));
            }
        }
    }
}
