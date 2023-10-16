module.exports = {
    env: {
        "browser": true,
        "es2021": true
    },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "airbnb-base",
        "airbnb-typescript/base"
    ],
    overrides: [],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      project: './tsconfig.json'
    },
    plugins: [
        "@typescript-eslint"
    ],
    ignorePatterns: ['*.js'],
    rules: {
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/naming-convention": "off",
      "@typescript-eslint/no-shadow": "off",
      "no-underscore-dangle": "off",
      "import/prefer-default-export": "off",
      "no-param-reassign": "off",
      "no-restricted-syntax": "off",
    }
}
