import electron from "electron";
import { spawnSync } from "child_process";
import path from "path";

/**
 * Interactively (with electron) to authorize app
 */
export default function authorizeApp() {
  const electronResults = spawnSync(electron.toString(), [
    path.join(__dirname, "app.js")
  ]);

  return JSON.parse(electronResults.stdout.toString());
}
