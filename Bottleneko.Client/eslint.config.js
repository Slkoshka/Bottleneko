import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tsESLint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import importPlugin from 'eslint-plugin-import';

export default tsESLint.config(
    {
        settings: {
            react: { version: '18.3' },
            'import/parsers': {
                '@typescript-eslint/parser': ['.ts', '.tsx'],
            },
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: ['./tsconfig.node.json', './tsconfig.app.json'],
                },
            },
        },
        extends: [
            js.configs.recommended,
            ...tsESLint.configs.strictTypeChecked,
            ...tsESLint.configs.stylisticTypeChecked,
            importPlugin.flatConfigs.recommended,
            importPlugin.flatConfigs.typescript,
            stylistic.configs.customize({
                indent: 4,
                quotes: 'single',
                semi: true,
            }),
        ],
        files: ['**/*.{ts,tsx}'],
        ignores: ['dist', 'src/features/scripts/api/**/*.d.ts'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                project: ['./tsconfig.node.json', './tsconfig.app.json'],
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            '@stylistic': stylistic,
        },
        rules: {
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            'import/order': 'error', 
            'import/extensions': ['error', 'never'],
        },
    },
)
