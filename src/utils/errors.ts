import { Debug } from "./Debug";

const isCustomError = Symbol("isCustomError");

const enum ErrorCodes {
  VALIDATION_ERROR = "0001",
  UNKNOWN = "9999",
}

// basically an enum, can't use computed properties in enums
const ErrorNames: Record<ErrorCodes, string> = {
  [ErrorCodes.VALIDATION_ERROR]: "ValidationError",
  [ErrorCodes.UNKNOWN]: "UnknownError",
};

class BaseCustomError<T extends ErrorCodes> extends Error {
  readonly [isCustomError]: true = true;
  readonly name: typeof ErrorNames[T];
  readonly code: T;

  constructor(message: string, code: T) {
    super(message);

    this.code = code;
    this.name = ErrorNames[code];
  }

  throw(): never {
    Debug.fatal(this.toString());
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

type UnknownBaseCustomError = BaseCustomError<ErrorCodes>;

export function errorIsCustom(error: unknown): error is UnknownBaseCustomError {
  return error instanceof BaseCustomError;
}

export const UnknownError = makeCustomErrorWithCode(ErrorCodes.UNKNOWN);
export const ValidationError = makeCustomErrorWithCode(
  ErrorCodes.VALIDATION_ERROR
);
