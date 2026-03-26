import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.ts',

  output: {
    file: 'public/bundle.js',
    format: 'es',
    sourcemap: true,
  },

  plugins: [
    // Resolve node_modules for browser
    nodeResolve({ browser: true, preferBuiltins: false }),

    // Convert CJS packages to ESM
    commonjs(),

    // TypeScript → JS (bundler handles module resolution)
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,     // no .d.ts in the browser bundle
      declarationMap: false,
      sourceMap: true,
      inlineSources: true,
    }),

    // Minify output
    terser({ format: { comments: false } }),
  ],

  // Node.js built-ins are external — they come from @obix-sdk-cli re-exports
  // and are never called in the browser bundle; mark them to suppress warnings.
  external: [/^node:/],
};
