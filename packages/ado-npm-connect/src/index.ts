// @ts-check

import { join } from "path";
import fs, { promises as fsPromises } from "fs";
import { homedir } from "os";
import yaml from "js-yaml";
import { testAdoConnection } from "./test-ado-connection";
import { logger } from "./logger";

const npmRegistry = "https://registry.npmjs.org";

const organization = "";
const project = "";
const feedId = "";

async function main() {
  try {
    // For CI, we rely on another mechanism to authenticate
    if (process.env.CI || process.env.TF_BUILD) {
      return;
    }

    const userAuthFile = join(homedir(), ".yarnrc.yml");

    logger.info("Ensuring that the user auth file exists: %s", userAuthFile);
    await ensureAuthFile(userAuthFile);

    const contents = await fsPromises.readFile(userAuthFile, "utf8");
    const authObject = yaml.load(contents) ?? {};

    const authRequired = await isAuthRequired(authObject);

    if (authRequired) {
      logger.info("A new auth token is required");
      const npmAuthIdent = await getBase64AuthIdent();
      authObject.npmRegistries = authObject.npmRegistries ?? {};

      Object.assign(authObject, {
        npmRegistries: {
          [npmRegistry]: {
            npmAuthIdent,
            npmAlwaysAuth: true,
          },
        },
      });

      logger.info("Auth token has been written to: %s", userAuthFile);
      await fsPromises.writeFile(userAuthFile, yaml.dump(authObject));
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

  logger.info("You are now ready to run `yarn` inside the sidecars directory");
}

async function getBase64AuthIdent() {
  // const token = await acquireEntraIdToken();
  // await getPAT();

  return Buffer.from(
    `:${Buffer.from(results.stdout).toString("utf-8")}`
  ).toString("base64");
}

async function ensureAuthFile(userAuthFile) {
  const userAuthFileExists = fs.existsSync(userAuthFile);
  if (!userAuthFileExists) {
    console.log("User auth file not found, creating one");
    await fsPromises.writeFile(userAuthFile, "");
  }
}

async function isAuthRequired(authObject) {
  if (
    authObject &&
    authObject.npmRegistries &&
    authObject.npmRegistries[npmRegistry] &&
    authObject.npmRegistries[npmRegistry].npmAuthIdent
  ) {
    /** @type {string} */
    const npmAuthIdent =
      authObject.npmRegistries[npmRegistry].npmAuthIdent;
    const canConnect = await testAdoConnection({
      npmAuthIdent,
      organization,
      project,
      feedId,
    });
    return !canConnect;
  }

  return true;
}

main();
