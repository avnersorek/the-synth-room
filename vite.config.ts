import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'images',
          dest: ''
        },
        {
          src: 'sounds',
          dest: ''
        },
        {
          src: 'favicon',
          dest: ''
        }
      ]
    })
  ]
});
