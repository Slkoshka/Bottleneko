import { type Config } from 'prettier';

const config: Config = {
    useTabs: false,
    tabWidth: 4,
    singleQuote: true,
    semi: true,
    trailingComma: 'all',
    printWidth: 120,
    plugins: ['prettier-plugin-svelte'],
    overrides: [
        {
            files: '*.svelte',
            options: {
                parser: 'svelte',
            },
        },
    ],
};

export default config;
