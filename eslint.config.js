import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";
// 1. 引入插件
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "unused-imports": unusedImports,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // 1. 允许使用 any (将报错改为警告，甚至关闭)
      "@typescript-eslint/no-explicit-any": "warn",

      // 2. 允许 ! 非空断言 (解决 optional chain 报错)
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      // 必须关闭 ESLint 原生的检查，否则会有重复报错且无法自动修复
      "@typescript-eslint/no-unused-vars": "off",

      // 开启自动移除引用 (设置为 error 以确保 --fix 生效)
      "unused-imports/no-unused-imports": "error",

      // 配置未使用变量的警告策略 (忽略以 _ 开头的变量)
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
);
