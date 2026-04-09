using UnityEngine;

namespace BloodFortress.VerticalSlice
{
    public class VerticalSliceProjectile : MonoBehaviour
    {
        [SerializeField] private int damage = 12;
        [SerializeField] private Vector2 velocity = new(10f, 0f);

        public void Configure(Vector2 projectileVelocity, int projectileDamage)
        {
            velocity = projectileVelocity;
            damage = projectileDamage;
        }

        private void Update()
        {
            transform.position += (Vector3)(velocity * Time.deltaTime);
        }

        private void OnTriggerEnter2D(Collider2D other)
        {
            VerticalSlicePlayer player = other.GetComponentInParent<VerticalSlicePlayer>();
            if (player == null || !player.IsAlive)
            {
                return;
            }

            float knockX = velocity.x >= 0f ? 5.5f : -5.5f;
            player.ApplyTrapDamage(damage, new Vector2(knockX, 1.8f));
            Destroy(gameObject);
        }
    }
}
