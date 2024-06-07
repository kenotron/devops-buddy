export interface PatToken {
  authorizationId: string;
  displayName: string;
  scope: string;
  targetAccounts: string[];
  token: string;
  validFrom: string;
  validTo: string;
}
