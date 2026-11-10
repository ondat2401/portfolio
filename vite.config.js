import { defineConfig } from 'vite';
import { cpSync } from 'node:fs';

export default defineConfig({
  plugins: [{
    name: 'copy-portfolio-media',
    closeBundle() {
      for (const dir of ['data', 'projects', 'assets/media']) {
        cpSync(dir, `dist/${dir}`, { recursive: true });
      }
      // Classic scripts keep globals used by the existing modal/playable controls.
      for (const file of ['assets/js/main.js', 'assets/js/tracker.js', 'admin.html', 'dashboard.html']) {
        cpSync(file, `dist/${file}`);
      }
    },
  }],
  build: {
    rollupOptions: {
      input: { portfolio: 'index.html', prototype: 'prototypes/comic/index.html' },
    },
  },
});
