import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import ini from "ini";
import { IFeedInfo } from "./types/IFeedInfo";
import { tryGetValue } from "./try-get-value";
import { generateFeedInfo } from "./generate-feed-info";
import { IPackageManagerConfiguration } from "./types/IPackageManagerConfiguration";

export interface NpmRcOptions {
  root: string;
}

interface INpmRcConfig {
  registry?: string;
  [key: `@${string}:registry`]: string;
  [key: `//${string}/:_authToken`]: string;
  [key: `//${string}/:username`]: string;
  [key: `//${string}/:email`]: string;
  [key: `//${string}/:_password`]: string;
}

export class NpmRc implements IPackageManagerConfiguration {
  projectConfigFile: string | null;
  globalConfigFile: string;

  constructor(options: NpmRcOptions) {
    this.globalConfigFile = path.join(os.homedir(), ".npmrc");
    this.projectConfigFile = this.findProjectConfigFile(options.root);
  }

  findProjectConfigFile(cwd: string) {
    let current = cwd;
    while (current !== "/") {
      const npmrcFile = path.join(current, ".npmrc");
      if (fs.existsSync(npmrcFile)) {
        return npmrcFile;
      }
      current = path.dirname(current);
    }

    return null;
  }

  #loadProjectConfig() {
    if (!this.projectConfigFile || !fs.existsSync(this.projectConfigFile)) {
      return {};
    }

    const contents = fs.readFileSync(this.projectConfigFile, "utf8");
    const config: INpmRcConfig = ini.parse(contents) ?? {};

    return config;
  }

  loadGlobalConfig() {
    if (!this.globalConfigFile || !fs.existsSync(this.globalConfigFile)) {
      return {};
    }

    const contents = fs.readFileSync(this.globalConfigFile, "utf8");
    const config: INpmRcConfig = ini.parse(contents) ?? {};

    return config;
  }

  updateGlobalConfigWithFeeds(feeds: IFeedInfo[]) {
    let globalConfig = (() => {
      if (fs.existsSync(this.globalConfigFile)) {
        return this.loadGlobalConfig();
      } else {
        return {};
      }
    })();

    for (const feed of feeds) {
      const url =
        feed.style === "visualstudio.com"
          ? `//${feed.organization}.pkgs.visualstudio.com/_packaging/${feed.feed}/npm/`
          : `//pkgs.dev.azure.com/${feed.organization}/_packaging/${feed.feed}/npm/`;

      const encodedPat = Buffer.from(feed.pat!).toString("base64");

      const noPostfix = {
        [`${url}:username`]: feed.organization,
        [`${url}:_password`]: encodedPat,
        [`${url}:_email`]:
          "npm requires email to be set but doesn't use the value",
      };

      const withPostfix = {
        [`${url}registry/:username`]: feed.organization,
        [`${url}registry/:_password`]: encodedPat,
        [`${url}registry/:_email`]:
          "npm requires email to be set but doesn't use the value",
      };

      globalConfig = { ...globalConfig, ...noPostfix, ...withPostfix };
    }

    const outputString = ini.stringify(Object.assign({}, globalConfig));

    fs.writeFileSync(this.globalConfigFile, outputString);
  }

  getFeedInfo(): IFeedInfo[] {
    const projectConfig = this.#loadProjectConfig();
    const servers: string[] = [];

    for (const [key, value] of Object.entries(projectConfig)) {
      if (key === "registry") {
        servers.push(value);
      } else if (key.startsWith("@") && key.endsWith(":registry")) {
        servers.push(value);
      }
    }

    return generateFeedInfo(servers);
  }
}
