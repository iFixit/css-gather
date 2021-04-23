module.exports = {
  plugins: [
    require("cssnano")({ preset: "advanced" }),
    require("postcss-sorting")({
      "unspecified-properties-position": "bottomAlphabetical",
    }),
  ],
};
