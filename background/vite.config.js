import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/main.js'), // ? Path to content.js
      name: 'Background',
      formats: ['iife'], 
      fileName: () => 'background.js' // ? Output file name
    }
  }
});