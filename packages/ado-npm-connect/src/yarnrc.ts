import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import yaml from "js-yaml";
import { IFeedInfo } from "./types/IFeedInfo";
import { tryGetValue } from "./try-get-value";
import { generateFeedInfo } from "./generate-feed-info";
import { IPackageManagerConfiguration } from "./types/IPackageManagerConfiguration";

export interface YarnRcOptions {
  root: string;
}

interface IYarnRcConfig {
  npmRegistryServer?: string;
  npmRegistries?: Record<string, string>;
}

export class YarnRc implements IPackageManagerConfiguration {
  projectConfigFile: string | null;
  globalConfigFile: string;

  constructor(options: YarnRcOptions) {
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

  #loadProjectConfig() {
    if (!this.projectConfigFile || !fs.existsSync(this.projectConfigFile)) {
      return {};
    }

    const contents = fs.readFileSync(this.projectConfigFile, "utf8");
    const projectConfig = (yaml.load(contents) as IYarnRcConfig) ?? {};
    return projectConfig;
  }

  loadGlobalConfig() {
    if (!this.globalConfigFile || !fs.existsSync(this.globalConfigFile)) {
      return {};
    }

    const contents = fs.readFileSync(this.globalConfigFile, "utf8");
    const globalConfig = (yaml.load(contents) as IYarnRcConfig) ?? {};
    return globalConfig;
  }

  updateGlobalConfigWithFeeds(feeds: IFeedInfo[]) {
    const globalConfig = (() => {
      if (fs.existsSync(this.globalConfigFile)) {
        const homeYamlContent = fs.readFileSync(this.globalConfigFile, "utf-8");
        return yaml.load(homeYamlContent) as any;
      } else {
        return { npmRegistries: {} };
      }
    })();

    const homeNpmRegistries = tryGetValue(globalConfig, "npmRegistries", {});

    for (const feed of feeds) {
      const url = `https:${feed.url}`;
      const urlWithPostfix = `${url}registry/`;

      homeNpmRegistries[url] = {
        npmAuthIdent: Buffer.from(`${feed.organization}:${feed.pat}`).toString(
          "base64"
        ),
        npmAlwaysAuth: true,
      };

      homeNpmRegistries[urlWithPostfix] = {
        npmAuthIdent: Buffer.from(`${feed.organization}:${feed.pat}`).toString(
          "base64"
        ),
        npmAlwaysAuth: true,
      };
    }

    const outputString = yaml.dump(
      Object.assign({}, globalConfig, { npmRegistries: homeNpmRegistries })
    );

    fs.writeFileSync(this.globalConfigFile, outputString);
  }

  getFeedInfo(): IFeedInfo[] {
    const projectConfig = this.#loadProjectConfig();

    const npmRegistryServer = tryGetValue(
      projectConfig,
      "npmRegistryServer",
      ""
    );
    const npmRegistries = tryGetValue(projectConfig, "npmRegistries", {});

    const servers = [
      ...(npmRegistryServer ? [npmRegistryServer] : []),
      ...(npmRegistries ? Object.keys(npmRegistries) : []),
    ];

    return generateFeedInfo(servers);
  }
}
