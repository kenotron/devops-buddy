import axios from "axios";
import qs from "querystring";

export default async function acquireTokens(options: {
  appSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{
  access_token: string;
  expires_in: string;
  refresh_token: string;
}> {
  const { appSecret, code, redirectUri } = options;

  const tokenRequestBody = `client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&client_assertion=${encodeURIComponent(
    appSecret
  )}&grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(
    code
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  const body = {
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    client_assertion: encodeURIComponent(appSecret),
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: encodeURIComponent(code),
    redirect_uri: redirectUri
  };

  try {
    const tokenResults = await axios.post(
      "https://app.vssps.visualstudio.com/oauth2/token",
      qs.stringify(body),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": tokenRequestBody.length
        }
      }
    );

    return tokenResults.data;
  } catch (e) {
    console.error(e.response.data);
    throw e;
  }
}
