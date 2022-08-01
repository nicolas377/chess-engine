// @ts-check
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import external from "rollup-plugin-node-externals";

/** @type {import("rollup").RollupOptions} */
const config = {
  input: "src/index.ts",
  output: {
    sourcemap: true,
    file: "dist/index.js",
    format: "cjs",
  },
  plugins: [
    external(),
    typescript({ tsconfig: "./tsconfig.rollup.json" }),
    json({ preferConst: true }),
  ],
};

export default config;
