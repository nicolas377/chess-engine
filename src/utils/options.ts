import { argv as processArgv } from "node:process";
import { version } from "../../package.json";
import { Options } from "types";
import {
  arrayAtIndex,
  entriesOfObject,
  logInfo,
  logTrace,
  logWarning,
  outputToConsole,
  wrapWithQuotes,
} from "utils";

type CliArgToken = {
  type: Options;
  data?: string | undefined;
};

const optionCliTriggers: Record<Options, string[]> = {
  [Options.VERSION]: ["--version", "-v"],
  [Options.HELP]: ["--help", "-h"],
  [Options.DEBUG]: ["--debug"],
};

const uciOptionNames: Record<
  Exclude<Options, Options.VERSION | Options.HELP>,
  string
> = {
  [Options.DEBUG]: "debug",
};

const optionDescriptions: Record<Options, string> = {
  [Options.VERSION]: "Prints the version of the engine.",
  [Options.HELP]: "Prints this help message.",
  [Options.DEBUG]: "Enables debug mode.",
};

function parseArgTokens(rawArgs: readonly string[]): CliArgToken[] {
  logInfo("Parsing arguments", rawArgs);

  const allArgTokens: CliArgToken[] = [];

  for (const [index, rawArgDoNotUseOutsideOfFlag] of rawArgs.entries()) {
    // support for --flag=value
    const flag: string = rawArgDoNotUseOutsideOfFlag.includes("=")
      ? arrayAtIndex(rawArgDoNotUseOutsideOfFlag.split("="), 0) ?? ""
      : rawArgDoNotUseOutsideOfFlag;
    const arg: Options | undefined = parseRawFlag(flag);

    logTrace(
      "Attempting to parse numeric flag",
      typeof arg === "string" ? wrapWithQuotes(arg) : arg,
      "to flag info"
    );
    switch (arg) {
      case Options.HELP:
        allArgTokens.push({
          type: arg,
        });
        logTrace("Help argument parsed");
        break;
      case Options.VERSION:
        allArgTokens.push({
          type: arg,
        });
        logTrace("Version argument parsed");
        break;
      case Options.DEBUG:
        allArgTokens.push({
          type: arg,
        });
        logTrace("Debug argument parsed");
        break;
      default:
        logTrace("Unknown flag found, skipping index", index);
        break;
    }
  }

  logTrace("Returning tokens:", allArgTokens);
  return allArgTokens;
}

function parseRawFlag(flag: string): Options | undefined {
  logInfo("Parsing raw flag", wrapWithQuotes(flag), "to argument type");
  // Implementation note: Any object's keys are always converted to strings.
  // Because of that, we have to convert back to the numeric enum value.
  for (const [argument, triggers] of entriesOfObject<`${Options}`, string[]>(
    optionCliTriggers
  )) {
    if (triggers.includes(flag)) {
      logTrace("Found raw flag in triggers of argument", argument);
      // TODO: this cast will work after the upgrade to TS 4.8
      return +argument as typeof argument extends `${infer T extends number}`
        ? T
        : never;
    }
  }
  logWarning(undefined, "Raw flag", flag, "isn't parsable");
}

function validateArgTokens(argTokens: CliArgToken[]): CliArgToken[] {
  logInfo("Validating arg tokens", argTokens);

  const argTokenTypes = new Set<Options>();

  for (const [index, argToken] of argTokens.entries()) {
    logTrace("Validating arg token", argToken);

    logTrace(
      "Checking if arg token type",
      argToken.type,
      "is unique in all tokens"
    );
    if (argTokenTypes.has(argToken.type)) {
      logTrace("Arg token type is not unique, removing duplicate");
      argTokens = argTokens.filter((_, i) => i !== index);
    }

    logTrace("Arg token type is unique, adding to set of arg token types");
    argTokenTypes.add(argToken.type);

    logTrace("Arg token validated");
  }

  return argTokens;
}

// all options are booleans, it's a bit simpler to use Record instead of an interface
type IOptions = Record<
  "printVersionAndExit" | "printHelpAndExit" | "debugMode",
  boolean
>;

class OptionsClass implements IOptions {
  private initialized = false;
  private [Options.VERSION] = false;
  private [Options.HELP] = false;
  private [Options.DEBUG] = false;

  public get printVersionAndExit(): boolean {
    return this[Options.VERSION];
  }

  public get printHelpAndExit(): boolean {
    return this[Options.HELP];
  }

  public get debugMode(): boolean {
    return this[Options.DEBUG];
  }
  public set debugMode(value: boolean) {
    this[Options.DEBUG] = value;
  }

  public initializeFromCliArgs(): void {
    if (this.initialized) return;

    let argTokens: CliArgToken[] = parseArgTokens(processArgv.slice(2));
    argTokens = validateArgTokens(argTokens);

    logTrace("Processing all arg tokens");
    for (const argToken of argTokens) {
      logTrace("Processing arg token", argToken);
      switch (argToken.type) {
        case Options.VERSION:
          logTrace("Setting version option");
          this[Options.VERSION] = true;
          break;
        case Options.HELP:
          logTrace("Setting help option");
          this[Options.HELP] = true;
          break;
        case Options.DEBUG:
          logTrace("Setting debug option");
          this[Options.DEBUG] = true;
          break;
      }
    }

    logTrace("arg token processing completed");
  }
}

const programOptions = new OptionsClass();

function logVersion(): void {
  outputToConsole(`Engine v${version}`);
}

function logHelp(): void {
  const newLine = "\n";

  const message: string = entriesOfObject(optionCliTriggers)
    .reduce<string>((acc, [arg, triggers]: [Options, string[]]) => {
      const description: string = optionDescriptions[arg];

      return acc + `  ${triggers.join(", ")}: ${description}${newLine}`;
    }, "Usage: engine [options]" + newLine + "Options:" + newLine)
    .trim();

  logVersion();
  outputToConsole(message);
}

export { uciOptionNames, programOptions, logHelp, logVersion };
