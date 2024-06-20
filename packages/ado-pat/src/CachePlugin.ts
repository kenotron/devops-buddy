import { type ICachePlugin, type TokenCacheContext } from "@azure/msal-node";
import { type ICacheStore } from "./cache/ICacheStore";

export class CachePlugin implements ICachePlugin {
  constructor(private store: ICacheStore) {}

  async beforeCacheAccess(tokenCacheContext: TokenCacheContext) {
    const cache = this.store.get();

    if (cache) {
      tokenCacheContext.tokenCache.deserialize(cache);
    }
  }

  async afterCacheAccess(tokenCacheContext: TokenCacheContext) {
    if (tokenCacheContext.cacheHasChanged) {
      const cache = tokenCacheContext.tokenCache.serialize();
      this.store.set(cache);
    }
  }
}
