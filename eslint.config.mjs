import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import eslint from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'

const eslintConfig = defineConfig([
  eslint.configs.recommended,
  ...nextVitals,
  ...nextTs,
  stylistic.configs.customize({
    commaDangle: 'never',
    indent: 2,
    jsx: true,
    quotes: 'single',
    semi: false
  }),
  {
    rules: {
      '@stylistic/arrow-parens': ['warn', 'as-needed'],
      '@stylistic/brace-style': 'off',
      '@stylistic/jsx-one-expression-per-line': 'off'
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'components/ui/**',
    'hooks/**',
    'next-env.d.ts'
  ])
])

export default eslintConfig
