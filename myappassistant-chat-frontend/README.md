# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

# MyAppAssistant Chat Frontend

## Testowanie

Projekt wykorzystuje [Vitest](https://vitest.dev/) oraz [Testing Library](https://testing-library.com/docs/react-testing-library/intro/) do testów jednostkowych i integracyjnych.

### Skrypty testowe

- `npm run test` – uruchamia testy w trybie watch
- `npm run test:run` – uruchamia testy jednorazowo (CI)
- `npm run test:coverage` – generuje raport pokrycia kodu
- `npm run test:ui` – uruchamia interfejs graficzny Vitest

### Konfiguracja

- Plik konfiguracyjny: `vitest.config.ts`
- Plik setup: `src/test/setup.ts` (mocki dla JSDOM, suppress warnings, globalne setupy)
- Utils: `src/test/utils.tsx` (custom render, fabryki danych, mocki API)
- Przykładowy test: `src/test/__tests__/App.test.tsx`

### Przykład uruchomienia

```sh
npm install
npm run test:run
npm run test:coverage
```

### Pokrycie kodu

Raport pokrycia generowany jest w katalogu `coverage/` po uruchomieniu `npm run test:coverage`.

### Dobre praktyki

- Nowe komponenty powinny mieć testy jednostkowe w katalogu `src/test/__tests__`.
- Do testów używaj customowego rendera z `src/test/utils.tsx` (zapewnia React Query Provider).
- Mockuj API i dane przez fabryki z utils.

---

## Środowisko
- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Query
- Vitest + Testing Library
