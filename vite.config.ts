import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[tj]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    exclude: [],
    esbuildOptions: {
      loader: {
        '.ts': 'tsx',
      },
    },
  },
});
