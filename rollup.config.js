// @ts-check
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import external from "rollup-plugin-node-externals";

/** @type {import("rollup").RollupOptions[]} */
const config = [
  {
    input: "src/cli.ts",
    output: {
      sourcemap: true,
      file: "dist/cli.dev.js",
      format: "cjs",
    },
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          productionBuild: JSON.stringify(false),
        },
      }),
      external(),
      typescript({ tsconfig: "./tsconfig.rollup.json" }),
      json({ preferConst: true }),
    ],
  },
  {
    input: "src/cli.ts",
    output: {
      sourcemap: true,
      file: "dist/cli.prod.js",
      format: "cjs",
    },
    treeshake: "recommended",
    plugins: [
      replace({
        preventAssignment: true,
        values: {
          productionBuild: JSON.stringify(true),
        },
      }),
      external(),
      typescript({
        tsconfig: "./tsconfig.rollup.json",
        compilerOptions: { removeComments: true },
      }),
      json({ preferConst: true }),
    ],
  },
];

export default config;
