import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import globals from "globals";

export default [
  { ignores: ["dist/", ".astro/", "node_modules/"] },
  { ...js.configs.recommended, files: ["**/*.{js,mjs,cjs}"] },
  ...astro.configs["flat/recommended"],
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: { globals: globals.node },
  },
];
