import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

export default defineConfig([
    globalIgnores(["dist", "node_modules", ".husky"]),
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended", tseslint.configs.recommended],
        languageOptions: { globals: globals.browser },

        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_", // ignores _next, _req, etc.
                    varsIgnorePattern: "^_", // ignores _unusedVar
                },
            ],
        },
    },
])
