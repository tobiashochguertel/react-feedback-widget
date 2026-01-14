import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import terser from '@rollup/plugin-terser';

/**
 * Suppress warnings for circular dependencies in node_modules.
 * These are common in third-party packages and typically harmless.
 */
const onwarn = (warning, warn) => {
  // Suppress circular dependency warnings from node_modules
  if (
    warning.code === 'CIRCULAR_DEPENDENCY' &&
    warning.ids?.some((id) => id.includes('node_modules'))
  ) {
    return;
  }
  warn(warning);
};

/**
 * Shared TypeScript plugin configuration for client bundles.
 * Includes React JSX transform and generates declaration files.
 */
const createTypescriptPlugin = (options = {}) =>
  typescript({
    tsconfig: './tsconfig.json',
    declaration: true,
    declarationDir: './dist/types',
    ...options,
  });

/**
 * Shared TypeScript plugin for server bundles.
 * No declaration files needed for individual server modules.
 */
const createServerTypescriptPlugin = (options = {}) =>
  typescript({
    tsconfig: './tsconfig.json',
    declaration: false,
    declarationDir: undefined,
    ...options,
  });

/**
 * Common plugins for client-side bundles.
 * Includes peer deps externalization, resolution, CommonJS, TypeScript, and minification.
 */
const clientPlugins = [
  peerDepsExternal(),
  resolve({
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  }),
  commonjs(),
  createTypescriptPlugin(),
  terser(),
];

/**
 * Common plugins for server-side bundles.
 * No peer deps externalization or minification needed.
 */
const serverPlugins = [
  resolve({
    extensions: ['.ts', '.js'],
  }),
  commonjs(),
  createServerTypescriptPlugin(),
];

/**
 * Rollup configuration for react-visual-feedback library.
 *
 * Produces multiple bundles:
 * 1. Main client bundle (CJS + ESM)
 * 2. Server integrations bundle
 * 3. Individual integration handlers (Jira, Sheets)
 * 4. Client-side integrations bundle
 * 5. Shared config module
 */
export default [
  // ==========================================================================
  // Main Client Bundle
  // ==========================================================================
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.js',
        format: 'cjs',
        sourcemap: true,
        inlineDynamicImports: true,
        exports: 'named',
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
        inlineDynamicImports: true,
      },
    ],
    onwarn,
    plugins: clientPlugins,
    external: ['react', 'react-dom', 'styled-components'],
  },

  // ==========================================================================
  // Server Integrations Bundle
  // ==========================================================================
  {
    input: 'src/integrations/server/index.ts',
    output: {
      file: 'dist/server/index.js',
      format: 'esm',
      sourcemap: true,
    },
    onwarn,
    plugins: serverPlugins,
    external: ['crypto'],
  },

  // ==========================================================================
  // Jira Server Handler
  // ==========================================================================
  {
    input: 'src/integrations/jira.ts',
    output: {
      file: 'dist/server/jira.js',
      format: 'esm',
      sourcemap: true,
    },
    onwarn,
    plugins: serverPlugins,
    external: ['crypto'],
  },

  // ==========================================================================
  // Sheets Server Handler
  // ==========================================================================
  {
    input: 'src/integrations/sheets.ts',
    output: {
      file: 'dist/server/sheets.js',
      format: 'esm',
      sourcemap: true,
    },
    onwarn,
    plugins: serverPlugins,
    external: ['crypto'],
  },

  // ==========================================================================
  // Client-side Integrations
  // ==========================================================================
  {
    input: 'src/integrations/index.ts',
    output: {
      file: 'dist/integrations/index.js',
      format: 'esm',
      sourcemap: true,
    },
    onwarn,
    plugins: [
      peerDepsExternal(),
      resolve({
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      }),
      commonjs(),
      createServerTypescriptPlugin(),
      terser(),
    ],
    external: ['react', 'react-dom', 'styled-components'],
  },

  // ==========================================================================
  // Shared Config Module
  // ==========================================================================
  {
    input: 'src/integrations/config.ts',
    output: {
      file: 'dist/integrations/config.js',
      format: 'esm',
      sourcemap: true,
    },
    onwarn,
    plugins: serverPlugins,
  },
];
