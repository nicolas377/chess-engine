import { UciCommandType, UciInputCommand } from "types";
import { logInfo, splitStringOverWhitespace } from "utils";

function parseUciCommandName(name: string): UciCommandType {
  switch (name) {
    case "uci":
      return UciCommandType.UCI;
    case "debug":
      return UciCommandType.DEBUG;
    case "isready":
      return UciCommandType.IS_READY;
    case "setoption":
      return UciCommandType.SET_OPTION;
    case "register":
      return UciCommandType.REGISTER;
    case "ucinewgame":
      return UciCommandType.UCI_NEW_GAME;
    case "position":
      return UciCommandType.SET_POSITION;
    case "go":
      return UciCommandType.GO;
    case "stop":
      return UciCommandType.STOP;
    case "ponderhit":
      return UciCommandType.PONDER_HIT;
    case "quit":
      return UciCommandType.EXIT;
    default:
      return UciCommandType.UNKNOWN;
  }
}

export function parseUciInputString(rawLine: string): UciInputCommand {
  logInfo(`Parsing UCI command: ${rawLine}`);

  const lineParts: (string | undefined)[] = splitStringOverWhitespace(rawLine);
  parseUciCommandName(lineParts[0] ?? "");

  return { type: UciCommandType.IS_READY };
}
