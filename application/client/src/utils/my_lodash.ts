export function zipWith<T, U, V>(
  arr1: T[],
  arr2: U[],
  fn: (a: T, b: U) => V,
): V[] {
  const length = Math.min(arr1.length, arr2.length);
  const result: V[] = [];
  for (let i = 0; i < length; i++) {
    result.push(fn(arr1[i] as T, arr2[i] as U));
  }
  return result;
}

export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function zip<T, U>(arr1: T[], arr2: U[]): [T, U][] {
  const length = Math.min(arr1.length, arr2.length);
  const result: [T, U][] = [];
  for (let i = 0; i < length; i++) {
    result.push([arr1[i] as T, arr2[i] as U]);
  }
  return result;
}

export function sum(array: number[]): number {
  return array.reduce((acc, val) => acc + val, 0);
}

export function mean(array: number[]): number {
  if (array.length === 0) return 0;
  return sum(array) / array.length;
}

export function round(n: number, precision: number = 0): number {
  const factor = Math.pow(10, precision);
  return Math.round(n * factor) / factor;
}

export function max(array: number[]): number | undefined {
  if (array.length === 0) return undefined;
  return Math.max(...array);
}
