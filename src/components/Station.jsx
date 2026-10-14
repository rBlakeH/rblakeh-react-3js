import React, { useRef } from 'react';
import { useSection } from '../scroll/useDriver.jsx';
import { applyStation, settleStation } from '../scroll/timings.js';
import { useScene } from '../scenes/useScene.js';
import { RoleCard } from './RoleCard.jsx';

/**
 * A pinned 100vh stage with its role card. The section is 300vh tall and
 * sections after the first pull up -100vh so the next stage pins the moment
 * this one releases.
 *
 * @param {object} props
 * @param {object} props.station entry from data/stations.js
 * @param {React.RefObject<HTMLElement>} props.rootRef the scroll root, owned by App (route jumps need it)
 * @param {boolean} [props.overlap] false only for the first station
 * @param {React.ReactNode} [props.overlay] hero or other absolutely-placed content
 * @param {(frame: object, stage: HTMLElement|null) => void} [props.onFrame]
 * @param {() => void} [props.onSettle]
 */
export function Station({ station, rootRef, overlap = true, overlay, onFrame, onSettle }) {
  const stageRef = useRef(null);
  const cardRef = useRef(null);
  const hostRef = useRef(null);
  const { sceneRef, ready } = useScene(station.id, hostRef, { cardRef });

  useSection(
    rootRef,
    (frame) => {
      applyStation(frame.progress, stageRef.current, cardRef.current, station.dir);
      // Only draw while the section is on screen; a stage at opacity 0 has
      // nothing to show and its scene should not be burning a frame.
      if (frame.visible) sceneRef.current?.frame(frame.progress, frame.now);
      onFrame?.(frame, stageRef.current);
    },
    () => {
      // Reduced motion leaves the scene undrawn on purpose — step 6 replaces
      // the whole stage with the stacked-document fallback.
      settleStation(stageRef.current, cardRef.current);
      onSettle?.();
    }
  );

  return (
    <section
      ref={rootRef}
      data-scroll-root="true"
      data-screen-label={station.label}
      className={`station${overlap ? ' station--overlap' : ''}`}
    >
      <div className="station__pin">
        {overlay}
        <div
          ref={stageRef}
          className={`stage ${station.dir > 0 ? 'stage--right' : 'stage--left'}`}
          aria-hidden="true"
        >
          <div ref={hostRef} className="stage__scene" />
          {!ready && <div className="stage__placeholder">{station.label}</div>}
        </div>
        <RoleCard ref={cardRef} station={station} />
      </div>
    </section>
  );
}
