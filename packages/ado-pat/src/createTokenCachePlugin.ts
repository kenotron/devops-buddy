import { createCacheStore } from "./cache/createCacheStore";
import { CachePlugin } from "./CachePlugin";

export async function createTokenCachePlugin() {
  const cacheStore = createCacheStore();
  return new CachePlugin(cacheStore);
}
