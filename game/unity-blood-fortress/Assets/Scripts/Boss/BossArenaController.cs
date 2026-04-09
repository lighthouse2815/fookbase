using BloodFortress.Core;
using BloodFortress.Dialogue;
using BloodFortress.Player;
using UnityEngine;

namespace BloodFortress.Boss
{
    [RequireComponent(typeof(Collider2D))]
    public class BossArenaController : MonoBehaviour
    {
        [SerializeField] private BossController bossController;
        [SerializeField] private DialogueSequenceSO preBossSequence;
        [SerializeField] private Animator arenaGateAnimator;
        [SerializeField] private BossArenaVfxController arenaVfxController;
        [SerializeField] private string gateCloseTrigger = "Close";
        [SerializeField] private string gateOpenTrigger = "Open";

        private bool _started;

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (_started || !other.CompareTag("Player"))
            {
                return;
            }

            _started = true;
            PlayerHealth player = other.GetComponentInParent<PlayerHealth>();
            if (player == null || bossController == null)
            {
                return;
            }

            arenaGateAnimator?.SetTrigger(gateCloseTrigger);
            GameStateManager.Instance.SetState(GameState.BossIntro);
            DialogueSystem.Instance.Play(preBossSequence, () => StartBossBattle(player));
        }

        private void StartBossBattle(PlayerHealth player)
        {
            bossController.OnFauxVictory -= HandleFauxVictory;
            bossController.OnFauxVictory += HandleFauxVictory;
            bossController.OnPhaseChanged -= HandlePhaseChanged;
            bossController.OnPhaseChanged += HandlePhaseChanged;
            bossController.StartBattle(player);
        }

        private void HandleFauxVictory()
        {
            arenaGateAnimator?.SetTrigger(gateOpenTrigger);
            SceneFlowManager.Instance.LoadScene(SceneId.FauxVictory);
        }

        private void HandlePhaseChanged(int phase)
        {
            arenaVfxController?.SetPhase(phase);
        }

        private void OnDestroy()
        {
            if (bossController == null)
            {
                return;
            }

            bossController.OnFauxVictory -= HandleFauxVictory;
            bossController.OnPhaseChanged -= HandlePhaseChanged;
        }
    }
}
