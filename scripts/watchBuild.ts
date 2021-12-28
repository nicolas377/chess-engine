import * as webpack from "webpack";
import { config } from "./config";

export function watchBuild() {
  return new Promise<void>((resolve, reject) => {
    webpack({ watch: true, ...config }, (err, stats) => {
      if (err) {
        reject(err.stack || err);
        return;
      }

      const info = stats?.toJson();

      if (stats?.hasWarnings()) {
        console.warn(JSON.parse(JSON.stringify(info?.warnings)));
      }

      if (stats?.hasErrors()) {
        reject(info?.errors);
      }

      console.log("recompiled!");
    });
  });
}
