import type { IFeedInfo } from "./types/IFeedInfo";

export function generateFeedInfo(servers: string[]): IFeedInfo[] {
  const orgPattern = "[A-Za-z0-9][A-Za-z0-9-]{0,48}[A-Za-z0-9]";
  const feedPattern = "[A-Za-z0-9][A-Za-z0-9-]{0,63}[A-Za-z0-9]";

  return servers
    .map((server) => {
      let groups: IFeedInfo = {
        organization: "",
        feed: "",
        style: "visualstudio.com",
        pat: "",
        url: "",
      };

      let url = "";

      if (server.includes(".pkgs.visualstudio.com")) {
        groups = server.match(
          `(?<organization>${orgPattern})\.pkgs\.visualstudio\.com(?:/(?<project>[A-Za-z0-9-]+))?/_packaging/(?<feed>${feedPattern})/`
        )?.groups as unknown as IFeedInfo;

        url = `//${groups.organization}.pkgs.visualstudio.com${
          groups.project ? `/${groups.project}` : ""
        }/_packaging/${groups.feed}/npm/`;

        groups.style = "visualstudio.com";
      }

      if (server.includes("pkgs.dev.azure.com")) {
        groups = server.match(
          `pkgs\.dev\.azure\.com/(?<organization>${orgPattern})(?:/(?<project>[A-Za-z0-9-]+))?/_packaging/(?<feed>${feedPattern})/`
        )?.groups as unknown as IFeedInfo;

        url = `//pkgs.dev.azure.com/${groups.organization}${
          groups.project ? `/${groups.project}` : ""
        }/_packaging/${groups.feed}/npm/`;

        groups.style = "dev.azure.com";
      }

      if (groups) {
        return {
          organization: groups.organization,
          feed: groups.feed,
          pat: "",
          style: groups.style,
          url,
        };
      }

      return null;
    })
    .filter((n) => n !== null) as IFeedInfo[];
}
