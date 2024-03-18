import resolve from 'rollup-plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
export default {
  input: './src/app.js',  // Reemplaza con la ruta de tu archivo principal
  output: {
    file: 'dist/bundle.js',
    format: 'cjs'  // Puedes ajustar el formato según tus necesidades
  },
  plugins: [
    commonjs(),
  ]
};
