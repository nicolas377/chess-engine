import { UnknownUciCommandArgs } from "./stdinReader";

export const enum UciCommandType {
  UNKNOWN,
  FIRST,
  SECOND,
}

export interface UciCommandTypeAssociatedData {
  [UciCommandType.UNKNOWN]: null;
  [UciCommandType.FIRST]: { thing: string };
  [UciCommandType.SECOND]: { other: number };
}

export type UnknownUciCommandTypeAssociatedData =
  UciCommandTypeAssociatedData[UciCommandType];

const unknownCommandDataHolder: UciCommandTypeAssociatedData[UciCommandType.UNKNOWN] =
  null;

function getUciCommandType(rawType: string): UciCommandType {
  switch (rawType) {
    default:
      return UciCommandType.UNKNOWN;
  }
}

function getUciCommandArgs(
  commandType: UciCommandType
): UnknownUciCommandTypeAssociatedData {
  switch (commandType) {
    case UciCommandType.UNKNOWN:
      return unknownCommandDataHolder;
    default:
      return unknownCommandDataHolder;
  }
}

export function processUciArgs(args: readonly string[]): UnknownUciCommandArgs {
  // process the args according to the uci protocol
  // http://wbec-ridderkerk.nl/html/UCIProtocol.html

  const commandType: UciCommandType = getUciCommandType(args[0]);
  const commandData: UnknownUciCommandTypeAssociatedData =
    getUciCommandArgs(commandType);

  return [commandType, commandData] as UnknownUciCommandArgs;
}
