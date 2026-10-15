import React, { forwardRef } from 'react';
import { hero } from '../data/stations.js';

export const Hero = forwardRef(function Hero(_props, ref) {
  return (
    <div className="hero" ref={ref}>
      <div className="hero__route">{hero.route}</div>
      <h1 className="hero__name">{hero.name}</h1>
      <div className="hero__role">{hero.role}</div>
      <div className="hero__prompt">
        <div className="hero__arrow" aria-hidden="true">
          ↓
        </div>
        <div className="hero__prompt-lines">
          <div className="hero__prompt-main">{hero.prompt}</div>
          <div className="hero__prompt-sub">{hero.promptSub}</div>
        </div>
      </div>
    </div>
  );
});
