import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_PATH = path.resolve(__dirname, './src');
const DIST_PATH = path.resolve(__dirname, '../dist');
const ENABLE_BUNDLE_ANALYZER = process.env.ANALYZE === 'true';

export default defineConfig(async () => {
  const plugins = [react()];

  if (ENABLE_BUNDLE_ANALYZER) {
    try {
      const { visualizer } = await import('rollup-plugin-visualizer');
      plugins.push(
        visualizer({
          filename: path.resolve(DIST_PATH, 'bundle-report.html'),
          gzipSize: true,
          template: 'treemap',
          open: false,
        }),
      );
    } catch {
      throw new Error(
        'rollup-plugin-visualizer is required when ANALYZE=true. Install it with: pnpm add -D rollup-plugin-visualizer',
      );
    }
  }

  return {
    plugins,
    root: SRC_PATH,
    publicDir: path.resolve(__dirname, '../public'),
    build: {
      emptyOutDir: true,
      outDir: DIST_PATH,
      rollupOptions: {
        input: path.resolve(SRC_PATH, './index.html'),
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'styles/main.css';
            }

            return 'assets/[name]-[hash][extname]';
          },
          chunkFileNames: 'scripts/chunk-[hash].js',
          entryFileNames: 'scripts/main.js',
        },
      },
    },
    define: {
      'process.env.BUILD_DATE': JSON.stringify(new Date().toISOString()),
      'process.env.COMMIT_HASH': JSON.stringify(
        process.env.SOURCE_VERSION || '',
      ),
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development',
      ),
    },
    server: {
      host: '0.0.0.0',
      port: 8080,
      proxy: {
        '/api': 'http://localhost:3000',
        '/images': 'http://localhost:3000',
        '/movies': 'http://localhost:3000',
        '/sounds': 'http://localhost:3000',
        '/fonts': 'http://localhost:3000',
        '/sprites': 'http://localhost:3000',
        '/dicts': 'http://localhost:3000',
        '/robots.txt': 'http://localhost:3000',
      },
    },
  };
});
