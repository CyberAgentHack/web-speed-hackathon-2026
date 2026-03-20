import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: './src',
  plugins: [
    react(),
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
        manualChunks: (id) => {
          const normalizedId = id.replaceAll('\\', '/');

          if (
            normalizedId.includes('/src/containers/CrokContainer.tsx') ||
            normalizedId.includes('/src/components/crok/') ||
            normalizedId.includes('/src/hooks/use_sse.ts') ||
            normalizedId.includes('/node_modules/react-markdown/') ||
            normalizedId.includes('/node_modules/remark-gfm/') ||
            normalizedId.includes('/node_modules/remark-math/') ||
            normalizedId.includes('/node_modules/rehype-katex/') ||
            normalizedId.includes('/node_modules/katex/')
          ) {
            return 'page-crok';
          }

          if (
            normalizedId.includes('/src/containers/SearchContainer.tsx') ||
            normalizedId.includes('/src/components/application/SearchPage.tsx') ||
            normalizedId.includes('/src/search/') ||
            normalizedId.includes('/src/utils/bm25_search.ts') ||
            normalizedId.includes('/src/utils/negaposi_analyzer.ts') ||
            normalizedId.includes('/src/utils/kuromoji.ts') ||
            normalizedId.includes('/node_modules/bayesian-bm25/') ||
            normalizedId.includes('/node_modules/kuromoji/') ||
            normalizedId.includes('/node_modules/negaposi-analyzer-ja/')
          ) {
            return 'page-search';
          }

          if (
            normalizedId.includes('/src/containers/DirectMessageContainer.tsx') ||
            normalizedId.includes('/src/containers/DirectMessageListContainer.tsx') ||
            normalizedId.includes('/src/containers/NewDirectMessageModalContainer.tsx') ||
            normalizedId.includes('/src/components/direct_message/') ||
            normalizedId.includes('/src/direct_message/') ||
            normalizedId.includes('/src/hooks/use_ws.ts')
          ) {
            return 'page-dm';
          }

          if (
            normalizedId.includes('/src/containers/TimelineContainer.tsx') ||
            normalizedId.includes('/src/containers/PostContainer.tsx') ||
            normalizedId.includes('/src/containers/UserProfileContainer.tsx') ||
            normalizedId.includes('/src/components/timeline/') ||
            normalizedId.includes('/src/components/post/') ||
            normalizedId.includes('/src/components/user_profile/')
          ) {
            return 'page-feed';
          }

          if (
            normalizedId.includes('/src/containers/TermContainer.tsx') ||
            normalizedId.includes('/src/components/term/')
          ) {
            return 'page-terms';
          }

          if (
            normalizedId.includes('/src/containers/AuthModalContainer.tsx') ||
            normalizedId.includes('/src/components/auth_modal/') ||
            normalizedId.includes('/src/auth/')
          ) {
            return 'modal-auth';
          }

          if (
            normalizedId.includes('/src/containers/NewPostModalContainer.tsx') ||
            normalizedId.includes('/src/components/new_post_modal/') ||
            normalizedId.includes('/src/utils/convert_image.ts') ||
            normalizedId.includes('/src/utils/convert_movie.ts') ||
            normalizedId.includes('/src/utils/convert_sound.ts') ||
            normalizedId.includes('/src/utils/extract_metadata_from_sound.ts') ||
            normalizedId.includes('/src/utils/load_ffmpeg.ts') ||
            normalizedId.includes('/node_modules/@ffmpeg/ffmpeg/') ||
            normalizedId.includes('/node_modules/@imagemagick/magick-wasm/') ||
            normalizedId.includes('/node_modules/encoding-japanese/') ||
            normalizedId.includes('/node_modules/gifler/') ||
            normalizedId.includes('/node_modules/omggif/') ||
            normalizedId.includes('/node_modules/piexifjs/')
          ) {
            return 'modal-post';
          }

          return undefined;
        },
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
