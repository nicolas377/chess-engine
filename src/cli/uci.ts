import { AlgebraicMove, UciCommandType, UciInputCommand } from "types";
import {
  arrayAtIndex,
  logInfo,
  logTrace,
  splitStringOverWhitespace,
  UciParseError,
  wrapWithQuotes,
} from "utils";

function parseUciCommandName(name: string): UciCommandType {
  logInfo("Parsing UCI command name:", wrapWithQuotes(name));
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
      logInfo("Unknown UCI command name:", wrapWithQuotes(name));
      return UciCommandType.UNKNOWN;
  }
}

export function parseUciInputString(
  rawLine: string
): UciInputCommand | InstanceType<typeof UciParseError> {
  logInfo("Parsing UCI command:", wrapWithQuotes(rawLine));

  const lineParts: string[] = splitStringOverWhitespace(rawLine);
  const commandName: UciCommandType = parseUciCommandName(
    arrayAtIndex(lineParts, 0) ?? ""
  );
  logInfo("Parsed UCI command name:", commandName);

  logTrace("Parsing UCI command arguments");
  switch (commandName) {
    // We don't need to parse any arguments for these commands.
    // No registration is needed for this engine.
    case UciCommandType.UNKNOWN:
    case UciCommandType.UCI:
    case UciCommandType.IS_READY:
    case UciCommandType.REGISTER:
    case UciCommandType.UCI_NEW_GAME:
    case UciCommandType.STOP:
    case UciCommandType.PONDER_HIT:
    case UciCommandType.EXIT:
      logTrace("No arguments needed for command");
      return { type: commandName };
    case UciCommandType.DEBUG:
      logTrace("Parsing debug command arguments");
      return { type: commandName, on: arrayAtIndex(lineParts, 1) === "on" };
    case UciCommandType.SET_OPTION: {
      logTrace("Parsing set option command arguments");
      const name = /(?<=name )(.*)(?= value)/.exec(rawLine)?.[0];
      const value = /(?<=value )(.*)/.exec(rawLine)?.[0];

      logTrace(
        "Parsed name",
        wrapWithQuotes(name ?? "undefined"),
        "and value",
        wrapWithQuotes(value ?? "undefined")
      );

      if (!name || !value) {
        return new UciParseError("Name or value is not specified");
      }

      return {
        type: commandName,
        name,
        value,
      };
    }
    case UciCommandType.SET_POSITION: {
      logTrace("Parsing set position command arguments");
      let fen: string | undefined;
      let moves: string[] | undefined;

      // These regex's use positive lookbehinds, which make them incompatible with node versions less than 10.
      if (lineParts.includes("fen")) {
        fen = /(?<=fen\s+)((?:\S+ ){5})(?:\S+?)/.exec(rawLine)?.[0];

        logTrace("Parsed fen", wrapWithQuotes(fen ?? "undefined"));
        if (!fen)
          return new UciParseError("FEN not found where one was expected");
      }
      if (lineParts.includes("moves")) {
        moves = /(?<=moves\s+)([a-z][1-8][a-z][1-8]\s*)+/
          .exec(rawLine)?.[0]
          // TODO: figure out how to get the regex to not match the last whitespace character.
          ?.trimEnd()
          .split(/\s/g);

        logTrace("Parsed moves", moves);
        if (
          !moves ||
          moves.some(
            (move) => !(/[a-z][1-8][a-z][1-8]/.exec(move)?.[0] === move)
          )
        )
          return new UciParseError(
            "Moves not found where they was expected, or moves are not algebraic"
          );
      }

      return {
        type: commandName,
        startPositionFen: fen,
        moves: moves as AlgebraicMove[] | undefined,
      };
    }
    case UciCommandType.GO: {
      logTrace("Parsing go command arguments");

      const getNumberAfterFlag = (flag: string): number | undefined => {
        logInfo("Attempting to parse number after flag", wrapWithQuotes(flag));

        const flagIndex = lineParts.indexOf(flag);
        if (flagIndex === -1) {
          logTrace(
            "Flag",
            wrapWithQuotes(flag),
            "not found in passed UCI command, returning undefined"
          );
          return undefined;
        }
        const numberIndex = flagIndex + 1;
        if (numberIndex >= lineParts.length) {
          logTrace("Flag", wrapWithQuotes(flag), "has nothing after it");
          return undefined;
        }

        logTrace(
          "Attempting to parse number at index",
          numberIndex,
          "in",
          lineParts
        );
        const number = parseInt(arrayAtIndex(lineParts, numberIndex) ?? "");
        if (isNaN(number)) {
          logTrace("A number was not able to be parsed, returning undefined");
          return undefined;
        }

        logInfo(number, "was parsed");
        return number;
      };
      let searchWithMoves: string[] | undefined;

      if (lineParts.includes("searchmoves")) {
        searchWithMoves = /(?<=searchmoves\s+)([a-z][1-8][a-z][1-8]\s*)+/
          .exec(rawLine)?.[0]
          ?.trimEnd()
          .split(/\s/g);
        logTrace("Parsed search moves", searchWithMoves);
        if (
          !searchWithMoves ||
          searchWithMoves.some(
            (move) => !(/[a-z][1-8][a-z][1-8]/.exec(move)?.[0] === move)
          )
        )
          return new UciParseError(
            "Moves not found where they were expected, or moves are not algebraic"
          );
      }

      return {
        type: commandName,
        ponder: lineParts.includes("ponder"),
        infiniteSearch: lineParts.includes("infinite"),
        searchWithMoves: searchWithMoves as AlgebraicMove[] | undefined,
        whiteTimeLeft: getNumberAfterFlag("wtime"),
        blackTimeLeft: getNumberAfterFlag("btime"),
        whiteTimeIncrement: getNumberAfterFlag("winc"),
        blackTimeIncrement: getNumberAfterFlag("binc"),
        movesUntilNextTimeControl: getNumberAfterFlag("movestogo"),
        depthInPlies: getNumberAfterFlag("depth"),
        maxNodes: getNumberAfterFlag("nodes"),
        lookForMateInMoves: getNumberAfterFlag("mate"),
        forcedMoveTime: getNumberAfterFlag("movetime"),
      };
    }
  }
}
