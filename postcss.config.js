module.exports = {
  plugins: [
    require("./hoist-layer-order")(),
    require("cssnano")({ preset: "advanced" }),
    require("postcss-sorting")({
      "unspecified-properties-position": "bottomAlphabetical",
    }),
  ],
};
