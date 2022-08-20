import { ProcessFlags } from "types";

let processFlags: ProcessFlags = ProcessFlags.STARTUP;

export function getProcessFlags(): ProcessFlags {
  return processFlags;
}

export function setProcessFlags(flags: ProcessFlags): void {
  processFlags = flags;
}
