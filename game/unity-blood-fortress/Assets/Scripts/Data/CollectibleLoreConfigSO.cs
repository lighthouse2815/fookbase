using UnityEngine;

namespace BloodFortress.Data
{
    [CreateAssetMenu(menuName = "BloodFortress/Configs/Collectible Lore Config", fileName = "CollectibleLoreConfig")]
    public class CollectibleLoreConfigSO : ScriptableObject
    {
        public int unlockThreshold = 12;
        public string loreKey = "du_final_memory";
        [TextArea(2, 5)] public string unlockMessage = "Ky uc cuoi cua Hiep Si Du da duoc mo.";
    }
}
