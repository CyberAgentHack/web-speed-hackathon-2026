import * as esbuild from 'esbuild';
import * as fs from 'node:fs';
import * as path from 'node:path';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  outfile: 'dist/server.mjs',
  tsconfig: 'tsconfig.json',
  plugins: [{
    name: 'externalize-deps',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (args.path.startsWith('.') || args.path.startsWith('/')) return null;
        if (args.path.startsWith('node:')) return { path: args.path, external: true };
        if (args.path.startsWith('@web-speed-hackathon-2026/')) return null;
        return { path: args.path, external: true };
      });
    },
  }],
});

// Copy crok-response.md to dist/ so it's accessible at runtime
// (crok.ts uses import.meta.url-based __dirname which resolves to dist/ after bundling)
fs.copyFileSync(
  path.join('src', 'routes', 'api', 'crok-response.md'),
  path.join('dist', 'crok-response.md'),
);

console.log('Server build complete: dist/server.mjs');
