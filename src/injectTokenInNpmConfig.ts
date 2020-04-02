import { Token } from "./tokenStore";
import { execSync } from "child_process";
import ini from "ini";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

interface BasicAuth {
  username: string;
  password: string;
  email: string;
}

interface Registry {
  token: string;
}

function shortUrl(url: string) {
  return url.replace(/^http(s)?:/, "").replace(/npm\/registry\/\:.*/, "");
}

function getRegistries(config: { [key: string]: string }, token: Token) {
  const registries: string[] = [];

  for (const [key, value] of Object.entries(config)) {
    if (
      key.includes("registry") &&
      typeof value === "string" &&
      value.includes("pkgs.visualstudio.com")
    ) {
      registries.push(shortUrl(value));
    }
  }

  return registries;
}

function updateUserConfig(
  config: { [key: string]: string },
  registries: string[],
  token: Token
) {
  const newConfig = { ...config };

  for (const registry of registries) {
    const tokenKey = `${registry}:_authToken`;
    const existingToken = config[tokenKey];

    if (existingToken) {
      const decodedToken = jwt.decode(existingToken) as { exp: number };
      if (decodedToken.exp) {
        const expiry = new Date(decodedToken.exp * 1000);
        if (expiry < new Date()) {
          console.log(`${registry} has an expired token, updated...`);
          newConfig[tokenKey] = token.accessToken;
        }
      }
    } else {
      console.log(`${registry} does not have an accessToken, saved...`);
      newConfig[tokenKey] = token.accessToken;
    }
  }

  return newConfig;
}

export async function injectTokenInNpmConfig(token: Token) {
  const projectNpmrcPath = path.join(process.cwd(), ".npmrc"); // TODO: make this configurable per cli args
  const userNpmrcPath = execSync("npm config get userconfig")
    .toString()
    .trim();

  let projectConfig = {};
  let userConfig = {};

  if (fs.existsSync(projectNpmrcPath)) {
    projectConfig = ini.parse(fs.readFileSync(projectNpmrcPath, "utf-8"));
  }

  if (fs.existsSync(userNpmrcPath)) {
    userConfig = ini.parse(fs.readFileSync(userNpmrcPath, "utf-8"));
  }

  const combinedConfig = { ...userConfig, ...projectConfig };

  const registries = getRegistries(combinedConfig, token);
  const newUserConfig = updateUserConfig(userConfig, registries, token);

  fs.writeFileSync(userNpmrcPath, ini.encode(newUserConfig));
}
