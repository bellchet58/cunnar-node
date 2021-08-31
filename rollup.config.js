import resolve from 'rollup-plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json'
import pkg from './package.json';

export default {
  input: 'src/index.ts', // 打包入口
  output: [{ // 打包出口
    file: pkg.main,
    format: 'cjs', 
    exports: 'named',
    sourcemap: true,
  }, {
    file: pkg.module,
    format: 'es',
    exports: 'named',
    sourcemap: true
  }],
  plugins: [ // 打包插件
    typescript({
      // 配置参考 https://hyeomans.com/migrate-node-package-typescript-rollup/
      // rollupCommonJSResolveHack: true,
      // clean: true
    }),// 解析TypeScript
    resolve({
      preferBuiltins: false
    }), // 查找和打包node_modules中的第三方模块
    commonjs({
      include: ['node_modules/**'],
    }), // 将 CommonJS 转换成 ES2015 模块供 Rollup 处理
    json(),
  ]
};