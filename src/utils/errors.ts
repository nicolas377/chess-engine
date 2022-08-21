import { addEngineState, EngineState } from "state";
import { ErrorCodes } from "types";
import { exitProcess, logError, logInfo } from "utils";

const isCustomError = Symbol("isCustomError");

// basically an enum, can't use computed properties in enums
const ErrorNames: Record<ErrorCodes, string> = {
  [ErrorCodes.VALIDATION_ERROR]: "ValidationError",
  [ErrorCodes.ARGUMENT_PARSE_ERROR]: "ArgumentParseError",
  [ErrorCodes.UCI_PARSE_ERROR]: "UciParseError",
  [ErrorCodes.GRACEFUL_EXIT]: "GracefulExit",
  [ErrorCodes.GENERAL]: "GeneralError",
};

// same as above
const ErrorDescriptions: Record<ErrorCodes, string> = {
  [ErrorCodes.VALIDATION_ERROR]:
    "Something went wrong when validating input through CLI flags.",
  [ErrorCodes.ARGUMENT_PARSE_ERROR]:
    "Something went wrong when parsing CLI flags.",
  [ErrorCodes.UCI_PARSE_ERROR]: "Something went wrong when parsing UCI input.",
  [ErrorCodes.GRACEFUL_EXIT]: "The program was asked to exit gracefully.",
  [ErrorCodes.GENERAL]: "An error occurred.",
};

interface ICustomError<T extends ErrorCodes> {
  [isCustomError]: true;
  code: T;
  name: typeof ErrorNames[T];
  description: typeof ErrorDescriptions[T];

  throw(): never;
}

class BaseCustomError<T extends ErrorCodes>
  extends Error
  implements ICustomError<T>
{
  readonly [isCustomError] = true;
  readonly name: typeof ErrorNames[T];
  readonly code: T;
  readonly description: typeof ErrorDescriptions[T];

  constructor(message: string, code: T) {
    super(message);

    this.code = code;
    this.name = ErrorNames[code];
    this.description = ErrorDescriptions[code];
  }

  toString(): string {
    return `${this.name}: ${this.description} (${this.message})\n${
      this.stack?.split("\n").splice(1).join("\n") ?? ""
    }`;
  }

  throw(): never {
    addEngineState(EngineState.ERROR);
    addEngineState(EngineState.EXITING);

    console.log(this.toString());
    logError(this.toString());
    exitProcess(1);
  }
}

// TODO: is there a way to make the original constructor in BaseCustomError not visible to users of this type?
type CustomError<T extends ErrorCodes> = typeof BaseCustomError<T> & {
  new (message: string): BaseCustomError<T>;
};

function makeCustomErrorWithCode<T extends ErrorCodes>(
  code: T
): CustomError<T> {
  return class extends BaseCustomError<T> {
    constructor(message: string) {
      super(message, code);

      Error.captureStackTrace(this, this.constructor);
    }
  };
}

export class GracefulExitError
  extends Error
  implements ICustomError<ErrorCodes.GRACEFUL_EXIT>
{
  readonly [isCustomError] = true;
  readonly code = ErrorCodes.GRACEFUL_EXIT;
  readonly name = ErrorNames[ErrorCodes.GRACEFUL_EXIT];
  readonly description = ErrorDescriptions[ErrorCodes.GRACEFUL_EXIT];

  constructor() {
    super("Graceful exit");
  }

  throw(): never {
    logInfo("Gracefully exiting");
    addEngineState(EngineState.EXITING);
    exitProcess(0);
  }
}
export const ArgumentParseError = makeCustomErrorWithCode(
  ErrorCodes.ARGUMENT_PARSE_ERROR
);
export const UciParseError = makeCustomErrorWithCode(
  ErrorCodes.UCI_PARSE_ERROR
);
export const GeneralError = makeCustomErrorWithCode(ErrorCodes.GENERAL);
export const ValidationError = makeCustomErrorWithCode(
  ErrorCodes.VALIDATION_ERROR
);
