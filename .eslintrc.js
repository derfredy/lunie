module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    // eslint for vue
    "plugin:vue/recommended",

    // eslint recommended rules
    "eslint:recommended",

    // vue rules for prettier
    "prettier/vue",

    // resolves eslint + prettier conflicts
    "plugin:prettier/recommended"
  ],
  rules: {
    "vue/component-name-in-template-casing": ["error", "PascalCase"],
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off"
  },
  parserOptions: {
    parser: "babel-eslint"
  }
};