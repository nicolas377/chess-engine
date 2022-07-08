import { createInterface } from "node:readline";
import { processUciArgs } from "./uci";
import type { PromiseableVoid } from "@utils/types";

export enum CommandType {
  FIRST,
  SECOND,
}

export interface CommandTypeCallbackData {
  [CommandType.FIRST]: { thing: string };
  [CommandType.SECOND]: { other: number };
}

// abbreviating LineReader to LR

type LRCallbackArgsCreator<T extends CommandType> = {
  type: T;
} & CommandTypeCallbackData[T];

export type LRCallbackArgs =
  | LRCallbackArgsCreator<CommandType.FIRST>
  | LRCallbackArgsCreator<CommandType.SECOND>;

type LRCallback = (args: LRCallbackArgs) => PromiseableVoid;

export function lineReader(cb: LRCallback): void {
  // never exit the program
  process.stdin.resume();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on("line", (line: string) => {
    const args: string[] = line.trim().split(/\s+/g);

    cb(processUciArgs(args));
  });
}
