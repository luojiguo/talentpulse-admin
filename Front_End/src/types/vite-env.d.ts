/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly APAKEY: string; // 支持 APAKEY 变量名
  readonly QIANWEN_API_KEY: string;
  readonly VITE_QIANWEN_API_KEY: string;
  readonly QIANWEN_API_URL: string;
  readonly VITE_QIANWEN_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}