const js = require('@eslint/js')
const nPlugin = require('eslint-plugin-n').default
const importPlugin = require('eslint-plugin-import-x')
const promisePlugin = require('eslint-plugin-promise')
const prettierRecommended = require('eslint-plugin-prettier/recommended')
const globals = require('globals')

module.exports = [
  {
    ignores: [
      '.nyc_output/',
      'coverage/',
      'node_modules/',
      'tmp/',
      'out/',
      'apidoc/'
    ]
  },
  js.configs.recommended,
  nPlugin.configs['flat/recommended-script'],
  importPlugin.flatConfigs.recommended,
  promisePlugin.configs['flat/recommended'],
  prettierRecommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'n/no-unpublished-require': 'off',
      'import-x/no-unresolved': ['error', { commonjs: true }]
    }
  },
  {
    files: ['tests/**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.mocha
      }
    },
    rules: {
      'n/no-unpublished-import': 'off'
    }
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module'
    }
  }
]
