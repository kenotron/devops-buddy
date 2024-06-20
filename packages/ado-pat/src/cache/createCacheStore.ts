import os from "os";
import path from "path";

import { type ICacheStore } from "./ICacheStore";

export function createCacheStore(): ICacheStore {
  const homeDir = os.homedir();
  const accountName = os.userInfo().username;
  const cacheName = "ado-pats";
  const cachePath = path.join(homeDir, `ado-pat`, ".pats.json");

  if (process.platform === "win32") {
    const { WindowsCacheStore } = require("./WindowsCacheStore");
    return new WindowsCacheStore(cachePath, "CurrentUser", null);
  } else {
    const { KeyringCacheStore } = require("./KeyringCacheStore");
    return new KeyringCacheStore(cacheName, accountName);
  }
}
