using System;
using UnityEngine;

namespace BloodFortress.Data
{
    [CreateAssetMenu(menuName = "BloodFortress/Configs/Boss Config", fileName = "BossConfig_DrPhieu")]
    public class BossConfigSO : ScriptableObject
    {
        [Header("Core")]
        public int maxHp = 850;
        [Range(0.1f, 0.95f)] public float phaseTwoHpThresholdNormalized = 0.45f;
        public int contactDamage = 16;
        public Vector2 contactKnockback = new(5f, 3.2f);

        [Header("Attack Timings")]
        public float idleBetweenPatterns = 0.7f;
        public float phaseTransitionInvulnerableTime = 2.2f;

        [Header("Phase 1 Damage")]
        public int scalpelRushDamage = 16;
        public int syringeVolleyDamage = 12;
        public int vialThrowDamage = 14;
        public int corpseHandDamage = 15;

        [Header("Phase 2 Damage")]
        public int bloodSlamDamage = 20;
        public int fleshSweepDamage = 18;
        public int bioStormDamage = 12;

        [Header("False Victory")]
        public float fauxVictoryPause = 1.4f;
        public float scriptedDefeatDelay = 2f;

        [Header("Projectiles")]
        public GameObject syringeProjectilePrefab;
        public GameObject vialProjectilePrefab;
        public GameObject bioStormProjectilePrefab;
        public GameObject fleshWavePrefab;
    }
}
