// @ts-check
const esbuild = require("esbuild");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  format: "cjs",
  minify: production,
  sourcemap: !production,
  sourcesContent: false,
  platform: "node",
  outfile: "dist/extension.js",
  external: ["vscode", "playwright"],
  logLevel: "info",
  // Allow top-level await in bundled dependencies
  target: "node18",
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log("[watch] build started — waiting for changes…");
  } else {
    await esbuild.build(buildOptions);
    console.log("[build] finished");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
