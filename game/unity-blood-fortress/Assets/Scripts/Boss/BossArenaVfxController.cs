using BloodFortress.Core;
using UnityEngine;

namespace BloodFortress.Boss
{
    public class BossArenaVfxController : MonoBehaviour
    {
        [SerializeField] private Light[] redPulseLights;
        [SerializeField] private float baseIntensity = 0.8f;
        [SerializeField] private float pulseIntensity = 1.4f;
        [SerializeField] private float pulseSpeed = 2.6f;

        private int _phase = 1;

        private void Update()
        {
            if (redPulseLights == null || redPulseLights.Length == 0)
            {
                return;
            }

            float pulse = (Mathf.Sin(Time.time * pulseSpeed) + 1f) * 0.5f;
            float target = _phase == 1
                ? Mathf.Lerp(baseIntensity * 0.8f, baseIntensity, pulse)
                : Mathf.Lerp(baseIntensity, pulseIntensity, pulse);

            for (int i = 0; i < redPulseLights.Length; i++)
            {
                if (redPulseLights[i] != null)
                {
                    redPulseLights[i].intensity = target;
                }
            }
        }

        public void SetPhase(int phase)
        {
            _phase = Mathf.Max(1, phase);
            pulseSpeed = _phase == 1 ? 2.6f : 4.1f;
        }
    }
}
