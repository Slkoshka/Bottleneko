import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const bottlenekoServer = process.env['services__bottleneko-server__http__0'];

    return {
        plugins: [sveltekit(), devtoolsJson()],
        css: {
            preprocessorOptions: {
                scss: {
                    silenceDeprecations: ['import', 'color-functions', 'global-builtin', 'if-function', 'slash-div'],
                },
            },
        },
        server: {
            proxy: {
                '^/api': {
                    target: bottlenekoServer,
                    secure: false,
                    changeOrigin: true,
                },
                '^/ws': {
                    target: bottlenekoServer,
                    secure: false,
                    changeOrigin: true,
                    ws: true,
                },
            },
            port: parseInt(env.VITE_PORT),
        },
    };
});
