import * as webpack from "webpack";
import { config } from "./config";

export async function regularBuild() {
  const compiler = webpack(config);

  await new Promise<void>((resolve, reject) => {
    try {
      compiler.run((err, stats) => {
        if (err) {
          reject(err.stack || err);
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
  });
}
