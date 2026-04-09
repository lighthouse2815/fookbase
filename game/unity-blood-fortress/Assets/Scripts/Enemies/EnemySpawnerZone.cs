using System.Collections.Generic;
using UnityEngine;

namespace BloodFortress.Enemies
{
    [RequireComponent(typeof(Collider2D))]
    public class EnemySpawnerZone : MonoBehaviour
    {
        [SerializeField] private bool spawnOnPlayerEnter = true;
        [SerializeField] private bool spawnOnlyOnce = true;
        [SerializeField] private Transform[] spawnPoints;
        [SerializeField] private EnemyBase[] enemyPrefabs;
        [SerializeField] private int[] enemyCounts;
        [SerializeField] private float spawnDelayBetweenUnits = 0.15f;

        private bool _spawned;

        private void OnTriggerEnter2D(Collider2D other)
        {
            if (!spawnOnPlayerEnter || !other.CompareTag("Player"))
            {
                return;
            }

            if (_spawned && spawnOnlyOnce)
            {
                return;
            }

            _spawned = true;
            StartCoroutine(SpawnRoutine());
        }

        private System.Collections.IEnumerator SpawnRoutine()
        {
            if (enemyPrefabs == null || enemyPrefabs.Length == 0)
            {
                yield break;
            }

            for (int i = 0; i < enemyPrefabs.Length; i++)
            {
                EnemyBase prefab = enemyPrefabs[i];
                if (prefab == null)
                {
                    continue;
                }

                int count = enemyCounts != null && i < enemyCounts.Length ? Mathf.Max(1, enemyCounts[i]) : 1;
                for (int j = 0; j < count; j++)
                {
                    Transform point = spawnPoints != null && spawnPoints.Length > 0
                        ? spawnPoints[(i + j) % spawnPoints.Length]
                        : transform;

                    Instantiate(prefab, point.position, point.rotation);
                    yield return new WaitForSeconds(spawnDelayBetweenUnits);
                }
            }
        }
    }
}
