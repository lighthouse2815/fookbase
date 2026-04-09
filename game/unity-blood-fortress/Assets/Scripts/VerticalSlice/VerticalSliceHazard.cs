using UnityEngine;

namespace BloodFortress.VerticalSlice
{
    public class VerticalSliceHazard : MonoBehaviour
    {
        [SerializeField] private int damage = 18;
        [SerializeField] private Vector2 knockback = new(4.5f, 2.5f);
        [SerializeField] private bool instantKill;
        [SerializeField] private float hitCooldown = 0.45f;

        private float _cooldownTimer;

        public void Configure(int newDamage, Vector2 newKnockback, bool killInstantly, float cooldown = 0.45f)
        {
            damage = newDamage;
            knockback = newKnockback;
            instantKill = killInstantly;
            hitCooldown = Mathf.Max(0.05f, cooldown);
        }

        private void Update()
        {
            _cooldownTimer = Mathf.Max(0f, _cooldownTimer - Time.deltaTime);
        }

        private void OnTriggerStay2D(Collider2D other)
        {
            if (_cooldownTimer > 0f)
            {
                return;
            }

            VerticalSlicePlayer player = other.GetComponentInParent<VerticalSlicePlayer>();
            if (player == null || !player.IsAlive)
            {
                return;
            }

            _cooldownTimer = hitCooldown;
            Vector2 kb = knockback;
            kb.x = player.transform.position.x >= transform.position.x ? Mathf.Abs(kb.x) : -Mathf.Abs(kb.x);

            if (instantKill)
            {
                player.ForceScriptedFinalDefeat();
                return;
            }

            player.ApplyTrapDamage(damage, kb);
        }
    }
}
