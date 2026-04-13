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
      'sort-keys': 'warn'
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'components/ui/**',
    'next-env.d.ts'
  ])
])

export default eslintConfig
