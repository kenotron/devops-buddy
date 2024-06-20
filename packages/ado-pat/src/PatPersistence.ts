import { Entry } from "@napi-rs/keyring";

import os from "os";
import path from "path";
import { PatToken } from "./PatToken";
import { ICacheStore } from "./cache/ICacheStore";
import { WindowsCacheStore } from "./cache/WindowsCacheStore";
import { KeyringCacheStore } from "./cache/KeyringCacheStore";

class PatPersistence {
  persistence: ICacheStore | null = null;
  homeDir = os.homedir();
  accountName = os.userInfo().username;
  cachePath = path.join(this.homeDir, ".ado-pat.json");

  constructor(private displayName: string) {}

  async initialize() {
    if (!this.persistence) {
      const homeDir = os.homedir();
      const accountName = os.userInfo().username;
      const cacheName = "ado-pats";
      const cachePath = path.join(homeDir, `ado-pat`, ".pats.json");

      if (process.platform === "win32") {
        return new WindowsCacheStore(cachePath, "CurrentUser", null);
      } else {
        return new KeyringCacheStore(cacheName, accountName);
      }
    }
  }

  async add(organization: string, pat: PatToken) {
    if (!this.persistence) {
      throw new Error("Persistence not initialized");
    }

    // save the PAT on create
    const savedPatsString = await this.persistence.get();
    const savedPats = savedPatsString ? JSON.parse(savedPatsString) : {};
    savedPats[organization] = savedPats[organization] || [];
    savedPats[organization].push(pat);
    return await this.persistence.set(JSON.stringify(savedPats));
  }

  async list(organization: string) {
    if (!this.persistence) {
      throw new Error("Persistence not initialized");
    }

    const savedPatsString = await this.persistence.get();

    if (!savedPatsString) {
      return [];
    }

    const savedPats = savedPatsString ? JSON.parse(savedPatsString) : {};

    if (!savedPats[organization]) {
      return [];
    }

    return savedPats[organization].filter((pat: PatToken) => {
      // only return active PATs
      return new Date(pat.validTo) > new Date();
    });
  }

  async get(organization: string) {
    if (!this.persistence) {
      throw new Error("Persistence not initialized");
    }

    const pats = (await this.list(organization)).filter(
      (pat: PatToken) => pat.displayName === this.displayName
    );

    if (pats.length > 0) {
      return pats[0];
    }

    return null;
  }
}

let persistence: PatPersistence | null = null;

export function createPatPersistence(displayName: string) {
  if (!persistence) {
    persistence = new PatPersistence(displayName);
  }

  return persistence;
}
