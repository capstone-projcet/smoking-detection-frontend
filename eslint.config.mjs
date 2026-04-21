import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    rules: {
      'no-unused-vars': 'warn', // 안 쓰는 변수 경고
      'no-console': 'warn', // console.log 경고
      'prefer-const': 'error', // let 대신 const 강제
    },
  },
])

export default eslintConfig
