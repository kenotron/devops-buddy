import { acquireEntraIdToken, createPAT, createPatPersistence } from "ado-pat";
import { Command } from "commander";
import { logger } from "./logger";
import { flatMap, groupBy } from "lodash-es";
import { YarnRc } from "./yarnrc";
import { NpmRc } from "./npmrc";
import path from "path";
import fs from "fs";
import { IPackageManagerConfiguration } from "./types/IPackageManagerConfiguration";

async function main() {
  try {
    const program = new Command();
    program.option("-r, --root <root>", "Root directory", process.cwd());
    program.option("-t, --tenant-id <tenant id>", "Azure AD tenant ID");
    program.action(action);

    await program.parseAsync(process.argv);
  } catch (e) {
    logger.error(e);
    process.exit(1);
  }
}

interface Options {
  root: string;
  tenantId: string;
  organization: string;
  displayName: string;
}

const PAT_DISPLAY_NAME = "ADO NPM Connection Tool";

async function action({ tenantId, root }: Options) {
  const tokenResponse = await acquireEntraIdToken({
    tenantId,
  });

  if (!tokenResponse) {
    logger.error("Failed to acquire token");
    process.exit(1);
  }

  if (!root) {
    root = process.cwd();
  }

  const config: IPackageManagerConfiguration = (() => {
    if (!fs.existsSync(path.join(root, ".yarnrc.yml"))) {
      return new NpmRc({ root });
    }

    return new YarnRc({ root });
  })();

  const feedInfos = config.getFeedInfo();

  const feedsByOrg = groupBy(feedInfos, "organization");

  const patPersistence = createPatPersistence(PAT_DISPLAY_NAME);
  await patPersistence.initialize();

  const getOrCreatePAT = async (org: string) => {
    const pat = await patPersistence.get(org);

    if (pat) {
      return pat.token;
    } else {
      const patResponse = await createPAT({
        organization: org,
        scope: "vso.packaging_write",
        displayName: PAT_DISPLAY_NAME,
        token: tokenResponse.accessToken,
      });

      if (!patResponse) {
        logger.error("Failed to create PAT");
        process.exit(1);
      }

      return patResponse.token;
    }
  };

  for (const org of Object.keys(feedsByOrg)) {
    const feeds = feedsByOrg[org];

    const orgToken = await getOrCreatePAT(org);

    for (const feed of feeds) {
      feed.pat = orgToken;
    }
  }

  const feeds = flatMap(feedsByOrg);

  config.updateGlobalConfigWithFeeds(feeds);
}

main();
