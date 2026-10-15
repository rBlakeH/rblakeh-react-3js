import React, { useEffect, useRef } from 'react';
import { finale, stations } from '../data/stations.js';
import { useSection } from '../scroll/useDriver.jsx';
import { applyFinaleStage, applyFinaleText, measureFinale } from '../scroll/finale.js';
import { createFlapBoard } from '../scroll/flap.js';
import { useScene } from '../scenes/useScene.js';
import { StationDirectory } from './StationDirectory.jsx';

/**
 * @param {object} props
 * @param {React.RefObject<HTMLElement>} props.rootRef
 * @param {(index: number) => void} props.onJump
 */
export function Finale({ rootRef, onJump }) {
  const stageRef = useRef(null);
  const textRef = useRef(null);
  const paraRef = useRef(null);
  const boardRef = useRef(null);
  const hostRef = useRef(null);
  const flapRef = useRef(null);

  const { sceneRef, ready, update } = useScene('terminus', hostRef);

  // The stage sits under the text block, so its top depends on how tall that
  // block lays out — a resize-time measurement, not a per-frame one.
  useEffect(() => {
    const measure = () => {
      measureFinale({ stage: stageRef.current, text: textRef.current, para: paraRef.current });
      sceneRef.current?.resize();
    };
    measure();
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => window.removeEventListener('resize', measure);
  }, [sceneRef]);

  useEffect(() => {
    if (boardRef.current) flapRef.current = createFlapBoard(boardRef.current);
  }, []);

  useSection(
    rootRef,
    (frame) => {
      const opacity = applyFinaleStage(frame.progress, stageRef.current);
      applyFinaleText(frame.progress, textRef.current);
      flapRef.current?.(frame.progress);
      update(frame.distance);
      if (opacity > 0.01) sceneRef.current?.frame(frame.progress);
    }
  );

  return (
    <section
      ref={rootRef}
      data-scroll-root="true"
      data-screen-label={finale.label}
      className="station station--overlap finale"
    >
      <div className="station__pin">
        <div ref={stageRef} className="finale__stage" aria-hidden="true">
          <div ref={hostRef} className="stage__scene" />
          {!ready && <div className="stage__placeholder">{finale.label}</div>}
        </div>

        <div ref={textRef} className="finale__text">
          <div className="finale__col">
            <div className="eyebrow">
              <span className="eyebrow__dot" aria-hidden="true" />
              {finale.eyebrow}
            </div>
            <h2 className="finale__heading">{finale.heading}</h2>
            <p ref={paraRef} className="finale__para">
              {finale.paragraph}
            </p>
            <div className="finale__credits">
              {finale.credits.map((c, i) => (
                <React.Fragment key={c}>
                  {i > 0 && <span aria-hidden="true">·</span>}
                  <span>{c}</span>
                </React.Fragment>
              ))}
            </div>

            <nav className="route" aria-label="Jump to a station">
              {stations.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className="route__stop"
                  onClick={() => onJump(i)}
                >
                  <span className="route__dot" aria-hidden="true" />
                  {s.jumpLabel}
                </button>
              ))}
              <div className="route__today">
                <span className="route__dot" aria-hidden="true" />
                Today
              </div>
            </nav>
          </div>

          <StationDirectory ref={boardRef} />
        </div>
      </div>
    </section>
  );
}
