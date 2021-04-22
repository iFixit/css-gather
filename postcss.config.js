module.exports = {
  plugins: [
    require("postcss-combine-duplicated-selectors")({
      removeDuplicatedValues: true,
    }),
    require("postcss-sorting")({
      "unspecified-properties-position": "bottomAlphabetical",
    }),
  ],
};
