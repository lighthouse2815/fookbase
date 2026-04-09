using UnityEngine;

namespace BloodFortress.Enemies
{
    public class MutantCrawlerEnemy : EnemyBase
    {
        protected override void RunChase()
        {
            base.RunChase();
            if (Rb == null)
            {
                return;
            }

            // Crawler keeps lower center of gravity for unsettling movement.
            Rb.velocity = new Vector2(Rb.velocity.x, Mathf.Clamp(Rb.velocity.y, -3f, 2f));
        }
    }
}
