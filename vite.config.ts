import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import viteTsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { nitro } from 'nitro/vite';
import type { Plugin } from 'vite';

/**
 * Prevents the dev server from crashing on the Node.js v24+ undici
 * "Response body object should not be disturbed or locked" error.
 * This is a known race condition in the SSR streaming pipeline
 * (TanStack Start + Nitro + undici) that is non-critical in dev.
 */
function ssrStreamErrorGuard(): Plugin {
  return {
    name: 'ssr-stream-error-guard',
    apply: 'serve',
    configureServer() {
      const ignoredMessages = [
        'Response body object should not be disturbed or locked',
      ];

      process.on('uncaughtException', (err) => {
        if (ignoredMessages.some((msg) => err.message?.includes(msg))) {
          console.warn(
            '\x1b[33m[ssr] Suppressed non-critical stream error:\x1b[0m',
            err.message
          );
          return;
        }
        throw err;
      });
    },
  };
}

const config = defineConfig({
  plugins: [
    ssrStreamErrorGuard(),
    devtools(),
    nitro(),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  optimizeDeps: {
    include: ['lucide-react', '@tabler/icons-react'],
  },
  ssr: {
    noExternal: ['@tabler/icons-react'],
    optimizeDeps: {
      include: ['lucide-react', '@tabler/icons-react'],
    },
  },
  build: {
    rollupOptions: {
      external: [
        // Externalize Node.js built-ins to prevent them from being bundled
        'node:stream',
        'node:stream/web',
        'node:async_hooks',
        'node:buffer',
      ],
    },
  },
});

export default config;
