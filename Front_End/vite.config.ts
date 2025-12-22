import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // loadEnv 会加载 .env, .env.local, .env.[mode], .env.[mode].local
    // 第三个参数 '' 表示加载所有变量（不限制前缀）
    const env = loadEnv(mode, process.cwd(), '');
    
    // 获取 API Key，支持多种变量名，优先级：APAKEY > QIANWEN_API_KEY > VITE_QIANWEN_API_KEY
    const apiKey = env.APAKEY || env.QIANWEN_API_KEY || env.VITE_QIANWEN_API_KEY;
    const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
    
    console.log('🔑 Loading API Key from env:', {
        hasAPAKEY: !!env.APAKEY,
        hasQIANWEN_API_KEY: !!env.QIANWEN_API_KEY,
        hasVITE_QIANWEN_API_KEY: !!env.VITE_QIANWEN_API_KEY,
        finalApiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET'
    });
    
    return {
      server: {
        port: 3000,
        host: 'localhost',
        proxy: {
          '/qianwen': {
            target: 'https://dashscope.aliyuncs.com',
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/qianwen/, '')
          },
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            rewrite: (p) => {
              // 处理重复的/api前缀问题
              return p.replace(/^\/api\/api/, '/api');
            }
          }
        },
        // 禁用可能导致日志的功能
        hmr: {
          overlay: false // 禁用HMR错误覆盖层
        },
        debug: false // 禁用调试日志
      },
      preview: {
        port: 4173,
        host: 'localhost',
        proxy: {
          '/qianwen': {
            target: 'https://dashscope.aliyuncs.com',
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/qianwen/, '')
          },
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            rewrite: (p) => {
              // 处理重复的/api前缀问题
              return p.replace(/^\/api\/api/, '/api');
            }
          }
        },
      },
      plugins: [react()],
      define: {
        // 为了兼容，同时定义 process.env 和 import.meta.env
        // 支持多种变量名：APAKEY, QIANWEN_API_KEY, VITE_QIANWEN_API_KEY
        'process.env.QIANWEN_API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
        'process.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
        // 关键：将环境变量暴露到 import.meta.env（Vite 需要这样定义）
        'import.meta.env.APAKEY': JSON.stringify(env.APAKEY || ''),
        'import.meta.env.QIANWEN_API_KEY': JSON.stringify(apiKey || ''),
        'import.meta.env.VITE_QIANWEN_API_KEY': JSON.stringify(env.VITE_QIANWEN_API_KEY || ''),
        'import.meta.env.QIANWEN_API_URL': JSON.stringify(env.QIANWEN_API_URL || env.VITE_QIANWEN_API_URL || ''),
        'import.meta.env.VITE_QIANWEN_API_URL': JSON.stringify(env.VITE_QIANWEN_API_URL || ''),
        'import.meta.env.GEMINI_API_KEY': JSON.stringify(geminiKey || ''),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
        'import.meta.env.GEMINI_API_URL': JSON.stringify(env.GEMINI_API_URL || env.VITE_GEMINI_API_URL || ''),
        'import.meta.env.VITE_GEMINI_API_URL': JSON.stringify(env.VITE_GEMINI_API_URL || ''),
        'import.meta.env.GEMINI_MODEL': JSON.stringify(env.GEMINI_MODEL || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
      // 禁用Vite的一些可能导致日志的功能
      build: {
        minify: 'esbuild', // 使用 esbuild 替代 terser，无需额外安装
        sourcemap: false // 禁用sourcemap，减少日志输出
      },
      logLevel: 'info' // 显示必要的日志信息，包括错误
    };
});
