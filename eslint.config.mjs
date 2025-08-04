import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { 
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true } // 启用 JSX 支持
      }
    },
    rules:{
      "semi": ["error", "always"], // 强制分号
      "indent": ["error", 2] // 2 空格缩进
    }
  },
  {
    // React 专用配置
    files: ["**/*.{jsx,tsx}"],
    ...pluginReact.configs.recommended,
    settings: {
      react: {
        version: "detect" // 自动检测版本（或手动指定如 "18.2"）
      }
    }
  }
]);