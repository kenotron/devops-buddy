import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import yaml from "js-yaml";

export interface YarnRcOptions {
  root: string;
}

export class YarnRc {
  projectConfigFile: string | null;
  globalConfigFile: string;

  constructor(private options: YarnRcOptions) {
    this.globalConfigFile = path.join(os.homedir(), ".yarnrc.yml");
    this.projectConfigFile = this.findProjectConfigFile(options.root);
  }

  findProjectConfigFile(cwd: string) {
    let current = cwd;
    while (current !== "/") {
      const yarnrcYml = path.join(current, ".yarnrc.yml");
      if (fs.existsSync(yarnrcYml)) {
        return yarnrcYml;
      }

      const yarnrcYaml = path.join(current, ".yarnrc.yaml");
      if (fs.existsSync(yarnrcYaml)) {
        return yarnrcYaml;
      }

      current = path.dirname(current);
    }

    return null;
  }

  loadProjectConfig() {
    if (!this.projectConfigFile) {
      return {};
    }

    const contents = fs.readFileSync(this.projectConfigFile, "utf8");
    const projectConfig = yaml.load(contents) ?? {};
    return projectConfig;
  }

  ensureGlobalConfig() {
    const userAuthFileExists = fs.existsSync(this.globalConfigFile);
    if (!userAuthFileExists) {
      fs.writeFileSync(this.globalConfigFile, "");
    }
  }

  loadGlobalConfig() {
    const contents = fs.readFileSync(this.globalConfigFile, "utf8");
    const globalConfig = yaml.load(contents) ?? {};
    return globalConfig;
  }
}
