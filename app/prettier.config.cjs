const config = {
  plugins: [
    require.resolve("@trivago/prettier-plugin-sort-imports"),
    require.resolve("prettier-plugin-tailwindcss"),
  ],
  importOrder: [
    "^react",
    "^next",
    "<THIRD_PARTY_MODULES>",
    "^@w+\\w",
    "^@\\w",
    "^./",
  ],
  importOrderSeparation: true,
};

module.exports = config;
