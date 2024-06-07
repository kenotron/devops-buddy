export interface IFeedInfo {
  organization: string;
  feed: string;
  style: "visualstudio.com" | "dev.azure.com";
  pat?: string;
}
