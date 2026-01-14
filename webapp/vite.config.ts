import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { execSync } from 'child_process';

function getGitCommitHash(): string {
  try {
    return execSync('git rev-parse HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

function getGitCommitMessage(): string {
  try {
    return execSync('git log -1 --pretty=%B').toString().trim();
  } catch {
    return 'unknown';
  }
}

export default defineConfig({
  server: {
    allowedHosts: [
      'twiglike-overlogically-isobel.ngrok-free.app'
    ]
  },
  define: {
    __COMMIT_HASH__: JSON.stringify(getGitCommitHash()),
    __COMMIT_MESSAGE__: JSON.stringify(getGitCommitMessage()),
  },
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
