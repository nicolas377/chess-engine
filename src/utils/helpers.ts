export function StringSplitOverWhiteSpace(str: string): string[] {
  return str.trim().split(/\s+/g);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ObjectKeys<T extends keyof any>(obj: Record<T, unknown>): T[] {
  return Object.keys(obj) as T[];
}

export function ObjectHasOwn<RecordKeys extends string>(
  record: Readonly<Record<RecordKeys, unknown>>,
  key: string
): key is RecordKeys {
  return Object.prototype.hasOwnProperty.call(record, key);
}

export function ArrayAt<T>(arr: readonly T[], index: number): T | undefined {
  const { length: arrLength } = arr;

  // ToInteger() abstract op
  index = Math.trunc(index);
  // Allow negative indexing from the end
  if (index < 0) index += arrLength;
  // OOB access is guaranteed to return undefined
  if (index < 0 || index >= arrLength) return undefined;
  // Otherwise, this is just normal property access
  return arr[index];
}
