using UnityEngine;

namespace BloodFortress.Data
{
    [CreateAssetMenu(menuName = "BloodFortress/Configs/Enemy Config", fileName = "EnemyConfig")]
    public class EnemyConfigSO : ScriptableObject
    {
        [Header("Core")]
        public string enemyId = "enemy";
        public int maxHp = 40;
        public float moveSpeed = 2.1f;
        public float aggroRange = 6f;
        public float attackRange = 1.3f;
        public int attackDamage = 10;
        public float attackCooldown = 1.2f;
        public float knockbackResistance = 0.4f;
        public float contactDamage = 6f;

        [Header("Loot")]
        public int soulDropCount = 1;
        public GameObject soulFragmentPrefab;
    }
}
