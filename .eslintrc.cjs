module.exports = {
  root: true,
  plugins: ["prettier"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  rules: {
    "prettier/prettier": ["error", { printWidth: 120 }],
    "import/order": [
      "error",
      {
        alphabetize: {
          order: "asc",
          caseInsensitive: false,
        },
      },
    ],
    "import/no-named-as-default-member": 0,
  },
};
