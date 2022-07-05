import { createInterface } from "node:readline";
import {
  processUciArgs,
  UciCommandType,
  UciCommandTypeAssociatedData,
} from "./uci";
import { PromiseableVoid, StringSplitOverWhiteSpace } from "@utils/helpers";

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
  // never exit the program
  process.stdin.resume();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", (line: string) => {
    const args: string[] = StringSplitOverWhiteSpace(line);

    cb(...processUciArgs(args));
  });
}
