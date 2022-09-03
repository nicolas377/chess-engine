export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Rank = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
export type Square = `${File}${Rank}`;
export type AlgebraicMove = `${Square}${Square}`;

export const enum PieceType {
  KING = 1 << 0,
  PAWN = 1 << 1,
  KNIGHT = 1 << 2,
  BISHOP = 1 << 3,
  ROOK = 1 << 4,
  QUEEN = 1 << 5,

  WHITE = 1 << 6,
  BLACK = 1 << 7,
}

export const enum SquareType {
  A_FILE = 1 << 0,
  B_FILE = 1 << 1,
  C_FILE = 1 << 2,
  D_FILE = 1 << 3,
  E_FILE = 1 << 4,
  F_FILE = 1 << 5,
  G_FILE = 1 << 6,
  H_FILE = 1 << 7,

  RANK_1 = 1 << 8,
  RANK_2 = 1 << 9,
  RANK_3 = 1 << 10,
  RANK_4 = 1 << 11,
  RANK_5 = 1 << 12,
  RANK_6 = 1 << 13,
  RANK_7 = 1 << 14,
  RANK_8 = 1 << 15,
}

export const enum UciCommandType {
  UNKNOWN,
  UCI,
  DEBUG,
  IS_READY,
  SET_OPTION,
  REGISTER,
  UCI_NEW_GAME,
  SET_POSITION,
  GO,
  STOP,
  PONDER_HIT,
  EXIT,
}

export type UciInputCommand =
  | { type: UciCommandType.UNKNOWN }
  | { type: UciCommandType.UCI }
  | { type: UciCommandType.IS_READY }
  | { type: UciCommandType.UCI_NEW_GAME }
  | { type: UciCommandType.STOP }
  | { type: UciCommandType.PONDER_HIT }
  | { type: UciCommandType.EXIT }
  | { type: UciCommandType.REGISTER }
  | { type: UciCommandType.DEBUG; on: boolean }
  | { type: UciCommandType.SET_OPTION; name: string; value: string }
  | {
      type: UciCommandType.SET_POSITION;
      startPositionFen?: string;
      moves?: AlgebraicMove[];
    }
  | {
      type: UciCommandType.GO;
      ponder: boolean;
      infiniteSearch: boolean;
      searchWithMoves?: AlgebraicMove[];
      whiteTimeLeft?: number;
      whiteTimeIncrement?: number;
      blackTimeLeft?: number;
      blackTimeIncrement?: number;
      movesUntilNextTimeControl?: number;
      depthInPlies?: number;
      maxNodes?: number;
      lookForMateInMoves?: number;
      forcedMoveTime?: number;
    };

export const enum Options {
  VERSION,
  HELP,
  DEBUG,
  // UCI options
  PONDER,
  OWN_BOOK,
  MULTI_PV,
  SHOW_CURRENT_LINE,
  SHOW_REFUTATIONS,
  LIMIT_STRENGTH,
  ELO,
  ANALYZE_MODE,
  // Engine options
  USE_LICHESS_OPENING_BOOK,
  USE_LICHESS_TABLEBASE,
}

export type UciOptionTypes = "check" | "spin" | "combo" | "button" | "string";

export const enum ErrorCodes {
  VALIDATION_ERROR = "0001",
  ARGUMENT_PARSE_ERROR = "0002",
  UCI_PARSE_ERROR = "0003",
  GRACEFUL_EXIT = "9998",
  GENERAL = "9999",
}

export const enum DebugLevel {
  FATAL,
  WARNING,
  OUTPUT,
  INFO,
  TRACE,
}

export const logLevelNames: Record<DebugLevel, string> = {
  [DebugLevel.TRACE]: "TRACE",
  [DebugLevel.INFO]: "INFO",
  [DebugLevel.OUTPUT]: "OUTPUT",
  [DebugLevel.WARNING]: "WARNING",
  [DebugLevel.FATAL]: "FATAL",
};
