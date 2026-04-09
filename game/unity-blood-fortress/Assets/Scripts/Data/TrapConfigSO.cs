using UnityEngine;

namespace BloodFortress.Data
{
    [CreateAssetMenu(menuName = "BloodFortress/Configs/Trap Config", fileName = "TrapConfig")]
    public class TrapConfigSO : ScriptableObject
    {
        public string trapId = "trap";
        public int damage = 14;
        public float damageTickInterval = 0.4f;
        public float activeDuration = 1f;
        public float inactiveDuration = 1f;
        public float moveAmplitude = 1.5f;
        public float moveSpeed = 2.2f;
    }
}
