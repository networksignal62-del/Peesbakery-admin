import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // React Compiler is not enabled. Surface effect and declaration diagnostics
  // as warnings until these views are refactored for the compiler.
  { rules: {
    'react-hooks/immutability': 'warn',
    'react-hooks/set-state-in-effect': 'warn',
  } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "*.js",
  ]),
]);

export default eslintConfig;
