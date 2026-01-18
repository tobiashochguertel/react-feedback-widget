import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node18',
  dts: true,
  clean: true,
  shims: true,
  sourcemap: true,
  splitting: false,
  external: ['keytar'],
});
