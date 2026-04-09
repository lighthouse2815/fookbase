using UnityEngine;

namespace BloodFortress.Core
{
    public readonly struct DamageData
    {
        public readonly int Amount;
        public readonly Vector2 Knockback;
        public readonly Transform Source;

        public DamageData(int amount, Vector2 knockback, Transform source)
        {
            Amount = Mathf.Max(0, amount);
            Knockback = knockback;
            Source = source;
        }
    }
}
