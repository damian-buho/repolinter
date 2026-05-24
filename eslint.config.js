import js from '@eslint/js'
import nPlugin from 'eslint-plugin-n'
import { flatConfigs } from 'eslint-plugin-import-x'
import promisePlugin from 'eslint-plugin-promise'
import unicornPlugin from 'eslint-plugin-unicorn'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'

export default [
  {
    ignores: [
      '.nyc_output/',
      'coverage/',
      'node_modules/',
      'tmp/',
      'out/',
      'apidoc/',
      'dist/'
    ]
  },
  js.configs.recommended,
  nPlugin.configs['flat/recommended-module'],
  flatConfigs.recommended,
  promisePlugin.configs['flat/recommended'],
  unicornPlugin.configs['flat/recommended'],
  prettierRecommended,
  {
    files: ['**/*.js'],
    ignores: ['eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'n/no-unpublished-import': 'off',
      'n/no-unsupported-features/node-builtins': [
        'error',
        {
          allowExperimental: true
        }
      ],
      'import-x/no-unresolved': 'off'
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.mocha
      }
    },
    rules: {
      'n/no-unpublished-import': 'off',
      'n/no-missing-import': 'off',
      'import-x/no-named-as-default-member': 'off'
    }
  }
]
