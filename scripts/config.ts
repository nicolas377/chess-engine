import { Configuration } from "webpack";
import { join } from "path";

export const config: Configuration = {
  mode: "production",
  entry: "./src/index.ts",
  target: "node",
  output: {
    path: join(__dirname, "..", "dist"),
    filename: "index.js",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
