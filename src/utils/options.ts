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
  type: OptionsThatCanBeSetOnCli;
};

type OptionsThatCanBeSetOnCli = Options.HELP | Options.VERSION;
type OptionsThatCanBeSetOnUci = Exclude<
  Options,
  // debug is set by debug on in uci, not setoption
  OptionsThatCanBeSetOnCli | Options.DEBUG
>;

const optionCliTriggers: Record<OptionsThatCanBeSetOnCli, string[]> = {
  [Options.VERSION]: ["--version", "-v"],
  [Options.HELP]: ["--help", "-h"],
};

const cliOptionDescriptions: Record<OptionsThatCanBeSetOnCli, string> = {
  [Options.VERSION]: "Prints the version of the engine.",
  [Options.HELP]: "Prints this help message.",
};

// TODO: use satisfies and as const here when TS 4.9 is released
// Use https://www.typescriptlang.org/play?target=99&ts=4.9.0-dev.20220903#code/KYDwDg9gTgLgBAMwK4DsDGMCWEV2CmKTYAZwHkEyAjAK2AwB4AVPEGfAExLgAUoIwwWAE8A0sGEAaOAFUAfAAoAUHDgRaALjgAletA7Np8pQEotAbSZGAuuetwA3irhRgMJFFzU6GAHT5CYhIFdRoTOABDbksbOwBuJQBfJSU0HBJ4fCQAWzgyMCx0x2cANQBRbQBlAEkyADlJZwAJMoAZHkbVABEygCEZAHFOuAB6EdkAYWq1AuwUEmceep7tYbIAdTqAfV6yMlFhgFkZVqZqrZ4S4cqmja2JmW1tMrqmLdbqurLr2-Wt54AYjImABBM71SrDD6HapvSpMZ51AZMJrDNpkYYguog1oATUqZS2hzIPWGYzgZRQAHNMChgDNCvNnDICe9qhMWpVKlsyDwXp8Bjs9gdmayPhyylytqDeq0+iCCY1kkoYMJBHlZukmAALCIwCYRFC9YCVNxkFATAA2mDgAF4NYySL4Wu04AAfB1zJ3lKq1OoJVXq-KOnV6g1Gk1mlAyNA2+1lEBoS1IDjABjOYNesnjVNUJBUuCYbgkNxwKjCOC5-NqXC0uBIWPSFAQeAlmACRkZzXzUP6w3G00wc1Wm0ezPpXw9foDJRyBKpdLwBuYccoVoQCAAayQYF6wjqEWy9PtTlU5lXTqWdRW1i0ACIeDhU1A78Nz92nRttrt9re4HeyAAdyNDdN1fZx30dXxjlOc5Lj-O9DiQS0sEucCzwvXwbjuB4nheN4Pi+BCZCmLZKm1CBAImDwoFaWlgHQuBIK9LDfn+MogVBcE6kqYjSPIyjdGQGA9S9RjmInaFYTIhEXmRJo+POOjskwGBKkIfAqRgbVxMw9FFK2MpLQgXSP18LEcXxQliR6AyQRQCJLWEEtDggVNTKgllCXFTluV5fkkSFX97xkEs6LQbVSHIQQUFpKlelAjyWK8tkJSlGU5V6BUymIsLMAiqKmAiKhLWAKgogYpVIm4NJ5lbUSSAQIIdD0KADAvXtwwHKMY0waQMiIak5xSWqMkQa0wEEDhetXdctx3O08loegYF8BB+GySlAlIZRVACIhSAobwVoUZdZtAnc9wPI8TF8bIIjAXbVDgQxZEUcxoEwGkHMtAFMCgDJpE+77HNNWqOD-GJZGsMwmJkaQmHsW05CY5xnrUIgQctMGn2GdHgdpRy-oBmA8bgaxnBMUxqscJjNwkQtcEDYAIAQetY3O+bd33Q9gAkntdT7CNB3NXrrD-DrBa6yMh2jWM4ESBIgA as a reference
const uciOptionLookupByName: Record<OptionsThatCanBeSetOnUci, string> = {
  [Options.PONDER]: "Ponder",
  [Options.OWN_BOOK]: "OwnBook",
  [Options.MULTI_PV]: "MultiPV",
  [Options.SHOW_CURRENT_LINE]: "UCI_ShowCurrLine",
  [Options.SHOW_REFUTATIONS]: "UCI_ShowRefutations",
  [Options.LIMIT_STRENGTH]: "UCI_LimitStrength",
  [Options.ELO]: "UCI_Elo",
  [Options.ANALYZE_MODE]: "UCI_AnalyseMode",
  [Options.USE_LICHESS_OPENING_BOOK]: "UseLichessOpeningBook",
  [Options.USE_LICHESS_TABLEBASE]: "UseLichessTablebase",
};

const flippedUciOptionLookup = Object.fromEntries(
  entriesOfObject(uciOptionLookupByName).map(
    <T, U>([originalFirst, originalSecond]: [T, U]): [U, T] => [
      originalSecond,
      originalFirst,
    ]
  )
);

function getUciOptionFromName(
  name: string
): OptionsThatCanBeSetOnUci | undefined {
  return flippedUciOptionLookup[name];
}

