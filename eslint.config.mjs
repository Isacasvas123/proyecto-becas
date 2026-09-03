// Configuración de ESLint (formato "flat config", ESLint 9) para todo el monorepo.
//
// Además de las reglas habituales, aquí se automatiza la regla de arquitectura que
// docs/05-arquitectura.md §2.3 declara como motivo de rechazo de un Pull Request:
// ningún archivo dentro de `domain/` puede importar NestJS, Prisma ni nada de HTTP.
// Que la revise el linter y no solo el ojo humano es lo que la convierte en garantía.

import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/build/**',
      '**/generated/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },

  // --- Frontend: navegador, no Node ---
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  // --- REGLA DE ARQUITECTURA: pureza de la capa de dominio ---
  // El dominio es TypeScript puro. No conoce el framework, ni el ORM, ni HTTP,
  // ni las capas que están por encima de él. Si esto falla, el diseño se rompió.
  {
    files: ['apps/api/src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@nestjs',
                '@nestjs/*',
                '@prisma/client',
                'prisma',
                'express',
                'http',
                'node:http',
              ],
              message:
                'La capa domain/ debe ser TypeScript puro: no puede importar NestJS, Prisma ni HTTP (docs/05-arquitectura.md §2.3).',
            },
            {
              group: ['**/application/**', '**/infrastructure/**', '**/presentation/**'],
              message:
                'Regla de dependencia: domain/ no importa de las capas superiores (docs/05-arquitectura.md §2.2).',
            },
          ],
        },
      ],
    },
  },

  // --- REGLA DE ARQUITECTURA: la capa de aplicación no conoce la infraestructura ---
  // El servicio de aplicación depende del PUERTO declarado en domain/, jamás del
  // repositorio Prisma concreto. Esa es la inversión de dependencias (SOLID · D).
  {
    files: ['apps/api/src/modules/*/application/**/*.ts'],
    // Las pruebas sí pueden nombrar un adaptador concreto: precisamente inyectan el
    // repositorio en memoria para demostrar que el puerto es intercambiable.
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@prisma/client', '**/infrastructure/**'],
              message:
                'La capa application/ depende de los puertos de domain/, nunca de adaptadores concretos de infrastructure/.',
            },
          ],
        },
      ],
    },
  },

  // Las pruebas pueden ser algo más laxas que el código de producción.
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
    languageOptions: { globals: { ...globals.jest } },
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },

  // Debe ir al final: desactiva las reglas de estilo que chocan con Prettier.
  prettier,
);
