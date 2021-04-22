module.exports = {
  plugins: [
    require("postcss-combine-duplicated-selectors")({
      removeDuplicatedValues: true,
    }),
    require("cssnano")({ preset: "advanced" }),
    require("postcss-sorting")({
      "unspecified-properties-position": "bottomAlphabetical",
    }),
  ],
};
