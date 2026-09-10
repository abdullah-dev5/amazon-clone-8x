import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local, gitignored scratch/cache directories (npm cache and temp
    // redirected off a full C: drive during setup — see .gitignore) and
    // generated test artifacts. Without these, a bare `eslint` (no path
    // argument, as `npm run lint` invokes it) lints whatever happens to be
    // sitting in these directories too, which isn't part of the
    // application and isn't reproducible between machines or CI.
    ".npm-cache/**",
    ".npm-tmp/**",
    "test-results/**",
    "playwright-report/**",
    // Tooling, not application code — the .agent-logs/ capture system's
    // own script. Excluded from the app's lint rules, not edited.
    ".claude/**",
  ]),
]);

export default eslintConfig;
