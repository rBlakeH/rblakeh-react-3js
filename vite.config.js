import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * /resume is static HTML generated from src/data/stations.js at build time, so
 * a crawler or an ATS parser gets the text out of the file rather than having
 * to run the bundle. Served from memory in dev so the two never drift.
 *
 * It is emitted as resume/index.html rather than resume.html because GitHub
 * Pages has no rewrite rules: a directory index is the only way /resume works
 * as a URL there. Every other host serves it the same way, so this costs
 * nothing and keeps the site portable.
 */
function resumePage() {
  const load = async () => {
    const mod = await import('./src/resume/renderResume.js');
    return mod.renderResume();
  };
  return {
    name: 'resume-page',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '').split('?')[0].replace(/\/+$/, '');
        if (path !== '/resume') return next();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(await load());
      });
    },
    async generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'resume/index.html', source: await load() });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  // Relative asset URLs, so the same build works at a domain root
  // (rblakeh.com) and under a project subpath
  // (rblakeh.github.io/rblakeh-react-3js/) without being rebuilt.
  base: './',
  plugins: [react(), resumePage()],
  build: {
    rollupOptions: {
      output: {
        // three.js is shared by all six scene chunks; without this it lands in
        // whichever shared module Rollup happens to name the chunk after.
        manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined),
      },
    },
  },
});
