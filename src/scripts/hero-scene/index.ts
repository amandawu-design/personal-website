// Entry point for the hero animation. Handles word hover + auto-cycle,
// and lazy-loads the Three.js scene so it doesn't block first paint.

export type Mode = 'strategize' | 'design' | 'build';
export const MODES: Mode[] = ['strategize', 'design', 'build'];

const CYCLE_MS = 3200;

export function initHero() {
  const wrap = document.querySelector<HTMLElement>('[data-hero-canvas]');
  const words = document.querySelector<HTMLElement>('[data-hero-words]');
  if (!wrap || !words) return;

  let mode: Mode = 'strategize';
  let hovering = false;
  let timer: number | undefined;
  let setSceneMode: ((m: Mode) => void) | null = null;

  const apply = (m: Mode) => {
    mode = m;
    words.dataset.active = m;
    setSceneMode?.(m);
  };

  const startCycle = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => {
      if (hovering || document.hidden) return;
      apply(MODES[(MODES.indexOf(mode) + 1) % MODES.length]);
    }, CYCLE_MS);
  };

  apply(mode);
  startCycle();

  // Hover only on devices that actually support it; touch = auto-cycle only.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    words.querySelectorAll<HTMLElement>('.hero-word[data-mode]').forEach((el) => {
      el.addEventListener('pointerenter', () => {
        hovering = true;
        apply(el.dataset.mode as Mode);
      });
      el.addEventListener('pointerleave', () => {
        hovering = false;
        startCycle(); // give the hovered shape a full beat before cycling on
      });
    });
  }

  const load = () =>
    import('./scene')
      .then(({ createScene }) => {
        const scene = createScene(wrap, mode);
        if (!scene) throw new Error('WebGL unavailable');
        setSceneMode = scene.setMode;
      })
      .catch(() => {
        wrap.querySelector<HTMLElement>('.hero-fallback')?.style.setProperty('opacity', '1');
      });

  if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 600 });
  else setTimeout(load, 50);
}
