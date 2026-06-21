import { useEffect, useRef } from 'react';
import { smoothstep } from '../three/math.js';

/**
 * Overlays — the fixed DOM layered over the canvas (intro hero + info card).
 * Runs its own rAF loop reading the shared scroll `progress` ref and animates
 * opacity / transform via element refs, so scrolling never re-renders React:
 *   - intro fades + drifts up over the first 26% of scroll
 *   - card fades + rises in between 34% and 62%
 */
export default function Overlays({ progress, config }) {
  const introRef = useRef();
  const hintRef = useRef();
  const cardRef = useRef();

  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = progress.current;
      const t = (now - start) / 1000;

      if (introRef.current) {
        introRef.current.style.opacity = 1 - smoothstep(0, 0.26, p);
        introRef.current.style.transform = `translateY(${-p * 140}px)`;
      }
      if (hintRef.current) {
        hintRef.current.style.opacity =
          (0.6 - smoothstep(0, 0.1, p) * 0.6) * (0.7 + Math.sin(t * 2) * 0.3);
      }
      if (cardRef.current) {
        const ca = smoothstep(0.34, 0.62, p);
        cardRef.current.style.opacity = ca;
        cardRef.current.style.transform = `translateY(${(1 - ca) * 70}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  const { intro, content } = config;

  return (
    <>
      <div className="intro" ref={introRef}>
        <div className="intro-eyebrow">{intro.eyebrow}</div>
        <h1 className="intro-name">{intro.name}</h1>
        <div className="intro-role">{intro.role}</div>
        <div className="intro-hint" ref={hintRef}>
          scroll ↓
        </div>
      </div>

      <article className="info-card" ref={cardRef}>
        <div className="info-label">
          <span className="info-dot" />
          {content.label}
        </div>
        <h2 className="info-title">{content.title}</h2>
        <div className="info-subtitle">{content.subtitle}</div>
        <div className="info-dates">{content.dates}</div>
        <p className="info-body">{content.body}</p>
        <div className="info-tags">
          {content.tags.map((tag) => (
            <span className="info-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </article>
    </>
  );
}
