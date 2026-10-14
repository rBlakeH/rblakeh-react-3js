import React, { forwardRef } from 'react';
import { finale } from '../data/stations.js';

const { board } = finale;

function Cells({ row, index }) {
  // Direct grid children — the row's grid is 3 columns, so no wrapper element.
  return (
    <>
      <span className="board__cell" data-flap="" data-row={index} aria-hidden="true">
        {row.line}
      </span>
      <span className="board__cell" data-flap="" data-row={index} aria-hidden="true">
        {row.address}
      </span>
      <span
        className="board__cell"
        data-flap=""
        data-row={index}
        aria-hidden="true"
        style={{ color: row.platformColor }}
      >
        {row.platform}
      </span>
    </>
  );
}

/**
 * The split-flap station directory. Rows render their real text; the flap
 * animation (step 4) rewrites the [data-flap] spans in place.
 *
 * Flapping text is scrambled mid-animation, so the cells are hidden from
 * assistive tech and the real value is carried by aria-label (links) or a
 * visually-hidden span (the static row).
 */
export const StationDirectory = forwardRef(function StationDirectory(_props, ref) {
  return (
    <div className="board" ref={ref}>
      <div className="board__head">
        <span>{board.title}</span>
        <span>{board.region}</span>
      </div>
      <div className="board__grid board__labels">
        <span>{board.headers.line}</span>
        <span>{board.headers.address}</span>
        <span>{board.headers.platform}</span>
      </div>
      {board.rows.map((row, i) =>
        row.href ? (
          <a
            key={row.line}
            className="board__grid board__row"
            href={row.href}
            aria-label={`${row.line}: ${row.address}`}
            {...(row.external ? { target: '_blank', rel: 'noopener' } : null)}
          >
            <Cells row={row} index={i} />
          </a>
        ) : (
          <div key={row.line} className="board__grid board__row">
            <span className="sr-only">{`${row.line}: ${row.address}`}</span>
            <Cells row={row} index={i} />
          </div>
        )
      )}
    </div>
  );
});
