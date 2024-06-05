import { acquireEntraIdToken, getPAT } from "ado-pat";
import { Command } from "commander";
import { logger } from "./logger";
import { flatMap, groupBy } from "lodash-es";
import path from "path";
import fs from "fs";
import os from "os";

import yaml from "js-yaml";

function tryGetValue<T extends Object>(
  obj: T,
  key: keyof T
): T[keyof T] | null {
  if (obj.hasOwnProperty(key)) {
    return obj[key];
  }

  return null;
}

function findYarnrcFile(cwd: string) {
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

async function main() {
  try {
    const program = new Command();
    program.option("-t, --tenant-id <tenant id>", "Azure AD tenant ID");
    program.action(action);

    await program.parseAsync(process.argv);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
}

interface Options {
  tenantId: string;
  organization: string;
  displayName: string;
}

async function action({ tenantId }: Options) {
  const displayName = "Yarn ADO auth tool";
  const tokenResponse = await acquireEntraIdToken({
    tenantId,
  });

  if (!tokenResponse) {
    logger.error("Failed to acquire token");
    process.exit(1);
  }

  const projectYarnrc = findYarnrcFile(process.cwd());

  if (!projectYarnrc) {
    logger.error("No .yarnrc.yml file found");
    process.exit(1);
  }

  const content = fs.readFileSync(projectYarnrc, "utf-8");
  const config = yaml.load(content, { json: true }) as any;

  const npmRegistryServer = tryGetValue(config, "npmRegistryServer") ?? "";
  const npmRegistries = tryGetValue(config, "npmRegistries") ?? {};

  const servers = [
    ...(npmRegistryServer ? [npmRegistryServer] : []),
    ...Object.keys(npmRegistries),
  ];

  const orgPattern = "[A-Za-z0-9][A-Za-z0-9-]{0,48}[A-Za-z0-9]";
  const feedPattern = "[A-Za-z0-9][A-Za-z0-9-]{0,63}[A-Za-z0-9]";
  type FeedInfo = {
    organization: string;
    feed: string;
    style: "visualstudio.com" | "dev.azure.com";
    pat: string;
  };
  const orgFeeds = servers
    .map((server) => {
      let groups: FeedInfo = {
        organization: "",
        feed: "",
        style: "visualstudio.com",
        pat: "",
      };

      if (server.includes(".pkgs.visualstudio.com")) {
        groups = server.match(
          `(?<organization>${orgPattern})\.pkgs\.visualstudio\.com/_packaging/(?<feed>${feedPattern})/`
        )?.groups as unknown as FeedInfo;
        groups.style = "visualstudio.com";
      }

      if (server.includes("pkgs.dev.azure.com")) {
        groups = server.match(
          `pkgs\.dev\.azure\.com/(?<organization>${orgPattern})/_packaging/(?<feed>${feedPattern})/`
        )?.groups as unknown as FeedInfo;
        groups.style = "dev.azure.com";
      }

      if (groups) {
        return {
          organization: groups.organization,
          feed: groups.feed,
          pat: "",
          style: groups.style,
        };
      }

      return null;
    })
    .filter((n) => n !== null) as FeedInfo[];

  const feedsByOrg = groupBy(orgFeeds, "organization");

  for (const org of Object.keys(feedsByOrg)) {
    const feeds = feedsByOrg[org];
    const response = await getPAT({
      organization: org,
      scope: "vso.packaging_write",
      displayName,
      token: tokenResponse.accessToken,
    });

    for (const feed of feeds) {
      feed.pat = response.patToken.token;
    }
  }

  const feeds = flatMap(feedsByOrg);
  const homeYaml = path.join(os.homedir(), "/.yarnrc.yml");

  const homeConfig = (() => {
    if (fs.existsSync(homeYaml)) {
      const homeYamlContent = fs.readFileSync(homeYaml, "utf-8");
      return yaml.load(homeYamlContent) as any;
    } else {
      return { npmRegistries: {} };
    }
  })();

  const homeNpmRegistries = tryGetValue(homeConfig, "npmRegistries") ?? {};

  for (const feed of feeds) {
    const url =
      feed.style === "visualstudio.com"
        ? `https://${feed.organization}.pkgs.visualstudio.com/_packaging/${feed.feed}/npm/registry/`
        : `https://pkgs.dev.azure.com/${feed.organization}/_packaging/${feed.feed}/npm/registry/`;
    homeNpmRegistries[url] = {
      npmAuthIdent: Buffer.from(`${feed.organization}:${feed.pat}`).toString(
        "base64"
      ),
      npmAlwaysAuth: true,
    };
  }

  const outputString = yaml.dump(
    Object.assign({}, homeConfig, { npmRegistries: homeNpmRegistries }),
  );
  fs.writeFileSync(homeYaml, outputString);
}

main();
