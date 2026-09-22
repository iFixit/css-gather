module.exports = {
  plugins: [
    require("./hoist-layer-order")(),
    require("./dedupe-layers")(),
    require("cssnano")({ preset: "advanced" }),
    require("postcss-sorting")({
      "unspecified-properties-position": "bottomAlphabetical",
    }),
  ],
};
