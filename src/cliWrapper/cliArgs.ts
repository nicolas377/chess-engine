import { ValidationError } from "@utils/errors";
import { ArrayAt, ObjectEntries } from "@utils/helpers";

const enum Arguments {
  VERSION,
  HELP,
  DEBUG,
}

const ArgumentTriggers: Record<Arguments, string[]> = {
  [Arguments.VERSION]: ["--version", "-v"],
  [Arguments.HELP]: ["--help", "-h"],
  [Arguments.DEBUG]: ["--debug"],
};

const ArgumentDescriptions: Record<Arguments, string> = {
  [Arguments.VERSION]: "Prints the version of the engine.",
  [Arguments.HELP]: "Prints this help message.",
  [Arguments.DEBUG]: "Enables debug mode.",
};

const enum ArgTokenExtraTypes {
  CONTEXT_VALUE = "CONTEXT_VALUE",
}

type ArgToken<T extends Arguments | ArgTokenExtraTypes> =
  T extends ArgTokenExtraTypes.CONTEXT_VALUE
    ? { type: T; data: string }
    : {
        type: T;
        contextValue?: ArgToken<ArgTokenExtraTypes.CONTEXT_VALUE>;
      };

type TopLevelArgToken = ArgToken<Arguments>;

interface ConfigOptions {
  readonly version: boolean;
  readonly help: boolean;
  readonly debug: boolean;
}

function parseRawFlag(flag: string): Arguments | undefined {
  switch (flag) {
    case "--version":
    case "-v":
      return Arguments.VERSION;
    case "--help":
    case "-h":
      return Arguments.HELP;
    case "--debug":
      return Arguments.DEBUG;
    default:
      return undefined;
  }
}

function getContextValue(
  rawArgs: readonly string[],
  flagValueIndex: number,
  addSkippedIndex: (index: number) => void
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
}

function* parseArgTokens(
  rawArgs: readonly string[]
): Generator<TopLevelArgToken, void> {
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
    const arg: Arguments | "UNKNOWN" = parseRawFlag(flag) ?? "UNKNOWN";

    switch (arg) {
      case Arguments.HELP:
        yield {
          type: arg,
        };
        break;
      case Arguments.VERSION:
        yield {
          type: arg,
        };
        break;
      case Arguments.DEBUG:
        yield {
          type: arg,
        };
        break;
    }
  }
}

function validateArgTokens(argTokens: TopLevelArgToken[]): void {
  const argTokenTypes = new Set<Arguments>();

  for (const argToken of argTokens) {
    if (argTokenTypes.has(argToken.type)) {
      new ValidationError("Duplicate argument found").throw();
    }

    argTokenTypes.add(argToken.type);
  }
}

class MainCliArguments implements ConfigOptions {
  public readonly version: boolean;
  public readonly help: boolean;
  public readonly debug: boolean;

  constructor() {
    const argTokens: TopLevelArgToken[] = [
      ...parseArgTokens(process.argv.slice(2)),
    ];
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
      }
    }

    this.version ??= false;
    this.help ??= false;
    this.debug ??= false;
  }
}

export const cliArgs = new MainCliArguments();

export function logHelp(): void {
  const newLine = "\n";

  const message: string = ObjectEntries(ArgumentTriggers)
    .reduce<string>((acc, [arg, triggers]: [Arguments, string[]]) => {
      const description: string = ArgumentDescriptions[arg];

      return acc + `  ${triggers.join(", ")}: ${description}${newLine}`;
    }, "Usage: engine [options]" + newLine + "Options:" + newLine)
    .trim();

  console.log(message);
}
