import { Arguments, DebugLevel } from "../types";
import { logInfo, logTrace, logWarning, stringifyJsonData } from "@utils/Debug";
import { ArgumentParseError, ValidationError } from "@utils/errors";
import { ArrayAt, ArrayIncludes, ObjectEntries } from "@utils/helpers";

type ArgumentsWithoutContext = Exclude<Arguments, Arguments.CONTEXT_VALUE>;

const ArgumentTriggers: Record<ArgumentsWithoutContext, string[]> = {
  [Arguments.VERSION]: ["--version", "-v"],
  [Arguments.HELP]: ["--help", "-h"],
  [Arguments.DEBUG]: ["--debug"],
  [Arguments.LOG_LEVEL]: ["--log-level"],
};

const ArgumentDescriptions: Record<ArgumentsWithoutContext, string> = {
  [Arguments.VERSION]: "Prints the version of the engine.",
  [Arguments.HELP]: "Prints this help message.",
  [Arguments.DEBUG]: "Enables debug mode.",
  [Arguments.LOG_LEVEL]: `Sets the level at which logs are included in the log file. Any of ${Object.values(
    DebugLevel
  ).join(", ")}.`,
};

type ArgToken<T extends Arguments> = T extends Arguments.CONTEXT_VALUE
  ? { type: T; data: string }
  : {
      type: T;
      contextValue?: ArgToken<Arguments.CONTEXT_VALUE>;
    };

type TopLevelArgToken = ArgToken<ArgumentsWithoutContext>;

interface ConfigOptions {
  readonly version: boolean;
  readonly help: boolean;
  readonly debug: boolean;
  readonly logLevel: string;
}

function throwError(error: { throw(): never }): never {
  cliArgsHadError = true;
  error.throw();
}

function logHelp(): void {
  const newLine = "\n";

  const message: string = ObjectEntries(ArgumentTriggers)
    .reduce<string>(
      (acc, [arg, triggers]: [ArgumentsWithoutContext, string[]]) => {
        const description: string = ArgumentDescriptions[arg];

        return acc + `  ${triggers.join(", ")}: ${description}${newLine}`;
      },
      "Usage: engine [options]" + newLine + "Options:" + newLine
    )
    .trim();

  console.log(message);
}

function parseRawFlag(flag: string): Arguments | undefined {
  for (const [argument, triggers] of ObjectEntries<
    `${ArgumentsWithoutContext}`,
    string[]
  >(ArgumentTriggers)) {
    // argument is a string of what is represented in the enum, we have to convert to a number
    if (triggers.includes(flag)) return +argument;
  }
}

function getContextValue(
  rawArgs: readonly string[],
  flagValueIndex: number,
  addSkippedIndex: (index: number) => void
): string {
  logInfo("Getting context value");
  logTrace(
    `Getting context value from index ${flagValueIndex} on arguments ${stringifyJsonData(
      rawArgs
    )}`
  );

  const flagValue: string | undefined = ArrayAt(rawArgs, flagValueIndex);
  let contextValue: string | undefined;

  if (flagValue?.includes("=")) {
    // strip wrapping quotes when present
    if (flagValue?.startsWith('"') && flagValue.endsWith('"'))
      contextValue = flagValue?.slice(1, -1);
    else contextValue = ArrayAt(flagValue.split("="), 1);
  } else {
    contextValue = ArrayAt(rawArgs, flagValueIndex + 1);
    if (contextValue !== undefined) addSkippedIndex(flagValueIndex + 1);
  }

  if (contextValue === undefined)
    throwError(
      new ArgumentParseError("Missing context value where one was expected")
    );

  return contextValue;
}

function parseArgTokens(rawArgs: readonly string[]): TopLevelArgToken[] {
  logInfo("Parsing arguments");
  logTrace(`Parsing arguments from ${stringifyJsonData(rawArgs)}`);

  const skippedIndices = new Set<number>();
  const allArgTokens: TopLevelArgToken[] = [];

  for (const [index, _value] of rawArgs.entries()) {
    if (skippedIndices.has(index)) continue;

    // support for --flag=value
    const flag: string = _value.includes("=") ? _value.split("=")[0] : _value;
    const arg: Arguments | "UNKNOWN" = parseRawFlag(flag) ?? "UNKNOWN";

    logTrace(`Parsing flag ${flag}`);
    switch (arg) {
      case "UNKNOWN":
        logWarning(`Raw flag ${flag} isn't parsable`);
        break;
      case Arguments.HELP:
        allArgTokens.push({
          type: arg,
        });
        logTrace("Help argument parsed");
        break;
      case Arguments.VERSION:
        allArgTokens.push({
          type: arg,
        });
        logTrace("Version argument parsed");
        break;
      case Arguments.DEBUG:
        allArgTokens.push({
          type: arg,
        });
        logTrace("Debug argument parsed");
        break;
      case Arguments.LOG_LEVEL: {
        const contextValue = getContextValue(
          rawArgs,
          index,
          skippedIndices.add
        );
        allArgTokens.push({
          type: arg,
          contextValue: {
            type: Arguments.CONTEXT_VALUE,
            data: contextValue,
          },
        });
        logTrace(
          `Log level argument parsed with context value ${contextValue}`
        );
        break;
      }
    }
  }

  logTrace(`Returning tokens: ${stringifyJsonData(allArgTokens)}`);
  return allArgTokens;
}

function validateArgTokens(argTokens: TopLevelArgToken[]): void {
  logInfo("Validating arg tokens");
  logTrace(`arg tokens: ${stringifyJsonData(argTokens)}`);

  const argTokenTypes = new Set<Arguments>();

  for (const argToken of argTokens) {
    if (argTokenTypes.has(argToken.type)) {
      throwError(new ValidationError("Duplicate argument found"));
    }

    argTokenTypes.add(argToken.type);

    switch (argToken.type) {
      case Arguments.LOG_LEVEL: {
        const rawContextValue: string | undefined = argToken.contextValue?.data;

        if (rawContextValue === undefined)
          throwError(
            new ValidationError(
              "Context value for log level flag not specified."
            )
          );

        if (
          ArrayIncludes(
            Object.values(DebugLevel),
            rawContextValue.toUpperCase()
          )
        )
          new ValidationError(
            `Provided log level ${rawContextValue} is not a defined log level.`
          );
      }
    }
  }
}

export let cliArgsHadError = false;

class MainCliArguments implements ConfigOptions {
  public readonly version: boolean = false;
  public readonly help: boolean = false;
  public readonly debug: boolean = false;
  public readonly logLevel: DebugLevel = DebugLevel.TRACE;

  constructor() {
    const argTokens: TopLevelArgToken[] = parseArgTokens(process.argv.slice(2));
    validateArgTokens(argTokens);

    // setting options
    for (const argToken of argTokens) {
      switch (argToken.type) {
        case Arguments.VERSION:
          this.version = true;
          break;
        case Arguments.HELP:
          this.help = true;
          break;
        case Arguments.DEBUG:
          this.debug = true;
          break;
        case Arguments.LOG_LEVEL:
          this.logLevel =
            // we already validated the argTokens, so this should be safe
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            argToken.contextValue!.data!.toUpperCase() as DebugLevel;
      }
    }
  }
}

let _cliArgs: MainCliArguments | undefined;

function cliArgs(): MainCliArguments {
  logInfo("Attempting to load CLI arguments from cache");
  if (_cliArgs === undefined) {
    logTrace("No CLI arguments cache found, creating new instance");
    _cliArgs = new MainCliArguments();
  } else {
    logTrace("Cache hit: using existing CLI arguments instance");
  }

  return _cliArgs;
}

export { logHelp, cliArgs };
