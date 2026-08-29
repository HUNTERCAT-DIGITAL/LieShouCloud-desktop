// ESLint 9 flat config
// 与 admin-web / open/ui 对齐（规则来源 .ai/CONVENTIONS.md）
// 跑法：pnpm lint / pnpm lint:fix
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  // 1. 忽略构建产物、依赖与外部代码
  {
    ignores: [
      'dist/**',
      '.vite/**',
      'node_modules/**',
      'open/**',
      'e2e/**',
      '**/playwright.config.ts',
      'playwright-report/**',
      'test-results/**',
      'src-tauri/**',
      'public/**',
      // 客户仓注入物（deploy:prepare 生成，tsconfig 同样排除）
      'src/config/editions/*.extra.ts',
    ],
  },

  // 2. 基础集 + TypeScript 推荐
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. React Hooks（React 19 官方规则；exhaustive-deps 为 warn）
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },

  // 4. 业务规则：与 §1-§6 对齐
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      // null: ignore —— 允许 `v != null`(null/undefined 双检查惯用法),
      // 其余 `==`/`!=` 仍报错。
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  // 5. 测试文件可以宽松
  {
    files: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-console': 'off',
    },
  },
);
