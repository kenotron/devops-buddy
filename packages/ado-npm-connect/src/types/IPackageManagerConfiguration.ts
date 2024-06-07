import { IFeedInfo } from "./IFeedInfo";

export interface IPackageManagerConfiguration<TConfig> {
  findProjectConfigFile(cwd: string): string | null;
  loadProjectConfig(): TConfig | null;
  updateGlobalConfigWithFeeds(feeds: IFeedInfo[]): void;
}
