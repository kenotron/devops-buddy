import os from "os";
import path from "path";
import { KeyringCacheStore } from "./cache/KeyringCacheStore";
import { WindowsCacheStore } from "./cache/WindowsCacheStore";

export async function createTokenCachePlugin() {
  const homeDir = os.homedir();
  const accountName = os.userInfo().username;
  const cacheName = "entra-tokens";
  const cachePath = path.join(homeDir, `ado-pat`, ".entra-tokens.json");

  if (process.platform === "win32") {
    return new WindowsCacheStore(cachePath, "CurrentUser", null);
  } else {
    return new KeyringCacheStore(cacheName, accountName);
  }
}
