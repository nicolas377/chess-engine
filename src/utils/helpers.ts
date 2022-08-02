import { exit as RawProcessExit } from "node:process";
import { runTeardownCallbacks } from "./teardown";

export function StringSplitOverWhiteSpace(str: string): string[] {
  return str.trim().split(/\s+/g);
}

export function ObjectKeys<T extends PropertyKey>(
  obj: Record<T, unknown>
): T[] {
  return Object.keys(obj) as T[];
}

export function ObjectEntries<T extends PropertyKey, U>(
  obj: Record<T, U>
): [T, U][] {
  return Object.entries(obj) as [T, U][];
}

export function ObjectHasOwn<RecordKeys extends PropertyKey>(
  record: Readonly<Record<RecordKeys, unknown>>,
  key: PropertyKey
): key is RecordKeys {
  return Object.prototype.hasOwnProperty.call(record, key);
}

export function ArrayAt<T>(
  arr: readonly T[],
  targetIndex: number
): T | undefined {
  const { length: arrLength } = arr;
  const { trunc: ToInteger } = Math;

  targetIndex = ToInteger(targetIndex);
  // Allow negative indexing from the end
  if (targetIndex < 0) targetIndex += arrLength;
  // OOB access is guaranteed to return undefined
  if (targetIndex < 0 || targetIndex >= arrLength) return undefined;
  // Otherwise, this is just normal property access
  return arr[targetIndex];
}

// just a type narrowing wrapper over Array#includes
export function ArrayIncludes<T>(
  arr: readonly T[],
  value: unknown
): value is T {
  return arr.includes(value as T);
}

export function ExitProcess(code?: number): never {
  runTeardownCallbacks();
  RawProcessExit(code);
}
