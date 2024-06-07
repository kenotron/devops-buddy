export function tryGetValue<T extends Object, K extends keyof T>(
  obj: T,
  key: K
): T[K] | undefined;

export function tryGetValue<
  T extends Object,
  K extends keyof T,
  TDefaultValue extends T[K]
>(obj: T, key: K, defaultValue: TDefaultValue): T[K];

export function tryGetValue<
  T extends Object,
  K extends keyof T,
  TDefaultValue extends T[K] | undefined
>(obj: T, key: K, defaultValue?: TDefaultValue): T[K] | undefined {
  if (key in obj && obj.hasOwnProperty(key)) {
    return obj[key];
  }

  return defaultValue ?? undefined;
}
