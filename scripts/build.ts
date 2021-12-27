import * as webpack from "webpack";
import { config } from "./config";

interface webpackErr extends Error {
  details: string;
}

const compiler = webpack(config);

new Promise<void>((resolve, reject) => {
  try {
    compiler.run((err, stats) => {
      if (err) {
        reject(err.stack || err);
        if ((err as webpackErr).details) {
          reject((err as webpackErr).details);
        }
        return;
      }

      const info = stats?.toJson();

      if (stats?.hasWarnings()) {
        console.warn(JSON.stringify(info?.warnings));
      }

      if (stats?.hasErrors()) {
        reject(info?.errors);
      }

      compiler.close((closeErr) => {
        if (closeErr) {
          reject(closeErr);
        }
        resolve();
      });
    });
  } catch (err) {
    reject(err);
  }
}).catch((err) => {
  console.error(err);
});
