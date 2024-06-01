import { acquireEntraIdToken, getPAT } from "ado-pat";
import { Command } from "commander";
import { logger } from "./logger";
import { Configuration } from "@yarnpkg/core";
import { npath } from "@yarnpkg/fslib";
import NpmPlugin from "@yarnpkg/plugin-npm";
import { flatMap, groupBy } from "lodash-es";
import path from "path";
import fs from "fs";
import os from "os";

import yaml from "js-yaml";

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

  const root = await Configuration.findProjectCwd(
    npath.toPortablePath(process.cwd())
  );

  if (!root) {
    logger.error("No project found");
    process.exit(1);
  }

  const projectYarnrc = path.join(root, ".yarnrc.yml");
  const config = yaml.load(projectYarnrc) as any;

  const npmRegistryServer = config["npmRegistryServer"];
  const npmRegistries = config["npmRegistries"];

  const servers = [
    ...(npmRegistryServer ? [npmRegistryServer] : []),
    ...npmRegistries,
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
  const homeConfig = yaml.load(homeYaml) as any;
  const homeNpmRegistries = homeConfig["npmRegistries"] || [];

  for (const feed of feeds) {
    const url =
      feed.style === "visualstudio.com"
        ? `https://${feed.organization}.pkgs.visualstudio.com/_packaging/${feed.feed}/npm/registry/`
        : `https://pkgs.dev.azure.com/${feed.organization}/_packaging/${feed.feed}/npm/registry/`;
    homeNpmRegistries[url] = {
      npmAuthIdent: feed.pat,
      npmAlwaysAuth: true,
    };
  }

  const outputString = yaml.dump(homeConfig);
  fs.writeFileSync(homeYaml, outputString);
  console.log("done!");
}

main();
