import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'Github',
      formats: ['es'],
      fileName: (format) => `app.js`,
    },
    rollupOptions: {
      // https://rollupjs.org/guide/en/#big-list-of-options
      plugins: [
        replace({ // Fixes build error with Redux.
          'process.env.NODE_ENV': `'production'`,
          'preventAssignment': true,
        }),
      ],
    },
  },
  plugins: [
    react({
      jsxRuntime: 'classic',
    }),
    cssInjectedByJsPlugin(),
    viteStaticCopy({
      targets: [
        {
          src: 'assets',
          dest: '.'
        }
      ]
    }),
  ]
});
