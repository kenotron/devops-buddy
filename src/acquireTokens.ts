import axios from "axios";
import qs from "querystring";
import { Token } from "./tokenStore";

const SECONDS = 1000;
const TOKEN_URL = "https://app.vssps.visualstudio.com/oauth2/token";
const ASSERTION_TYPE = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

export async function acquireTokens(options: {
  appSecret: string;
  code: string;
  redirectUri: string;
}): Promise<Token> {
  const { appSecret, code, redirectUri } = options;

  const body = {
    client_assertion_type: ASSERTION_TYPE,
    client_assertion: encodeURIComponent(appSecret),
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: encodeURIComponent(code),
    redirect_uri: redirectUri
  };

  const tokenRequestBody = qs.stringify(body);

  try {
    const tokenResults = await axios.post(TOKEN_URL, qs.stringify(body), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": tokenRequestBody.length
      }
    });

    return {
      accessToken: tokenResults.data.access_token,
      expiry: new Date(
        new Date().getTime() + tokenResults.data.expires_in * SECONDS
      ).toString(),
      refreshToken: tokenResults.data.refresh_token
    };
  } catch (e) {
    console.error(e.response.data);
    throw e;
  }
}

export async function refreshTokens(options: {
  appSecret: string;
  code: string;
  redirectUri: string;
}): Promise<Token> {
  const { appSecret, code, redirectUri } = options;

  const body = {
    client_assertion_type: ASSERTION_TYPE,
    client_assertion: encodeURIComponent(appSecret),
    grant_type: "refresh_token",
    assertion: encodeURIComponent(code),
    redirect_uri: redirectUri
  };

  const tokenRequestBody = qs.stringify(body);

  try {
    const tokenResults = await axios.post(TOKEN_URL, qs.stringify(body), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": tokenRequestBody.length
      }
    });

    return {
      accessToken: tokenResults.data.access_token,
      expiry: new Date(
        new Date().getTime() + tokenResults.data.expires_in * SECONDS
      ).toString(),
      refreshToken: tokenResults.data.refresh_token
    };
  } catch (e) {
    console.error(e.response.data);
    throw e;
  }
}
