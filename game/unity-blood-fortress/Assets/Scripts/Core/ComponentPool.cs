using System.Collections.Generic;
using UnityEngine;

namespace BloodFortress.Core
{
    public class ComponentPool<T> where T : Component
    {
        private readonly T _prefab;
        private readonly Transform _root;
        private readonly Queue<T> _pool = new();

        public ComponentPool(T prefab, int preloadCount, Transform root = null)
        {
            _prefab = prefab;
            _root = root;

            for (int i = 0; i < preloadCount; i++)
            {
                T instance = Object.Instantiate(_prefab, _root);
                instance.gameObject.SetActive(false);
                _pool.Enqueue(instance);
            }
        }

        public T Spawn(Vector3 position, Quaternion rotation)
        {
            T instance = _pool.Count > 0 ? _pool.Dequeue() : Object.Instantiate(_prefab, _root);
            instance.transform.SetPositionAndRotation(position, rotation);
            instance.gameObject.SetActive(true);
            return instance;
        }

        public void Despawn(T instance)
        {
            if (instance == null)
            {
                return;
            }

            instance.gameObject.SetActive(false);
            _pool.Enqueue(instance);
        }
    }
}
