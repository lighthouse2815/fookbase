using UnityEngine;

namespace BloodFortress.Core
{
    public abstract class SingletonMono<T> : MonoBehaviour where T : MonoBehaviour
    {
        private static T _instance;

        public static T Instance
        {
            get
            {
                if (_instance != null)
                {
                    return _instance;
                }

                _instance = FindObjectOfType<T>();
                return _instance;
            }
        }

        protected virtual bool Persistent => true;

        protected virtual void Awake()
        {
            if (_instance == null)
            {
                _instance = this as T;
                if (Persistent)
                {
                    DontDestroyOnLoad(gameObject);
                }
                return;
            }

            if (_instance != this)
            {
                Destroy(gameObject);
            }
        }
    }
}
