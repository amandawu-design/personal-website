// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://amanda-wu.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
