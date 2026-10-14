import React, { forwardRef } from 'react';

// dir +1 = scene on the right, card on the left; -1 mirrors it.
export const RoleCard = forwardRef(function RoleCard({ station }, ref) {
  return (
    <article
      ref={ref}
      className={`card ${station.dir > 0 ? 'card--left' : 'card--right'}`}
      style={{ width: station.cardWidth }}
    >
      <div className="eyebrow">
        <span className="eyebrow__dot" aria-hidden="true" />
        {station.eyebrow}
      </div>
      <h2 className="card__title">{station.title}</h2>
      <div className="card__subtitle">{station.subtitle}</div>
      <div className="card__dates">{station.dates}</div>
      <ul className="card__list">
        {station.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <div className="card__tags">
        {station.tags.map((t) => (
          <span className="tag" key={t}>
            {t}
          </span>
        ))}
      </div>
    </article>
  );
});
