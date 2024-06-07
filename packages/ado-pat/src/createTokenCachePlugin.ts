import {
  DataProtectionScope,
  PersistenceCreator,
  PersistenceCachePlugin,
} from "@azure/msal-node-extensions";

import os from "os";
import path from "path";

// See https://www.npmjs.com/package/@azure/msal-node-extensions#usage---cache-persistence
export async function createTokenCachePlugin() {
  const homeDir = os.homedir();
  const accountName = os.userInfo().username;
  const cachePath = path.join(homeDir, ".ado-pat-entra.json");

  const persistenceConfiguration = {
    cachePath,
    dataProtectionScope: DataProtectionScope.CurrentUser,
    serviceName: "ado-pat-entra",
    accountName,
    usePlaintextFileOnLinux: false,
  };

  const persistence = await PersistenceCreator.createPersistence(
    persistenceConfiguration
  );

  return new PersistenceCachePlugin(persistence);
}
