import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { unstableRolldownAdapter, analyzer } from 'vite-bundle-analyzer';
import path from 'path';

const SRC_PATH = path.resolve(__dirname, './src');

export default defineConfig({
  root: './src',
  plugins: [
    react(),
    unstableRolldownAdapter(analyzer()),
  ],
  resolve: {
    alias: {
      'bayesian-bm25': path.resolve(__dirname, 'node_modules', 'bayesian-bm25/dist/index.js'),
      'kuromoji': path.resolve(__dirname, 'node_modules', 'kuromoji/build/kuromoji.js'),
      '@ffmpeg/ffmpeg': path.resolve(
        __dirname,
        'node_modules',
        '@ffmpeg/ffmpeg/dist/esm/index.js',
      ),
    },
    extensions: ['.tsx', '.ts', '.mjs', '.cjs', '.jsx', '.js'],
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'scripts/[name].js',
        chunkFileNames: 'scripts/chunk-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'styles/[name].css';
          }
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'assets/[name].[ext]';
          }
          return 'assets/[name].[ext]';
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  define: {
    'import.meta.env.VITE_BUILD_DATE': JSON.stringify(new Date().toISOString()),
    'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(process.env.SOURCE_VERSION || ''),
    'import.meta.env.VITE_NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
