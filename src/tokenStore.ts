import os from "os";
import path from "path";
import fs from "fs";

const configFile = path.join(os.userInfo().homedir, ".devops-buddy");

export interface Token {
  accessToken: string;
  refreshToken: string;

  /* ISO date string */
  expiry: string;
}

export async function getToken() {
  if (fs.existsSync(configFile)) {
    const tokenBlob = fs.readFileSync(configFile, "utf-8");

    if (tokenBlob) {
      const token = JSON.parse(tokenBlob);
      return token;
    }
  }

  return null;
}

export async function setToken(token: Token) {
  fs.writeFileSync(configFile, JSON.stringify(token, null, 2));
}
