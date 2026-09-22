// cssnano only drops a duplicate rule that shares a parent with its twin, and each
// URL (and each Tailwind build on a page) brings its own copy of every @layer block.
const PRUNABLE_LAYERS = new Set(["theme", "properties"]);

const referencedNames = (value) =>
  [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map((match) => match[1]);

const isInside = (node, ancestors) => {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ancestors.has(parent)) {
      return true;
    }
  }
  return false;
};

module.exports = () => ({
  postcssPlugin: "dedupe-layers",
  Once(root) {
    const firstBlock = new Map();
    root.each((node) => {
      if (node.type !== "atrule" || node.name !== "layer" || !node.nodes) {
        return;
      }
      const name = node.params.trim();
      const first = firstBlock.get(name);
      if (first) {
        first.append([...node.nodes]);
        node.remove();
      } else {
        firstBlock.set(name, node);
      }
    });
    for (const block of firstBlock.values()) {
      const seen = new Set();
      for (const child of [...block.nodes].reverse()) {
        const clone = child.clone();
        clone.cleanRaws(true);
        const text = clone.toString();
        if (seen.has(text)) {
          child.remove();
        } else {
          seen.add(text);
        }
      }
    }

    // Tailwind's theme defines every variable the whole build reads; keep only
    // those the critical rules reach, directly or through another variable.
    const prunableBlocks = new Set(
      [...firstBlock].filter(([name]) => PRUNABLE_LAYERS.has(name)).map(([, block]) => block),
    );
    const prunable = [];
    const valuesByName = new Map();
    const used = new Set();
    const queue = [];
    const markUsed = (value) => {
      for (const name of referencedNames(value)) {
        if (!used.has(name)) {
          used.add(name);
          queue.push(name);
        }
      }
    };
    root.walkDecls((decl) => {
      if (decl.prop.startsWith("--") && isInside(decl, prunableBlocks)) {
        prunable.push(decl);
        valuesByName.set(decl.prop, [...(valuesByName.get(decl.prop) || []), decl.value]);
      } else {
        markUsed(decl.value);
      }
    });
    while (queue.length > 0) {
      for (const value of valuesByName.get(queue.pop()) || []) {
        markUsed(value);
      }
    }

    for (const decl of prunable) {
      if (!used.has(decl.prop)) {
        decl.remove();
      }
    }
    root.each((node) => {
      if (node.type === "atrule" && node.name === "property" && !used.has(node.params.trim())) {
        node.remove();
      }
    });
  },
});
module.exports.postcss = true;
