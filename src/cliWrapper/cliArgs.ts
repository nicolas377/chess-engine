import { argv } from "process";
import { version } from "../../package.json";
import { DebugLevel } from "@utils/Debug";
import { GracefulExitError, ValidationError } from "@utils/errors";
import { ArrayAt, ArrayIncludes, ObjectKeys } from "@utils/helpers";

enum Arguments {
  VERSION = "VERSION",
  HELP = "HELP",
  DEBUG = "DEBUG",
  LOG_LEVEL = "LOG_LEVEL",
}

enum ArgumentTriggers {
  VERSION = "--version, -v",
  HELP = "--help, -h",
  DEBUG = "--debug",
  LOG_LEVEL = "--log-level",
}

enum ArgumentDescriptions {
  VERSION = "Prints the version of the engine.",
  HELP = "Prints this help message.",
  DEBUG = "Enables debug mode.",
  LOG_LEVEL = "Sets the log level.",
}

const enum ArgTokenExtraTypes {
  CONTEXT_VALUE = "CONTEXT_VALUE",
}

type ArgTokenType = Arguments | ArgTokenExtraTypes;

type ArgToken<T extends ArgTokenType> =
  T extends ArgTokenExtraTypes.CONTEXT_VALUE
    ? { type: T; data: string }
    : {
        type: T;
        data: string;
        contextValue?: ArgToken<ArgTokenExtraTypes.CONTEXT_VALUE>;
      };

type TopLevelArgToken = ArgToken<Arguments>;

interface ConfigOptions {
  debug: boolean;
  logLevel: DebugLevel;
}

class CliArgumentsSingleton implements ConfigOptions {
  private static _instance: CliArgumentsSingleton | undefined;

  public static getInstance(): CliArgumentsSingleton {
    CliArgumentsSingleton._instance ??= new CliArgumentsSingleton();

    return CliArgumentsSingleton._instance;
  }

  private parseRawCommand(rawCommand: string): Arguments | undefined {
    switch (rawCommand) {
      case "--version":
      case "-v":
        return Arguments.VERSION;
      case "--help":
      case "-h":
        return Arguments.HELP;
      case "--debug":
        return Arguments.DEBUG;
      case "--log-level":
        return Arguments.LOG_LEVEL;
    }
  }

  private createGetContextValue(
    addSkippedIndex: (index: number) => void
  ): (rawArgs: readonly string[], flagValueIndex: number) => string {
    return function (
      rawArgs: readonly string[],
      flagValueIndex: number
    ): string {
      const flagValue: string | undefined = ArrayAt(rawArgs, flagValueIndex);
      let contextValue: string | undefined;

      if (flagValue?.includes("=")) {
        // strip wrapping quotes when present
        if (flagValue?.startsWith('"') && flagValue.endsWith('"'))
          contextValue = contextValue?.slice(1, -1);
        else contextValue = ArrayAt(flagValue.split("="), 1);
      } else {
        contextValue = ArrayAt(rawArgs, flagValueIndex + 1);
        if (contextValue !== undefined) addSkippedIndex(flagValueIndex + 1);
      }

      return contextValue ?? "";
    };
  }

  private *parseRawArgs(
    rawArgs: readonly string[]
  ): Generator<TopLevelArgToken, void, unknown> {
    const { addSkippedIndex, indexShouldBeSkipped } = (() => {
      const _skippedArgIndices = new Set<number>();

      return {
        addSkippedIndex(index: number): void {
          _skippedArgIndices.add(index);
        },
        indexShouldBeSkipped(index: number): boolean {
          return _skippedArgIndices.has(index);
        },
      };
    })();

    for (const [index, _value] of rawArgs.entries()) {
      if (indexShouldBeSkipped(index)) continue;

      // support for --flag=value
      const flag: string = _value.includes("=") ? _value.split("=")[0] : _value;
      const arg: Arguments | "UNKNOWN" =
        this.parseRawCommand(flag) ?? "UNKNOWN";
      const getContextValue = this.createGetContextValue(addSkippedIndex);

      switch (arg) {
        case Arguments.HELP: {
          const newLine = "\n";
          let message =
            "Usage: engine [options]" + newLine + "Options:" + newLine;

          for (const key of ObjectKeys(Arguments)) {
            const trigger = ArgumentTriggers[key];
            const description = ArgumentDescriptions[key];

            message += `  ${trigger}: ${description}${newLine}`;
          }

          console.log(message.trim());
          new GracefulExitError().throw();
        }
        // eslint-disable-next-line no-fallthrough
        case Arguments.VERSION:
          console.log(`Engine v${version}`);
          new GracefulExitError().throw();
        // eslint-disable-next-line no-fallthrough
        case Arguments.DEBUG:
          yield {
            type: arg,
            data: flag,
          };
          break;
        case Arguments.LOG_LEVEL:
          yield {
            type: arg,
            data: flag,
            contextValue: {
              type: ArgTokenExtraTypes.CONTEXT_VALUE,
              data: getContextValue(rawArgs, index),
            },
          };
          break;
      }
    }
  } // private *parseRawArgs

  private validateArgTokens(argTokens: readonly TopLevelArgToken[]): void {
    const argTokenTypes = new Set<ArgTokenType>();

    for (const argToken of argTokens) {
      switch (argToken.type) {
        case Arguments.VERSION:
        case Arguments.HELP:
          break;
        case Arguments.DEBUG:
          if (argToken.contextValue)
            new ValidationError(
              "debug flag cannot have a context value"
            ).throw();
          break;
        case Arguments.LOG_LEVEL:
          if (
            !ArrayIncludes(
              ObjectKeys(DebugLevel),
              argToken.contextValue?.data.toUpperCase()
            )
          )
            new ValidationError(
              `Unknown log level ${argToken.contextValue?.data ?? "undefined"}`
            ).throw();
          break;
        default:
          new ValidationError(
            `Unknown argument token type: ${
              (argToken as TopLevelArgToken).type
            }`
          ).throw();
      }

      if (argTokenTypes.has(argToken.type)) {
        new ValidationError(
          `Duplicate argument ${argToken.data} found`
        ).throw();
      }

      argTokenTypes.add(argToken.type);
    }
  } // private validateArgTokens

  private parseArgTokens(argTokens: readonly TopLevelArgToken[]): void {
    for (const argToken of argTokens) {
      switch (argToken.type) {
        case Arguments.VERSION:
        case Arguments.HELP:
          break;
        case Arguments.LOG_LEVEL:
          this._logLevel =
            (argToken.contextValue?.data.toUpperCase() as DebugLevel) ?? "";
          break;
        case Arguments.DEBUG:
          this._debug = true;
          break;
      }
    }
  }

  private _debug = false;
  private _logLevel: DebugLevel = DebugLevel.DEBUG;

  public get debug(): boolean {
    return this._debug;
  }
  public get logLevel(): DebugLevel {
    return this._logLevel;
  }

  private constructor() {
    const rawArgs: readonly string[] = argv.slice(2);
    const argTokens: readonly TopLevelArgToken[] = [
      ...this.parseRawArgs(rawArgs),
    ];
    this.validateArgTokens(argTokens);
    this.parseArgTokens(argTokens);
  }
} // class CliArgumentsSingleton

export { CliArgumentsSingleton as CliArguments };
