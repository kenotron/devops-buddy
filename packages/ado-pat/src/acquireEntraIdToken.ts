import {
  PublicClientApplication,
  InteractionRequiredAuthError,
  type InteractiveRequest,
} from "@azure/msal-node";

import open from "open";
import { getAuthConfig } from "./authConfig";
import { createTokenCachePlugin } from "./createTokenCachePlugin";
import { logger } from "./logger";

const openBrowser = async (url: string) => {
  open(url);
};

const adoScope = "499b84ac-1321-427f-aa17-267ca6975798/.default";

interface Options {
  tenantId?: string;
}

export async function acquireEntraIdToken(options?: Options) {
  options = options || {};

  const cachePlugin = await createTokenCachePlugin();

  const pca = new PublicClientApplication({
    ...getAuthConfig({
      tenantId: options.tenantId,
    }),
    cache: { cachePlugin },
  });

  const accounts = await pca.getTokenCache().getAllAccounts();
  const loginRequest: InteractiveRequest = {
    scopes: [adoScope],
    openBrowser,
    successTemplate: "Successfully signed in! You can close this window now.",
  };

  if (accounts.length == 1) {
    const silentRequest = {
      account: accounts[0],
      scopes: [adoScope],
    };

    return pca.acquireTokenSilent(silentRequest).catch((e) => {
      if (e instanceof InteractionRequiredAuthError) {
        return pca.acquireTokenInteractive(loginRequest);
      }
    });
  } else if (accounts.length > 1) {
    accounts.forEach((account) => {
      logger.info(account.username);
    });
    return Promise.reject(
      "Multiple accounts found. Please select an account to use (not implemented yet)."
    );
  } else {
    return pca.acquireTokenInteractive(loginRequest);
  }
}
