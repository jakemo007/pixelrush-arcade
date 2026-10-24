import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // Directory patterns (trailing slash) stop ESLint from even walking these folders.
  globalIgnores(['.next/', 'out/', 'build/', 'coverage/', 'smoke-output/', 'next-env.d.ts']),
]);
