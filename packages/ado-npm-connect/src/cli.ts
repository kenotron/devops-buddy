import { acquireEntraIdToken, createPAT, createPatPersistence } from "ado-pat";
import { Command } from "commander";
import { logger } from "./logger";
import { flatMap, groupBy } from "lodash-es";
import { YarnRc } from "./yarnrc";
import { NpmRc } from "./npmrc";
import path from "path";
import fs from "fs";
import { IPackageManagerConfiguration } from "./types/IPackageManagerConfiguration";

// by default, try the Microsoft tenant
const DEFAULT_TENANT_ID = "72f988bf-86f1-41af-91ab-2d7cd011db47";

async function main() {
  try {
    const program = new Command();
    program.option("-r, --root <root>", "Root directory", process.cwd());
    program.option("-t, --tenant-id <tenant id>", "Azure AD tenant ID");
    program.option(
      "-a, --account <account>",
      "Account to use for authentication"
    );

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
  account?: string;
}

const PAT_DISPLAY_NAME = "ADO NPM Connection Tool";

async function action({ tenantId, root, account }: Options) {
  root = root || process.cwd();
  tenantId = tenantId || DEFAULT_TENANT_ID;

  const tokenResponse = await acquireEntraIdToken({
    tenantId,
    account,
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
      logger.info("Using npmrc");
      return new NpmRc({ root });
    }

    logger.info("Using yarnrc");
    return new YarnRc({ root });
  })();

  logger.info("Loading feeds");
  const feedInfos = config.getFeedInfo();

  logger.info(`Found ${feedInfos.length} feeds`);

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

      if (!patResponse || patResponse.patTokenError !== "none") {
        logger.error("Failed to create PAT");
        process.exit(1);
      }

      return patResponse.patToken.token;
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
