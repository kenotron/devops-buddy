import { IFeedInfo } from "./IFeedInfo";

export interface IPackageManagerConfiguration {
  findProjectConfigFile(cwd: string): string | null;
  updateGlobalConfigWithFeeds(feeds: IFeedInfo[]): void;
  getFeedInfo(): IFeedInfo[];
}
