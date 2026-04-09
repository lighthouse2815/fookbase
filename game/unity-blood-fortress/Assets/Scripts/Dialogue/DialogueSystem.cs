using System;
using BloodFortress.Core;
using TMPro;
using UnityEngine;

namespace BloodFortress.Dialogue
{
    public sealed class DialogueSystem : SingletonMono<DialogueSystem>
    {
        [SerializeField] private CanvasGroup rootPanel;
        [SerializeField] private TMP_Text speakerLabel;
        [SerializeField] private TMP_Text bodyLabel;
        [SerializeField] private TMP_Text hintLabel;
        [SerializeField] private KeyCode advanceKey = KeyCode.E;
        [SerializeField] private KeyCode alternateAdvanceKey = KeyCode.Return;

        private DialogueSequenceSO _activeSequence;
        private Action _onCompleted;
        private int _lineIndex;
        private bool _isVisible;

        public bool IsPlaying => _activeSequence != null;

        protected override bool Persistent => false;

        private void Start()
        {
            SetVisible(false);
        }

        private void Update()
        {
            if (_activeSequence == null)
            {
                return;
            }

            if (!Input.GetKeyDown(advanceKey) && !Input.GetKeyDown(alternateAdvanceKey))
            {
                return;
            }

            AdvanceLine();
        }

        public void Play(DialogueSequenceSO sequence, Action onCompleted = null)
        {
            if (sequence == null || sequence.lines.Count == 0)
            {
                onCompleted?.Invoke();
                return;
            }

            _activeSequence = sequence;
            _onCompleted = onCompleted;
            _lineIndex = 0;

            if (_activeSequence.pauseGameplay)
            {
                GameStateManager.Instance.SetState(GameState.IntroCutscene);
            }

            SetVisible(true);
            RenderLine();
        }

        public void StopImmediately()
        {
            CompleteSequence();
        }

        private void AdvanceLine()
        {
            if (_activeSequence == null)
            {
                return;
            }

            _lineIndex++;
            if (_lineIndex >= _activeSequence.lines.Count)
            {
                CompleteSequence();
                return;
            }

            RenderLine();
        }

        private void RenderLine()
        {
            if (_activeSequence == null)
            {
                return;
            }

            DialogueLine line = _activeSequence.lines[_lineIndex];
            if (speakerLabel != null)
            {
                speakerLabel.text = line.speaker;
            }

            if (bodyLabel != null)
            {
                bodyLabel.text = line.text;
            }

            if (hintLabel != null)
            {
                hintLabel.text = $"[{advanceKey}] continue";
            }
        }

        private void CompleteSequence()
        {
            DialogueSequenceSO finished = _activeSequence;
            Action callback = _onCompleted;
            _activeSequence = null;
            _onCompleted = null;
            _lineIndex = 0;
            SetVisible(false);

            if (finished != null && finished.pauseGameplay && GameStateManager.Instance.CurrentState == GameState.IntroCutscene)
            {
                GameStateManager.Instance.SetState(GameState.Gameplay);
            }

            callback?.Invoke();
        }

        private void SetVisible(bool visible)
        {
            _isVisible = visible;
            if (rootPanel == null)
            {
                return;
            }

            rootPanel.alpha = visible ? 1f : 0f;
            rootPanel.interactable = visible;
            rootPanel.blocksRaycasts = visible;
        }
    }
}
