using System.Collections.Generic;
using UnityEngine;

namespace BloodFortress.Traps
{
    public class BossHazardGroupController : MonoBehaviour
    {
        [SerializeField] private List<TrapController> phaseOneHazards = new();
        [SerializeField] private List<TrapController> phaseTwoHazards = new();

        public void SetPhase(int phase)
        {
            bool phaseTwo = phase >= 2;

            for (int i = 0; i < phaseOneHazards.Count; i++)
            {
                if (phaseOneHazards[i] != null)
                {
                    phaseOneHazards[i].SetActive(!phaseTwo);
                }
            }

            for (int i = 0; i < phaseTwoHazards.Count; i++)
            {
                if (phaseTwoHazards[i] != null)
                {
                    phaseTwoHazards[i].SetActive(phaseTwo);
                }
            }
        }
    }
}
