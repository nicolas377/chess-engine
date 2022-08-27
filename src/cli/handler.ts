import { UciCommandType, UciInputCommand } from "types";
import { logInfo } from "utils";

// pick only input commands that have the specified type T
type PickTypeFromUciCommands<
  T extends UciCommandType,
  U extends UciInputCommand = UciInputCommand
> = U extends { type: T } ? U : never;

// remove input commands that have the specified type T
type RemoveTypeFromUciCommands<
  T extends UciCommandType,
  U extends UciInputCommand = UciInputCommand
> = U extends { type: T } ? never : U;

function handleUciCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.UCI>
): void {
  logInfo("Received UCI command:", uciCommand);
}

function handleDebugCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.DEBUG>
): void {
  logInfo("Received debug command:", uciCommand);
}

function handleIsReadyCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.IS_READY>
): void {
  logInfo("Received is ready command:", uciCommand);
}

function handleSetOptionCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.SET_OPTION>
): void {
  logInfo("Received set option command:", uciCommand);
}

function handleRegisterCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.REGISTER>
): void {
  logInfo("Received register command:", uciCommand);
}

function handleUciNewGameCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.UCI_NEW_GAME>
): void {
  logInfo("Received UCI new game command:", uciCommand);
}

function handleSetPositionCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.SET_POSITION>
): void {
  logInfo("Received set position command:", uciCommand);
}

function handleGoCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.GO>
): void {
  logInfo("Received go command:", uciCommand);
}

function handleStopCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.STOP>
): void {
  logInfo("Received stop command:", uciCommand);
}

function handlePonderHitCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.PONDER_HIT>
): void {
  logInfo("Received ponder hit command:", uciCommand);
}

function handleExitCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.EXIT>
): void {
  logInfo("Received exit command:", uciCommand);
}

export function handleUciInput(
  uciInput: RemoveTypeFromUciCommands<UciCommandType.UNKNOWN>
): void {
  switch (uciInput.type) {
    case UciCommandType.UCI:
      handleUciCommand(uciInput);
      break;
    case UciCommandType.DEBUG:
      handleDebugCommand(uciInput);
      break;
    case UciCommandType.IS_READY:
      handleIsReadyCommand(uciInput);
      break;
    case UciCommandType.SET_OPTION:
      handleSetOptionCommand(uciInput);
      break;
    case UciCommandType.REGISTER:
      handleRegisterCommand(uciInput);
      break;
    case UciCommandType.UCI_NEW_GAME:
      handleUciNewGameCommand(uciInput);
      break;
    case UciCommandType.SET_POSITION:
      handleSetPositionCommand(uciInput);
      break;
    case UciCommandType.GO:
      handleGoCommand(uciInput);
      break;
    case UciCommandType.STOP:
      handleStopCommand(uciInput);
      break;
    case UciCommandType.PONDER_HIT:
      handlePonderHitCommand(uciInput);
      break;
    case UciCommandType.EXIT:
      handleExitCommand(uciInput);
      break;
  }
}
