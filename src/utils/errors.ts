import { cliArgsHadError } from "./cliArgs";
import { logError, logInfo } from "@utils/Debug";
import { ExitProcess } from "@utils/helpers";

const isCustomError = Symbol("isCustomError");

const enum ErrorCodes {
  VALIDATION_ERROR = "0001",
  ARGUMENT_PARSE_ERROR = "0002",
  GRACEFUL_EXIT = "9998",
  GENERAL = "9999",
}

// basically an enum, can't use computed properties in enums
const ErrorNames: Record<ErrorCodes, string> = {
  [ErrorCodes.VALIDATION_ERROR]: "ValidationError",
  [ErrorCodes.ARGUMENT_PARSE_ERROR]: "ArgumentParseError",
  [ErrorCodes.GRACEFUL_EXIT]: "GracefulExit",
  [ErrorCodes.GENERAL]: "GeneralError",
};

// same as above
const ErrorDescriptions: Record<ErrorCodes, string> = {
  [ErrorCodes.VALIDATION_ERROR]:
    "Something went wrong when validating input through CLI flags.",
  [ErrorCodes.ARGUMENT_PARSE_ERROR]:
    "Something went wrong when parsing CLI flags.",
  [ErrorCodes.GRACEFUL_EXIT]: "The program was asked to exit gracefully.",
  [ErrorCodes.GENERAL]: "An error occurred.",
};

interface CustomError<T extends ErrorCodes> {
  [isCustomError]: true;
  code: T;
  name: typeof ErrorNames[T];
  description: typeof ErrorDescriptions[T];

  throw(): never;
}

class BaseCustomError<T extends ErrorCodes>
  extends Error
  implements CustomError<T>
{
  readonly [isCustomError]: true = true;
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
    console.log(this.toString());
    if (!cliArgsHadError) logError(this.toString());
    else {
      console.log(this.toString());
      ExitProcess(1);
    }
  }
}

// purposely not adding an explicit return type here, the compiler infers a better type
function makeCustomErrorWithCode<T extends ErrorCodes>(code: T) {
  return class extends BaseCustomError<T> {
    constructor(message: string) {
      super(message, code);

      Error.captureStackTrace(this, this.constructor);
    }
  };
}

export class GracefulExitError
  extends Error
  implements CustomError<ErrorCodes.GRACEFUL_EXIT>
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
    ExitProcess(0);
  }
}
export const ArgumentParseError = makeCustomErrorWithCode(
  ErrorCodes.ARGUMENT_PARSE_ERROR
);
export const GeneralError = makeCustomErrorWithCode(ErrorCodes.GENERAL);
export const ValidationError = makeCustomErrorWithCode(
  ErrorCodes.VALIDATION_ERROR
);
