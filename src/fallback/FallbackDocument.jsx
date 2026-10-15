import React from 'react';
import { finale, hero, stations } from '../data/stations.js';
import { RoleCard } from '../components/RoleCard.jsx';
import { StationDirectory } from '../components/StationDirectory.jsx';

/**
 * What the page is when the scroll choreography is off the table — either the
 * reader asked for reduced motion, or there is no WebGL to draw dioramas with.
 *
 * Same copy, same tokens, no pinning, no transforms, no 3D: the résumé as a
 * document you scroll normally. There is no scroll driver mounted in this
 * mode, so nothing here animates.
 */
export function FallbackDocument() {
  return (
    <main className="doc">
      <header className="doc__hero">
        <div className="hero__route">{hero.route}</div>
        <h1 className="hero__name">{hero.name}</h1>
        <div className="hero__role">{hero.role}</div>
      </header>

      <ol className="doc__stations">
        {stations.map((station) => (
          <li key={station.id}>
            <RoleCard station={station} isStatic />
          </li>
        ))}
      </ol>

      <section className="doc__finale">
        <div className="eyebrow">
          <span className="eyebrow__dot" aria-hidden="true" />
          {finale.eyebrow}
        </div>
        <h2 className="finale__heading">{finale.heading}</h2>
        <p className="finale__para">{finale.paragraph}</p>
        <div className="finale__credits">
          {finale.credits.map((c, i) => (
            <React.Fragment key={c}>
              {i > 0 && <span aria-hidden="true">·</span>}
              <span>{c}</span>
            </React.Fragment>
          ))}
        </div>
        <StationDirectory />
      </section>
    </main>
  );
}
