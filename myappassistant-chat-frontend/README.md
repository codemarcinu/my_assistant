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

## 🧪 Testowanie

### Unit Tests ✅
```bash
npm test
npm run test:run
npm run test:coverage
```

**Zaimplementowane testy:**
- **ChatBubble.test.tsx** - testy komponentu czatu (renderowanie wiadomości user/assistant, timestamp)
- **chatStore.test.tsx** - testy store czatu (addMessage, clearMessages, loading/error states)
- **App.test.tsx** - testy głównej aplikacji

### E2E Tests ✅
```bash
npm run test:e2e
npm run test:e2e:ui
npm run test:e2e:headed
```

**Zaimplementowane testy E2E:**
- **chat.spec.ts** - testy interfejsu czatu (wysyłanie wiadomości, nawigacja między stronami)
- Testy sprawdzają: wyświetlanie czatu, wysyłanie wiadomości, obsługa pustych wiadomości, nawigacja

### Test Coverage
```bash
npm run test:coverage
```

**Metryki:**
- **Unit Tests**: 11 testów ✅
- **E2E Tests**: 4 testy ✅
- **Coverage**: > 80% (do rozbudowy)

### Test Environment
- **Vitest** - unit testing framework
- **Playwright** - E2E testing framework
- **Testing Library** - React component testing
- **Jest DOM** - DOM testing utilities

---

## Środowisko
- React 18+
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- React Query
- Vitest + Testing Library
