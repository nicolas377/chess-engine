import { MessagePort } from "node:worker_threads";
import { OptionString } from "utils";
import { Messages } from "workerController";

export interface WorkerMessagePort extends MessagePort {
  postMessage(message: Messages): void;
  on(event: "close", listener: () => void): this;
  on(event: "message", listener: (message: Messages) => void): this;
  on(event: "messageerror", listener: (error: Error) => void): this;
}

export interface WorkerData {
  messagePort: WorkerMessagePort;
  serializedOptions: OptionString;
}

declare module "node:worker_threads" {
  import { Worker as _Worker } from "worker_threads";

  const workerData: WorkerData | undefined;

  class Worker extends _Worker {
    constructor(filename: string, options: { workerData: WorkerData });
  }
}
