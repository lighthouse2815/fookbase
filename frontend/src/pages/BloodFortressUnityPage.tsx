import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const UNITY_WEBGL_PATH = '/unity/hiep-si-dang-phao-dai-mau/index.html';

type UnityBuildState = 'checking' | 'ready' | 'missing' | 'error';

const isLikelyUnityIndex = (html: string) => {
  const normalized = html.toLowerCase();
  return normalized.includes('createunityinstance') || normalized.includes('unity-canvas');
};

const panelBase =
  'rounded-2xl border border-red-900/50 bg-zinc-950/80 p-5 text-zinc-200 shadow-[0_24px_70px_rgba(0,0,0,0.45)]';

const headingStyle =
  'font-["Palatino_Linotype","Book_Antiqua",Georgia,serif] text-3xl font-bold uppercase tracking-[0.08em] text-red-100';

const bodyStyle = 'font-["Palatino_Linotype","Book_Antiqua",Georgia,serif] text-zinc-300 leading-7';

const noteStyle = 'rounded-xl border border-zinc-700/70 bg-zinc-900/60 px-4 py-3 text-sm text-zinc-300';

const BloodFortressUnityPage = () => {
  const [buildState, setBuildState] = useState<UnityBuildState>('checking');
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkUnityBuild = async () => {
      try {
        const response = await fetch(UNITY_WEBGL_PATH, {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          if (!cancelled) {
            setBuildState('missing');
          }
          return;
        }

        const html = await response.text();
        if (!cancelled) {
          setBuildState(isLikelyUnityIndex(html) ? 'ready' : 'missing');
        }
      } catch (error) {
        if (!cancelled) {
          setBuildState('error');
          setErrorText(error instanceof Error ? error.message : 'Unknown error');
        }
      }
    };

    void checkUnityBuild();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusText = useMemo(() => {
    if (buildState === 'checking') {
      return 'Dang kiem tra goi WebGL build...';
    }
    if (buildState === 'ready') {
      return 'Da tim thay Unity WebGL build, dang nhung vao trang.';
    }
    if (buildState === 'missing') {
      return 'Chua tim thay file WebGL build de nhung.';
    }
    return `Khong the kiem tra build: ${errorText ?? 'unknown error'}`;
  }, [buildState, errorText]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(126,20,33,0.22),transparent_34%),linear-gradient(180deg,#120b11_0%,#08080a_55%,#040406_100%)] text-zinc-100">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-5 px-3 pb-7 pt-5 sm:px-5">
        <section className={panelBase}>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
            Unity WebGL Embed
          </p>
          <h1 className={headingStyle}>Hiep Si Dang: Phao Dai Mau</h1>
          <p className={`${bodyStyle} mt-3 max-w-5xl`}>
            Trang nay uu tien nhung ban Unity WebGL. Neu chua co artifact build, ban van co the
            vao ban canvas de choi ngay va tiep tuc test gameplay.
          </p>
          <p className={`${noteStyle} mt-4`}>{statusText}</p>
        </section>

        {buildState === 'ready' ? (
          <section className={panelBase}>
            <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-black">
              <iframe
                title="Hiep Si Dang Unity WebGL"
                src={UNITY_WEBGL_PATH}
                className="h-[calc(100vh-13rem)] min-h-[560px] w-full"
                allow="autoplay; fullscreen"
              />
            </div>
          </section>
        ) : (
          <section className={panelBase}>
            <h2 className='font-["Palatino_Linotype","Book_Antiqua",Georgia,serif] text-xl font-bold text-red-100'>
              Chua co file build Unity WebGL trong frontend/public
            </h2>
            <p className={`${bodyStyle} mt-2`}>
              Can copy output build Unity vao duong dan:
              <code className="ml-1 rounded bg-zinc-900 px-1.5 py-0.5 text-amber-200">
                frontend/public/unity/hiep-si-dang-phao-dai-mau/
              </code>
            </p>
            <p className={`${bodyStyle} mt-2`}>
              Sau khi copy xong, reload trang nay de nhung ban Unity.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/games/hiep-si-dang-phao-dai-mau/canvas"
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
              >
                Mo ban canvas de choi ngay
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg border border-red-800/70 bg-red-950/60 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-900/70"
              >
                Kiem tra lai build
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BloodFortressUnityPage;
