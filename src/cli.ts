import authorizeApp from "./authorizeApp";
import acquireTokens from "./acquireTokens";

(async () => {
  // JDH told me that it's okay to embed this. It's his fault.
  const appSecret =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Im9PdmN6NU1fN3AtSGpJS2xGWHo5M3VfVjBabyJ9.eyJjaWQiOiIyZDBhMTEyNy1iMGYzLTQ2YzUtYjUyNC1mZjQzMTBiMGM2OGUiLCJjc2kiOiI4OTIzYzZkZC01M2NkLTRmYzctODNmYy0xMTE0OTBiYWU3NGMiLCJuYW1laWQiOiJiZjYyZDhiOS1iMDEzLTRjNDEtOWFjMC1lMjgzMTEyZDJlZTMiLCJpc3MiOiJhcHAudnN0b2tlbi52aXN1YWxzdHVkaW8uY29tIiwiYXVkIjoiYXBwLnZzdG9rZW4udmlzdWFsc3R1ZGlvLmNvbSIsIm5iZiI6MTU4NTA5NTEwMCwiZXhwIjoxNzQyODYxNTAwfQ.dTaGYcTxyyRE_xqYBM8TkD2n8wB4zrJ1S8E0sxEuz7m41jxFaqEDr5gUj2Ftfy27voVCJLO5NrTmJjB7Cw9-_GM8fksDaIWhaWx3bUSGQQZT9HD2s8hstHwcfANHcESQQZ3kbeqHf__gB39xpwXi9ldXBisU_kwcvzItpRfU92gdo-1HLJt35zHe1V4cy-TeBIo_HHaC9JaZ0bNFfQGXKiu17yFt3cYFyP5IjOcUfeLmAtXUvLdglnxSuuY9XUnFy2B9jxRhCdCkJLpU2QSLyDWUSqnULXGWNnm1xOaGD6iyAOGY3eHaXQZ948FrBXqrSktG0p9FlD_Fe5MIUti-qw";

  const auth = authorizeApp();
  const { code } = auth;

  // This was set up to some dummy url (has to be some sort of https, whatever)
  const redirectUri = "https://localhost/callback/oauth";

  const tokenResults = await acquireTokens({
    appSecret,
    code,
    redirectUri
  });
})();
