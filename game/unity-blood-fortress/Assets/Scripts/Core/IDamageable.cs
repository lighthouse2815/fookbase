namespace BloodFortress.Core
{
    public interface IDamageable
    {
        bool IsAlive { get; }
        void TakeDamage(DamageData damage);
    }
}
