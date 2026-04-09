using UnityEngine;

namespace BloodFortress.Data
{
    [CreateAssetMenu(menuName = "BloodFortress/Configs/Player Config", fileName = "PlayerConfig")]
    public class PlayerConfigSO : ScriptableObject
    {
        [Header("Movement")]
        public float moveSpeed = 6.5f;
        public float acceleration = 70f;
        public float airControlPercent = 0.75f;
        public float jumpForce = 14f;
        public int maxAirJumps = 1;
        public float coyoteTime = 0.12f;
        public float jumpBuffer = 0.14f;
        public float maxFallSpeed = -22f;

        [Header("Dash")]
        public float dashSpeed = 14f;
        public float dashDuration = 0.15f;
        public float dashCooldown = 0.7f;

        [Header("Combat")]
        public int baseAttackDamage = 20;
        public float attackCooldown = 0.26f;
        public float attackActiveWindow = 0.12f;

        [Header("Health")]
        public int maxHp = 120;
        public int maxRespawns = 3;
        public float invulnerabilityTime = 0.7f;
        public float respawnDelay = 1f;
    }
}
