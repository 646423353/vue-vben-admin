import { defineConfig } from '@vben/vite-config';

import ElementPlus from 'unplugin-element-plus/vite';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      resolve: {
        alias: {
          '@nuxt/kit': new URL('src/mocks/nuxt-kit.ts', import.meta.url)
            .pathname,
        },
      },
      plugins: [
        ElementPlus({
          format: 'esm',
        }),
      ],
      build: {
        target: 'es2015',
      },
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // mock代理目标地址
            // target: 'http://39.99.217.49:8082',
            target: 'http://124.222.12.38:8082',
            ws: true,
          },
          '/wxapi': {
            changeOrigin: true,
            target: 'https://yiqibao178.cn',
          },
        },
      },
    },
  };
});
