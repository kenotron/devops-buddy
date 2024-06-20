// WindowsCacheStore uses napi-dpapi2 to encrypt and store into a Windows DPAPI2 protected file.

import { ICacheStore } from "./ICacheStore";
import dpapi from "node-dpapi2";
import fs from "fs";
import path from "path";

export class WindowsCacheStore implements ICacheStore {
  constructor(
    private fileName: string,
    private scope: "CurrentUser" | "LocalMachine",
    private optionalEntropy: Uint8Array | null
  ) {}

  public set(value: string) {
    const data = Buffer.from(value);
    const encryptedValue = dpapi.protectData(
      data,
      this.optionalEntropy,
      this.scope
    );
    // Write the encrypted value to the file
    if (!fs.existsSync(path.dirname(this.fileName))) {
      fs.mkdirSync(path.dirname(this.fileName), { recursive: true });
    }

    fs.writeFileSync(this.fileName, encryptedValue);
  }

  public get(): string | null {
    if (!fs.existsSync(path.dirname(this.fileName))) {
      return null;
    }

    // Read the encrypted value from the file
    const contents = fs.readFileSync(this.fileName);

    const decryptedValue = dpapi.unprotectData(
      contents,
      this.optionalEntropy,
      this.scope
    );

    return decryptedValue.toString();
  }
}
