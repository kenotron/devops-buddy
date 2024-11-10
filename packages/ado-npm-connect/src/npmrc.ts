import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import ini from "ini";
import { IFeedInfo } from "./types/IFeedInfo";
import { generateFeedInfo } from "./generate-feed-info";
import { IPackageManagerConfiguration } from "./types/IPackageManagerConfiguration";
import { logger } from "./logger";

const MARKER = "; ----- ado-npm-connect ";

export interface NpmRcOptions {
  root: string;
}

interface INpmRcConfig {
  [key: string]: any;
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
    logger.info(`Project root: ${current}/.npmrc`);
    return path.resolve(current, ".npmrc");
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
    let globalConfigString = fs.readFileSync(this.globalConfigFile, "utf-8");

    for (const feed of feeds) {
      const url = feed.url;
      const marker = `${MARKER}${url}`;

      const encodedPat = Buffer.from(feed.pat!).toString("base64");

      const noPostfix = {
        [`${url}:username`]: feed.organization,
        [`${url}:_password`]: encodedPat,
        [`${url}:email`]:
          "npm requires email to be set but never uses the value",
      };

      const withPostfix = {
        [`${url}registry/:username`]: feed.organization,
        [`${url}registry/:_password`]: encodedPat,
        [`${url}registry/:email`]:
          "npm requires email to be set but never uses the value",
      };

      if (!globalConfigString.includes(marker)) {
        globalConfigString += `${marker}\n${ini.stringify({
          ...noPostfix,
          ...withPostfix,
        }).trimEnd()}\n${marker}`;
      } else {
        // get rid of existing entries denoted between two "marker" comments, could be over multiple lines
        globalConfigString = globalConfigString.replace(
          new RegExp(`${marker}.*${marker}`, "s"),
          `${marker}\n${ini.stringify({
            ...noPostfix,
            ...withPostfix,
          }).trimEnd()}\n${marker}`
        );
      }
    }

    fs.writeFileSync(this.globalConfigFile, globalConfigString);

    logger.info(
      `Updated global npmrc file at ${
        this.globalConfigFile
      } with these feeds: ${feeds.map((f) => f.feed).join(", ")}`
    );
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
