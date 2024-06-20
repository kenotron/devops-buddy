export interface ICacheStore {
  get(): string | null;
  set(value: string): void;
}
