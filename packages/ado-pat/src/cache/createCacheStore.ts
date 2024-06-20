import os from "os";
import path from "path";
import { WindowsCacheStore } from "./WindowsCacheStore";
import { KeyringCacheStore } from "./KeyringCacheStore";

export function createCacheStore() {
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
