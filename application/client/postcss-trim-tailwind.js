/**
 * PostCSS plugin to trim Tailwind CSS v4 compatibility overhead
 * for modern browsers that support @property.
 *
 * Removes:
 * 1. @layer properties content (@supports fallback for old browsers)
 * 2. @property declarations for --tw-* properties not referenced in the CSS
 */
const plugin = () => {
  return {
    postcssPlugin: "postcss-trim-tailwind",
    Once(root) {
      // 1. Remove @layer properties content.
      // The @supports block inside sets initial values for browsers without @property support.
      // Target browsers (Chrome 130+, Firefox 130+, Safari 18+) all support @property,
      // so the fallback is dead code.
      root.walkAtRules("layer", (rule) => {
        if (rule.params.trim() === "properties") {
          rule.removeAll();
        }
      });

      // 2. Collect all --tw-* custom properties referenced in the CSS
      const referencedProps = new Set();
      root.walk((node) => {
        // Skip @property declarations themselves
        if (node.type === "atrule" && node.name === "property") return;

        if (node.type === "decl") {
          // Properties referenced in var()
          for (const m of node.value.matchAll(/var\((--tw-[^,)]+)/g)) {
            referencedProps.add(m[1]);
          }
          // Properties being set directly
          if (node.prop.startsWith("--tw-")) {
            referencedProps.add(node.prop);
          }
        }
      });

      // 3. Remove @property declarations for unreferenced --tw-* properties
      root.walkAtRules("property", (rule) => {
        const propName = rule.params.trim();
        if (propName.startsWith("--tw-") && !referencedProps.has(propName)) {
          rule.remove();
        }
      });
    },
  };
};

plugin.postcss = true;
module.exports = plugin;
