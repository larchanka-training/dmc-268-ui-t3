export default {
  extends: ['stylelint-config-standard'],
  rules: {
    // Tailwind v4 directives.
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'theme',
          'custom-variant',
          'apply',
          'utility',
          'variant',
          'source',
          'plugin',
        ],
      },
    ],
    'at-rule-no-deprecated': [true, { ignoreAtRules: ['apply'] }],
    'nesting-selector-no-missing-scoping-root': [true, { ignoreAtRules: ['custom-variant'] }],
    'import-notation': 'string',
  },
}
