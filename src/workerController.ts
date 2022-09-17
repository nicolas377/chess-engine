import {
  isMainThread,
  MessageChannel,
  Worker,
  workerData,
} from "node:worker_threads";
import {
  addTeardownCallback,
  BooleanOptions,
  DebugLog,
  NumericOptions,
  programOptions,
  pushLog,
} from "utils";
import { WorkerMessagePort } from "workerThreads";

// type hinting messaging lives here:

const enum MessageType {
  ACKNOWLEDGEMENT,
  DEBUG_LOG,
  OPTION_SET,
  OPTION_READ,
  OPTION_READ_RESPONSE,
}

type Messages =
  | { type: MessageType.ACKNOWLEDGEMENT }
  | { type: MessageType.DEBUG_LOG; log: DebugLog }
  | { type: MessageType.OPTION_SET; option: BooleanOptions; value: boolean }
  | { type: MessageType.OPTION_SET; option: NumericOptions; value: number }
  | { type: MessageType.OPTION_READ; option: BooleanOptions | NumericOptions }
  | {
      type: MessageType.OPTION_READ_RESPONSE;
      option: BooleanOptions;
      value: boolean;
    }
  | {
      type: MessageType.OPTION_READ_RESPONSE;
      option: NumericOptions;
      value: number;
    };

type PickWorkerMessage<T extends MessageType> = Extract<Messages, { type: T }>;

export { PickWorkerMessage, Messages, MessageType };

// actual code starts here

// set to false if this is the worker
let calculatingThread: Worker | false | undefined = isMainThread
  ? undefined
  : false;
let messagePort: WorkerMessagePort | undefined = isMainThread
  ? undefined
  : // we're in the worker, so it's safe to use workerData
    workerData!.messagePort;

function initializeMessagePortListeners(): void {
  addMessageListener((message) => {
    switch (message.type) {
      case MessageType.ACKNOWLEDGEMENT:
        break;
      case MessageType.DEBUG_LOG:
        if (isMainThread) {
          pushLog(message.log);
          sendMessage(createAcknowledgementMessage());
        }
        break;
      case MessageType.OPTION_SET:
        if (isMainThread) {
          programOptions.setOption(message.option, message.value);
          sendMessage(createAcknowledgementMessage());
        }
        break;
      case MessageType.OPTION_READ:
        if (isMainThread) {
          sendMessage(
            createOptionReadResponseMessage(
              message.option,
              programOptions.getOption(message.option)
            )
          );
        }
        break;
    }
  });
}

export function addMessageListener(cb: (message: Messages) => void): boolean {
  if (messagePort === undefined) return false;

  messagePort.on("message", cb);
  return true;
}

export function createWorkerThread(): void {
  if (calculatingThread === false) return;

  const { port1 } = new MessageChannel();

  calculatingThread = new Worker(__dirname, {
    workerData: {
      messagePort: port1,
      serializedOptions: programOptions.createOptionString(),
    },
  });
  messagePort = port1;

  initializeMessagePortListeners();

  addTeardownCallback(() => (calculatingThread as Worker).terminate());
}

/**
 * @returns True if the message was sent successfully, false otherwise.
 */
export function sendMessage(message: Messages): boolean {
  // if the message port is undefined, then we are in the main thread, and the worker thread hasn't been created yet
  if (messagePort === undefined) return false;

  messagePort.postMessage(message);
  return true;
}

export function createAcknowledgementMessage(): PickWorkerMessage<MessageType.ACKNOWLEDGEMENT> {
  return { type: MessageType.ACKNOWLEDGEMENT };
}

export function createDebugLogMessage(
  log: DebugLog
): PickWorkerMessage<MessageType.DEBUG_LOG> {
  return { type: MessageType.DEBUG_LOG, log };
}

export function createOptionReadResponseMessage(
  option: BooleanOptions,
  value: boolean
): Extract<
  PickWorkerMessage<MessageType.OPTION_READ_RESPONSE>,
  { value: boolean }
>;
export function createOptionReadResponseMessage(
  option: NumericOptions,
  value: number
): Extract<
  PickWorkerMessage<MessageType.OPTION_READ_RESPONSE>,
  { value: number }
>;
export function createOptionReadResponseMessage(
  option: BooleanOptions | NumericOptions,
  value: boolean | number
): PickWorkerMessage<MessageType.OPTION_READ_RESPONSE>;
export function createOptionReadResponseMessage(
  option: BooleanOptions | NumericOptions,
  value: boolean | number
) {
  return {
    type: MessageType.OPTION_READ_RESPONSE,
    option,
    value,
  };
}
