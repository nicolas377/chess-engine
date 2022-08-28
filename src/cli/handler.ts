import { engineIsInState, EngineState } from "state";
import { UciCommandType, UciInputCommand } from "types";
import { logInfo, outputToConsole, programOptions } from "utils";

// pick only input commands that have the specified type T
type PickTypeFromUciCommands<T extends UciCommandType> = Extract<
  UciInputCommand,
  { type: T }
>;

// remove input commands that have the specified type T
type RemoveTypeFromUciCommands<T extends UciCommandType> = Exclude<
  UciInputCommand,
  { type: T }
>;

function handleUciCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.UCI>
): void {
  logInfo("Received UCI command:", uciCommand);
}

function handleDebugCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.DEBUG>
): void {
  logInfo("Received debug command:", uciCommand);

  if (programOptions.debugMode === uciCommand.on) {
    logInfo(
      "Debug mode is already",
      `${uciCommand.on ? "on" : "off"}.`,
      "No action will be taken"
    );
    return;
  }

  logInfo("Setting debug mode to", uciCommand.on ? "on" : "off");
  programOptions.debugMode = uciCommand.on;
}

function handleIsReadyCommand(
  uciCommand: PickTypeFromUciCommands<UciCommandType.IS_READY>
): void {
  const isReadyCheck = (): boolean => {
    logInfo("Checking if the engine is ready");

    if (engineIsInState(EngineState.READY)) {
      logInfo("The engine is ready");
      return true;
    } else {
      logInfo("The engine is not ready");
      return false;
    }
  };
  const sendReadyResponse = (): void => {
    logInfo("Sending ready response");
    outputToConsole(`readyok`);
  };

  logInfo("Received is ready command:", uciCommand);

  if (isReadyCheck()) {
    sendReadyResponse();
    return;
  }

  const timer = setInterval((): void => {
    if (isReadyCheck()) {
      clearInterval(timer);
      sendReadyResponse();
    }
  }, 10);
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
