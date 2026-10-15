import React, { useRef } from 'react';
import { useSection } from '../scroll/useDriver.jsx';
import { applyStation } from '../scroll/timings.js';
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
 */
export function Station({ station, rootRef, overlap = true, overlay, onFrame }) {
  const stageRef = useRef(null);
  const cardRef = useRef(null);
  const hostRef = useRef(null);
  const { sceneRef, ready, update } = useScene(station.id, hostRef, { cardRef });

  useSection(
    rootRef,
    (frame) => {
      const opacity = applyStation(frame.progress, stageRef.current, cardRef.current, station.dir);
      // The manager builds this scene as it approaches and takes its context
      // back once it is far enough behind.
      update(frame.distance);
      // Draw only what can actually be seen. A section intersects the viewport
      // well before and after its stage fades, and drawing a transparent stage
      // costs exactly as much as drawing a visible one.
      if (opacity > 0.01) sceneRef.current?.frame(frame.progress, frame.now);
      onFrame?.(frame, stageRef.current);
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
