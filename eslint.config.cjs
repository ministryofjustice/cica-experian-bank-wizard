'use strict';

const prettier = require('eslint-plugin-prettier');
const fp = require('eslint-plugin-fp');
const importPlugin = require('eslint-plugin-import-x');
const globals = require('globals');
const js = require('@eslint/js');
const {FlatCompat} = require('@eslint/eslintrc');

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

module.exports = [
    {
        ignores: ['**/coverage', '**/stuff'],
    },
    js.configs.recommended,
    ...compat.extends('prettier', 'plugin:jest/recommended'),
    {
        plugins: {
            prettier,
            fp,
            import: importPlugin,
        },

        languageOptions: {
            globals: {
                ...globals.node,
            },

            ecmaVersion: 2021,
            sourceType: 'commonjs',

            parserOptions: {
                ecmaFeatures: {
                    modules: false,
                    classes: false,
                },
            },
        },

        rules: {
            'prettier/prettier': [
                'error',
                {endOfLine: process.platform === 'win32' ? 'crlf' : 'lf'},
            ],
            curly: ['error', 'all'],
            'jest/expect-expect': ['error'],
            strict: ['error', 'safe'],
            'import/extensions': ['off'],
            'import/no-extraneous-dependencies': ['off'],
            'fp/no-class': 'error',

            'no-param-reassign': [
                'error',
                {
                    props: false,
                },
            ],
        },
    },
    {
        files: ['**/*.test.js', '**/stubs/**', '**/local-integration/**', '**/openapi/**'],
        rules: {
            'no-console': 'off',
            'global-require': 'off',
            'no-await-in-loop': 'off',
        },
    },
];
