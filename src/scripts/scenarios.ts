// Playback for multi-scenario case study animations (BankPortal, PosCapital).
//
// Markup contract:
//   root    [data-scene="<key>"]  – toggles data-play / data-paused; CSS gates animations on them
//   frame   (passed in)           – the role="img" element; its aria-label follows the scenario
//   buttons [data-scene-btn="<key>"][data-name][data-label] – one dash per scenario
//
// Each dash's progress fill (keyframes named `progressName`) doubles as the
// scenario timer: when it ends, the next scenario starts. Pressing the current
// dash pauses / resumes; pressing another switches. Playback starts when the
// frame scrolls into view and pauses off-screen. With prefers-reduced-motion
// nothing plays; the dashes still switch between the static end states.

export function initScenarios(root: HTMLElement, frame: HTMLElement, progressName: string) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tabs = [...root.querySelectorAll<HTMLButtonElement>('[data-scene-btn]')];
  let started = false;
  let userPaused = false;
  let onScreen = false;

  const syncPaused = () => {
    root.toggleAttribute('data-paused', userPaused || !onScreen);
    tabs.forEach((t) => {
      const current = t.dataset.sceneBtn === root.dataset.scene;
      const name = t.dataset.name;
      t.setAttribute(
        'aria-label',
        !current ? `Show ${name} scenario` : reduceMotion ? `${name} scenario (shown)` : `${userPaused ? 'Play' : 'Pause'} ${name} animation`,
      );
    });
  };

  const show = (key: string) => {
    root.dataset.scene = key;
    tabs.forEach((t) => t.setAttribute('aria-current', String(t.dataset.sceneBtn === key)));
    frame.setAttribute('aria-label', tabs.find((t) => t.dataset.sceneBtn === key)?.dataset.label ?? '');
    if (started) {
      // restart every animation in the scene from the top
      root.removeAttribute('data-play');
      void root.offsetWidth;
      root.setAttribute('data-play', '');
    }
    syncPaused();
  };

  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      if (t.dataset.sceneBtn === root.dataset.scene && started) {
        userPaused = !userPaused; // current dash toggles pause
        syncPaused();
      } else {
        userPaused = false;
        show(t.dataset.sceneBtn!);
      }
    }),
  );
  syncPaused();

  if (reduceMotion) return;

  root.addEventListener('animationend', (e) => {
    if (e.animationName !== progressName) return;
    const i = tabs.findIndex((t) => t.dataset.sceneBtn === root.dataset.scene);
    show(tabs[(i + 1) % tabs.length].dataset.sceneBtn!);
  });

  new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && !started) {
        started = true;
        root.setAttribute('data-play', '');
      }
      syncPaused();
    },
    { threshold: 0.3 },
  ).observe(frame);
}
