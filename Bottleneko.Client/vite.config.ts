import { URL, fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import plugin from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const bottlenekoServer = process.env['services__bottleneko-server__http__0'];

    return {
        plugins: [plugin()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
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
        build: {
            chunkSizeWarningLimit: 10 * 1024 * 1024,
            outDir: 'dist',
            rollupOptions: {
                input: 'index.html',
            },
        },
    };
});