function parseCliArgTokens(rawArgs: readonly string[]): CliArgToken[] {
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
  for (const [argument, triggers] of entriesOfObject<
    `${OptionsThatCanBeSetOnCli}`,
    string[]
  >(optionCliTriggers)) {
    if (triggers.includes(flag)) {
      logTrace("Found raw flag in triggers of argument", argument);
      return +argument as typeof argument extends `${infer T extends number}`
        ? T
        : never;
    }
  }
  logWarning(undefined, "Raw flag", flag, "isn't parsable");
}

interface IOptions {
  readonly printVersionAndExit: boolean;
  readonly printHelpAndExit: boolean;
  debugMode: boolean;
  canPonder: boolean;
  useOwnBook: boolean;
  maxBestLines: number;
  showCurrentLineWhenCalculating: boolean;
  showRefutationsWhenCalculating: boolean;
  limitEngineStrength: boolean;
  engineLimitElo: number;
  analyzingGame: boolean;
  useLichessOpeningBook: boolean;
  useLichessTablebase: boolean;
}

class OptionsClass implements IOptions {
  private initialized = false;

  private [Options.VERSION] = false;
  private [Options.HELP] = false;
  private [Options.DEBUG] = false;
  // TODO: check these defaults
  private [Options.PONDER] = false;
  private [Options.OWN_BOOK] = true;
  private [Options.MULTI_PV] = 1;
  private [Options.SHOW_CURRENT_LINE] = false;
  private [Options.SHOW_REFUTATIONS] = false;
  private [Options.LIMIT_STRENGTH] = false;
  // positive infinity implies no limit
  private [Options.ELO]: number = Number.POSITIVE_INFINITY;
  private [Options.ANALYZE_MODE] = false;
  private [Options.USE_LICHESS_OPENING_BOOK] = true;
  private [Options.USE_LICHESS_TABLEBASE] = true;

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
    logInfo("Turning debug mode", value ? "on" : "off");
    this[Options.DEBUG] = value;
  }

  public get canPonder(): boolean {
    return this[Options.PONDER];
  }
  public set canPonder(value: boolean) {
    logInfo("Setting pondering to", value);
    this[Options.PONDER] = value;
  }

  public get useOwnBook(): boolean {
    return this[Options.OWN_BOOK];
  }
  public set useOwnBook(value: boolean) {
    logInfo("Setting use own book to", value);
    this[Options.OWN_BOOK] = value;
  }

  public get maxBestLines(): number {
    return this[Options.MULTI_PV];
  }
  public set maxBestLines(value: number) {
    logInfo("Setting max best lines to", value);
    // TODO: set a min and max?
    this[Options.MULTI_PV] = value;
  }

  public get showCurrentLineWhenCalculating(): boolean {
    return this[Options.SHOW_CURRENT_LINE];
  }
  public set showCurrentLineWhenCalculating(value: boolean) {
    logInfo("Setting show current line when calculating to", value);
    this[Options.SHOW_CURRENT_LINE] = value;
  }

  public get showRefutationsWhenCalculating(): boolean {
    return this[Options.SHOW_REFUTATIONS];
  }
  public set showRefutationsWhenCalculating(value: boolean) {
    logInfo("Setting show refutations when calculating to", value);
    this[Options.SHOW_REFUTATIONS] = value;
  }

  public get limitEngineStrength(): boolean {
    return this[Options.LIMIT_STRENGTH];
  }
  public set limitEngineStrength(value: boolean) {
    logInfo("Setting limit engine strength to", value);
    this[Options.LIMIT_STRENGTH] = value;
  }

  public get engineLimitElo(): number {
    return this[Options.ELO];
  }
  public set engineLimitElo(value: number) {
    logInfo("Setting engine limit elo to", value);
    this[Options.ELO] = value;
  }

  public get analyzingGame(): boolean {
    return this[Options.ANALYZE_MODE];
  }
  public set analyzingGame(value: boolean) {
    logInfo("Turning analysis mode", value ? "on" : "off");
    this[Options.ANALYZE_MODE] = value;
  }

  public get useLichessOpeningBook(): boolean {
    return this[Options.USE_LICHESS_OPENING_BOOK];
  }
  public set useLichessOpeningBook(value: boolean) {
    logInfo("Setting use lichess opening book to", value);
    this[Options.USE_LICHESS_OPENING_BOOK] = value;
  }

  public get useLichessTablebase(): boolean {
    return this[Options.USE_LICHESS_TABLEBASE];
  }
  public set useLichessTablebase(value: boolean) {
    logInfo("Setting use lichess tablebase to", value);
    this[Options.USE_LICHESS_TABLEBASE] = value;
  }

  public initializeFromCliArgs(): void {
    if (this.initialized) return;

    const argTokens: CliArgToken[] = parseCliArgTokens(processArgv.slice(2));

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
      }
    }

    logTrace("Arg token processing completed");
  }
}

const programOptions = new OptionsClass();

function logVersion(): void {
  outputToConsole(`Engine v${version}`);
}

function logHelp(): void {
  const newLine = "\n";

  const message: string = entriesOfObject(optionCliTriggers)
    .reduce<string>((acc, [arg, triggers]) => {
      const description: string = cliOptionDescriptions[arg];

      return acc + `  ${triggers.join(", ")}: ${description}${newLine}`;
    }, "Usage: engine [options]" + newLine + "Options:" + newLine)
    .trim();

  logVersion();
  outputToConsole(message);
}

export { programOptions, getUciOptionFromName, logHelp, logVersion };
