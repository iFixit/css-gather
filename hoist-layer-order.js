// Layer order is set by first mention, and cssnano's discard-duplicates keeps
// the last copy of a repeated `@layer a, b;`, so pin the order at the top first.
module.exports = () => ({
  postcssPlugin: "hoist-layer-order",
  Once(root, { AtRule }) {
    const names = [];
    root.each((node) => {
      if (node.type !== "atrule" || node.name !== "layer") {
        return;
      }
      for (const name of node.params.split(",")) {
        const trimmed = name.trim();
        if (trimmed && !names.includes(trimmed)) {
          names.push(trimmed);
        }
      }
      if (!node.nodes) {
        node.remove();
      }
    });
    if (names.length === 0) {
      return;
    }
    const statement = new AtRule({ name: "layer", params: names.join(", ") });
    // @charset has to stay the very first thing in the file
    const first = root.first;
    if (first && first.type === "atrule" && first.name === "charset") {
      first.after(statement);
    } else {
      root.prepend(statement);
    }
  },
});
module.exports.postcss = true;
