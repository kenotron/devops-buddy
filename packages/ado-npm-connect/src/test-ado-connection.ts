import fetch from "node-fetch";
import { logger } from "./logger";

export async function testAdoConnection({
  npmAuthIdent,
  organization,
  project,
  feedId,
}: {
  npmAuthIdent: string;
  organization: string;
  project: string;
  feedId: string;
}) {
  const auth = `Basic ${npmAuthIdent}`;

  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: auth,
    },
  };

  try {
    const resp = await fetch(
      `https://feeds.dev.azure.com/${organization}/${project}/_apis/packaging/feeds/${feedId}?api-version=7.1-preview.1`,
      options
    );

    if (resp.status === 401) {
      logger.info(`Test ADO API response: ${resp.status} - not authorized`);
      return false;
    }

    logger.info(`Test ADO API response: ${resp.status} - success`);
  } catch (/** @type {any} */ error) {
    logger.info(`Test ADO API response: ${error}`);

    return false;
  }

  return true;
}
