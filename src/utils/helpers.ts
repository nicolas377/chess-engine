import { exit as rawProcessExit } from "node:process";
import { runTeardownCallbacks } from "utils";

export function splitStringOverWhitespace(str: string): string[] {
  return str.trim().split(/\s+/g);
}

export function keysOfObject<T extends PropertyKey>(
  obj: Record<T, unknown>
): T[] {
  return Object.keys(obj) as T[];
}

export function entriesOfObject<T extends PropertyKey, U>(
  obj: Record<T, U>
): [T, U][] {
  return Object.entries(obj) as [T, U][];
}

export function objectHasProperty<RecordKeys extends PropertyKey>(
  record: Readonly<Record<RecordKeys, unknown>>,
  key: PropertyKey
): key is RecordKeys {
  return Object.prototype.hasOwnProperty.call(record, key);
}

// implementation of Array#at(), based on the polyfill in the proposal.
export function arrayAtIndex<T>(
  arr: readonly T[],
  targetIndex: number
): T | undefined {
  const { length: arrLength } = arr;

  targetIndex = Math.floor(targetIndex);
  // Allow negative indexing from the end.
  if (targetIndex < 0) targetIndex += arrLength;
  // Return undefined on OOB access.
  if (targetIndex < 0 || targetIndex >= arrLength) return undefined;
  // Otherwise, this is just normal property access.
  return arr[targetIndex];
}

// just a type narrowing wrapper over Array#includes
export function arrayIncludesValue<T>(
  arr: readonly T[],
  value: unknown
): value is T {
  return arr.includes(value as T);
}

export function exitProcess(code?: number): never {
  runTeardownCallbacks();
  rawProcessExit(code);
}
