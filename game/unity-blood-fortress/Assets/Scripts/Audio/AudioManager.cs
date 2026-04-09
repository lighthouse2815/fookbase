using System.Collections;
using BloodFortress.Core;
using UnityEngine;
using UnityEngine.Audio;

namespace BloodFortress
{
    public sealed class AudioManager : SingletonMono<AudioManager>
    {
        [SerializeField] private AudioSource musicSource;
        [SerializeField] private AudioSource sfxSource;
        [SerializeField] private float musicFadeDuration = 0.35f;

        private Coroutine _musicFadeRoutine;

        protected override bool Persistent => true;

        public void PlayMusic(AudioClip clip, bool loop = true)
        {
            if (musicSource == null || clip == null)
            {
                return;
            }

            if (musicSource.clip == clip && musicSource.isPlaying)
            {
                return;
            }

            if (_musicFadeRoutine != null)
            {
                StopCoroutine(_musicFadeRoutine);
            }

            _musicFadeRoutine = StartCoroutine(FadeMusicRoutine(clip, loop));
        }

        public void StopMusic()
        {
            if (musicSource == null)
            {
                return;
            }

            musicSource.Stop();
            musicSource.clip = null;
        }

        public void PlaySfx(AudioClip clip, float volume = 1f, float pitch = 1f)
        {
            if (sfxSource == null || clip == null)
            {
                return;
            }

            sfxSource.pitch = pitch;
            sfxSource.PlayOneShot(clip, Mathf.Clamp01(volume));
        }

        private IEnumerator FadeMusicRoutine(AudioClip nextClip, bool loop)
        {
            float timer = 0f;
            float initialVolume = musicSource.volume;

            while (timer < musicFadeDuration)
            {
                timer += Time.unscaledDeltaTime;
                musicSource.volume = Mathf.Lerp(initialVolume, 0f, timer / musicFadeDuration);
                yield return null;
            }

            musicSource.clip = nextClip;
            musicSource.loop = loop;
            musicSource.Play();

            timer = 0f;
            while (timer < musicFadeDuration)
            {
                timer += Time.unscaledDeltaTime;
                musicSource.volume = Mathf.Lerp(0f, initialVolume, timer / musicFadeDuration);
                yield return null;
            }

            musicSource.volume = initialVolume;
            _musicFadeRoutine = null;
        }
    }
}
