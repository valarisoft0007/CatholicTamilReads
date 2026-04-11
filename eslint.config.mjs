import coreWebVitalsConfig from 'eslint-config-next/core-web-vitals';

const config = [
  ...coreWebVitalsConfig,
  {
    ignores: ['coverage/**'],
  },
  {
    rules: {
      // Standard SSR hydration pattern (setMounted) and data-loading effects are intentional
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default config;
