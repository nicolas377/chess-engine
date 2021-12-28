import * as yargs from "yargs";
import { regularBuild } from "./regularBuild";
import { watchBuild } from "./watchBuild";

const toWatch = yargs(process.argv.slice(2)).options({
  watch: {
    type: "boolean",
    default: false,
  },
}).argv.watch;

if (toWatch) watchBuild();
else regularBuild();
