import keytar from "keytar";

export interface Token {
  accessToken: string;
  refreshToken: string;

  /* ISO date string */
  expiry: string;
}

export async function getToken() {
  const tokenBlob = await keytar.findPassword("devops-buddy");

  if (tokenBlob) {
    const token = JSON.parse(tokenBlob);
    return token;
  }

  return null;
}

export async function setToken(token: Token) {
  await keytar.setPassword("devops-buddy", "dummy", JSON.stringify(token));
}
