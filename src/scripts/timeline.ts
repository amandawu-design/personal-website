// Keyframe builders for the case study animations (BankPortal, AiOnboarding).
// Every animated element runs for the whole scenario (--T) and names its
// keyframes in --a; the builders below turn "happens at p%" into keyframes.
// Build every animation in the component frontmatter, then call css() to get
// the @keyframes for a <style> tag (builders called later in the template
// would be missing from it).

export type Point = [pct: number, x: number, y: number];

export function createTimeline() {
  const keyframes = new Map<string, string>();
  const n = (v: number) => +v.toFixed(2);
  const id = (...parts: (number | string)[]) => parts.join('_').replace(/[^a-z0-9_]/gi, 'x');
  const kf = (name: string, body: string) => (keyframes.set(name, body), name);

  return {
    n,
    kf,
    css: () => [...keyframes].map(([name, body]) => `@keyframes ${name}{${body}}`).join('\n'),

    /** hidden until p, then shown */
    on: (p: number) => kf(`tl-on-${id(p)}`, `0%,${n(p - 0.3)}%{opacity:0}${p}%,100%{opacity:1}`),
    /** shown until p, then hidden */
    off: (p: number) => kf(`tl-off-${id(p)}`, `0%,${n(p - 0.3)}%{opacity:1}${p}%,100%{opacity:0}`),
    /** shown between a and b */
    between: (a: number, b: number) =>
      kf(`tl-btw-${id(a, b)}`, `0%,${n(a - 0.3)}%{opacity:0}${a}%,${n(b - 0.3)}%{opacity:1}${b}%,100%{opacity:0}`),
    /** hidden between a and b */
    outside: (a: number, b: number) =>
      kf(`tl-out-${id(a, b)}`, `0%,${n(a - 0.3)}%{opacity:1}${a}%,${n(b - 0.3)}%{opacity:0}${b}%,100%{opacity:1}`),
    /** button press at p */
    press: (p: number) =>
      kf(`tl-press-${id(p)}`, `0%,${n(p - 0.8)}%,${n(p + 1)}%,100%{transform:none;filter:none}${p}%{transform:scale(.94);filter:brightness(1.2)}`),
    /** scaleX grow (bars) from `from` to 1 between a and b */
    grow: (a: number, b: number, from = 0) =>
      kf(`tl-grow-${id(a, b, from)}`, `0%,${a}%{transform:scaleX(${from})}${b}%,100%{transform:scaleX(1)}`),
    /** transform from `from` to none between a and b (slide screens in, move knobs) */
    settle: (a: number, b: number, from: string) =>
      kf(`tl-settle-${id(a, b, from)}`, `0%,${a}%{transform:${from}}${b}%,100%{transform:none}`),
    /** stroke draw between a and b (path needs pathLength="1") */
    draw: (a: number, b: number) => kf(`tl-draw-${id(a, b)}`, `0%,${a}%{stroke-dashoffset:1}${b}%,100%{stroke-dashoffset:0}`),
    /** desktop toast: in at a, out at b */
    toast: (a: number, b: number) =>
      kf(
        `tl-toast-${id(a, b)}`,
        `0%,${a}%{opacity:0;transform:translateY(1.5em)}${n(a + 2)}%,${b}%{opacity:1;transform:none}${n(b + 2)}%,100%{opacity:0;transform:translateY(1.5em)}`,
      ),
    /** phone notification banner: drops in at a, dismissed at b */
    banner: (a: number, b: number) =>
      kf(
        `tl-banner-${id(a, b)}`,
        `0%,${a}%{opacity:0;transform:translateY(-130%)}${n(a + 2.5)}%,${b}%{opacity:1;transform:none}${n(b + 2)}%,100%{opacity:0;transform:scale(.94)}`,
      ),
    /** a line that appears at a (offset by `from` em), then is dragged into place between start and end */
    dragLine: (a: number, start: number, end: number, from: number) =>
      kf(
        `tl-drag-${id(a, start, end)}`,
        `0%,${n(a - 0.3)}%{opacity:0;transform:translateY(${from}em)}${a}%,${start}%{opacity:1;transform:translateY(${from}em)}${end}%,100%{opacity:1;transform:none}`,
      ),
    /** chat message: its row opens at p, then it fades in (needs a grid row wrapper) */
    reveal: (p: number) =>
      kf(
        `tl-reveal-${id(p)}`,
        `0%,${p}%{grid-template-rows:0fr;opacity:0}${n(p + 1.2)}%{grid-template-rows:1fr;opacity:0}${n(p + 2.2)}%,100%{grid-template-rows:1fr;opacity:1}`,
      ),
    /** chat row that appears at a and collapses again at b (typing / status rows) */
    transient: (a: number, b: number) =>
      kf(
        `tl-transient-${id(a, b)}`,
        `0%,${a}%{grid-template-rows:0fr;opacity:0}${n(a + 1.2)}%,${n(b - 1)}%{grid-template-rows:1fr;opacity:1}${b}%,100%{grid-template-rows:0fr;opacity:0}`,
      ),
    /** chip that becomes selected at p (colours come from --from-* / --to-* custom props) */
    select: (p: number) =>
      kf(
        `tl-select-${id(p)}`,
        `0%,${n(p - 0.3)}%{background:var(--from-bg);color:var(--from-fg)}${p}%,100%{background:var(--to-bg);color:var(--to-fg)}`,
      ),

    /** follow a path of points: translate(x, y) in em */
    path: (name: string, pts: Point[], fn = (x: number, y: number) => `translate(${x}em,${y}em)`) =>
      kf(name, pts.map(([p, x, y]) => `${p}%{transform:${fn(n(x), n(y))}}`).join('')),
    /** click ripple at each pct */
    clicks: (name: string, pcts: number[]) =>
      kf(
        name,
        '0%{opacity:0}' +
          pcts.map((p) => `${n(p - 0.4)}%{opacity:0;transform:scale(.3)}${p}%{opacity:.6;transform:scale(.7)}${n(p + 1.6)}%{opacity:0;transform:scale(1.5)}`).join('') +
          '100%{opacity:0}',
      ),
    /** finger taps on a phone: [pct, x, y] in screen em */
    taps: (name: string, list: Point[]) => {
      const at = (x: number, y: number, s: number) => `transform:translate(${n(x)}em,${n(y)}em) scale(${s})`;
      const [, x0, y0] = list[0];
      const [, xl, yl] = list[list.length - 1];
      return kf(
        name,
        `0%{opacity:0;${at(x0, y0, 0.5)}}` +
          list.map(([p, x, y]) => `${n(p - 1.2)}%{opacity:0;${at(x, y, 0.5)}}${p}%{opacity:.5;${at(x, y, 0.85)}}${n(p + 1.4)}%{opacity:0;${at(x, y, 1.35)}}`).join('') +
          `100%{opacity:0;${at(xl, yl, 1.35)}}`,
      );
    },
    /** a transform that is `moved` during each [a, b] range and `rest` otherwise */
    during: (name: string, ranges: [number, number][], moved: string, rest = 'none') =>
      kf(
        name,
        `0%{transform:${rest}}` +
          ranges.map(([a, b]) => `${a}%{transform:${rest}}${n(a + 1)}%,${n(b - 1)}%{transform:${moved}}${b}%{transform:${rest}}`).join('') +
          `100%{transform:${rest}}`,
      ),
  };
}
