import { ICacheStore } from "./ICacheStore";
import { Entry } from "@napi-rs/keyring";

export class KeyringCacheStore implements ICacheStore {
  #entry: Entry;

  constructor(private name: string, private username: string) {
    this.#entry = new Entry(name, username);
  }

  public set(value: string) {
    this.#entry.setPassword(value);
  }

  public get(): string | null {
    return this.#entry.getPassword();
  }
}
