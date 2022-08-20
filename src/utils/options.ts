// construct options initially from cli arguments, with defaults
// expose getters and setters for options

import { Arguments } from "types";

// debug mode logs to an output file and prints the location of that file on exit
type ArgumentsWithoutContext = Exclude<
  Arguments,
  Arguments.CONTEXT_VALUE | Arguments.LOG_LEVEL
>;

const optionCliTriggers: Record<ArgumentsWithoutContext, string[]> = {
  [Arguments.VERSION]: ["--version", "-v"],
  [Arguments.HELP]: ["--help", "-h"],
  [Arguments.DEBUG]: ["--debug"],
};

interface IOptions {
  printVersionAndExit: boolean;
  printHelpAndExit: boolean;
  debugMode: boolean;
}
