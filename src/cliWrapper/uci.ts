import { LRCallbackArgs } from "./cliReader";

export function processUciArgs(args: readonly string[]): LRCallbackArgs {
  // process the args according to the uci protocol
  // http://wbec-ridderkerk.nl/html/UCIProtocol.html
  const [type, ...rest] = args;
}
