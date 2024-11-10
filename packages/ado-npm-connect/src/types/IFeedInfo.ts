export interface IFeedInfo {
  organization: string;
  project?: string;
  feed: string;
  style: "visualstudio.com" | "dev.azure.com";
  pat?: string;
  url: string;
}
