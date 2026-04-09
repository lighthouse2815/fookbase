using System;
using System.Collections.Generic;
using UnityEngine;

namespace BloodFortress.Dialogue
{
    [Serializable]
    public class DialogueLine
    {
        public string speaker;
        [TextArea(2, 5)] public string text;
    }

    [CreateAssetMenu(menuName = "BloodFortress/Dialogue/Sequence", fileName = "DialogueSequence")]
    public class DialogueSequenceSO : ScriptableObject
    {
        public string sequenceId = "sequence";
        public bool pauseGameplay = true;
        public bool allowSkip = false;
        public List<DialogueLine> lines = new();
    }
}
