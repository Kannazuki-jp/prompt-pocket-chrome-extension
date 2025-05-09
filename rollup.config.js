import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

export default {
  input: {
    sidepanel: 'src/sidepanel/sidepanel.js',
    content: 'src/content-scripts/content.js'
  },
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    resolve(),
    commonjs(),
    terser(),
    copy({
      targets: [
        { src: 'src/sidepanel/*.html', dest: 'dist' },
        { src: 'src/sidepanel/*.css', dest: 'dist' },
        { src: 'src/content-scripts/*.js', dest: 'dist' },
        { src: 'manifest.json', dest: 'dist' }
      ],
      copyOnce: true
    })
  ]
};
