import prettier from "eslint-plugin-prettier";
import fp from "eslint-plugin-fp";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: ["**/coverage", "**/stuff"],
}, ...compat.extends("airbnb-base", "prettier", "plugin:jest/recommended"), {
    plugins: {
        prettier,
        fp,
    },

    languageOptions: {
        globals: {
            ...globals.node,
        },

        ecmaVersion: 2021,
        sourceType: "commonjs",

        parserOptions: {
            ecmaFeatures: {
                modules: false,
                classes: false,
            },
        },
    },

    rules: {
        "prettier/prettier": ["error"],
        "linebreak-style": ["error", "unix"],
        curly: ["error", "all"],
        "jest/expect-expect": ["error"],
        strict: ["error", "safe"],
        "import/extensions": ["off"],
        "fp/no-class": "error",

        "no-param-reassign": ["error", {
            props: false,
        }],
    },
}];