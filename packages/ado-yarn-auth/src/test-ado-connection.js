import fetch from "node-fetch";
import { logger } from "./logger";

/**
 * Check if the user is authenticated to the ADO API.
 * This function performs a network request to retrieve an ADO feed for the given organization
 * @param {Object} options
 * @param {string} options.npmAuthIdent The password to use for the login
 * @param {string} options.organization The organization to check against
 * @param {string} options.project The project to check against
 * @param {string} options.feedId The feed ID to check against
 *
 * @returns
 */
export const testAdoConnection = async function testAdoConnection({
  npmAuthIdent,
  organization,
  project,
  feedId,
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
};
