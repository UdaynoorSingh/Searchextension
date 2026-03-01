import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/main.js'), // ? Path to content.js
      name: 'Content',
      formats: ['iife'], 
      fileName: () => 'content.js' // ? Output file name
    }
  }
});