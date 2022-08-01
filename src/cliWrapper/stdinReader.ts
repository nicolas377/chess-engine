import { stdin as processStdin, stdout as processStdout } from "node:process";
import { createInterface } from "node:readline";
import {
  processUciArgs,
  UciCommandType,
  UciCommandTypeAssociatedData,
} from "./uci";
import { PromiseableVoid } from "types";
import { StringSplitOverWhiteSpace } from "utils";

type UciCommandArgsCreator<T extends UciCommandType> = [
  type: T,
  data: UciCommandTypeAssociatedData[T]
];

export type UnknownUciCommandArgs =
  | UciCommandArgsCreator<UciCommandType.UNKNOWN>
  | UciCommandArgsCreator<UciCommandType.FIRST>
  | UciCommandArgsCreator<UciCommandType.SECOND>;

export function lineReader(
  cb: (...args: UnknownUciCommandArgs) => PromiseableVoid
): void {
  processStdin.resume();

  const rl = createInterface({
    input: processStdin,
    output: processStdout,
    terminal: false,
  });

  rl.on("line", (line: string) => {
    const args: string[] = StringSplitOverWhiteSpace(line);

    cb(...processUciArgs(args));
  });
}
