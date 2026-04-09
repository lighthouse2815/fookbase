using UnityEngine;

namespace BloodFortress.Enemies
{
    public class BrokenLancerEnemy : EnemyBase
    {
        [SerializeField] private float lungeForce = 7.2f;

        protected override void PerformAttack()
        {
            base.PerformAttack();

            if (Rb == null)
            {
                return;
            }

            float direction = FacingRight ? 1f : -1f;
            Rb.velocity = new Vector2(direction * lungeForce, Rb.velocity.y);
        }
    }
}
