import { app, BrowserWindow } from "electron";
import qs from "querystring";
import url from "url";

async function createWindow() {
  // // Create the browser window.
  let win = new BrowserWindow({
    width: 500,
    height: 600,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    webPreferences: {
      webSecurity: false,
      allowRunningInsecureContent: true,
      enableRemoteModule: true,
      nodeIntegration: false
    }
  });

  const query = qs.stringify({
    client_id: "2D0A1127-B0F3-46C5-B524-FF4310B0C68E",
    redirect_uri: "https://localhost/callback/oauth",
    response_type: "Assertion",
    state: "state",
    scope: "vso.packaging_write"
  });

  const authorizationUrl =
    "https://app.vssps.visualstudio.com/oauth2/authorize?" + query;

  win.webContents.on("will-redirect", (evt, uri) => {
    if (uri.startsWith("https://localhost/callback/oauth")) {
      const parsedUrl = url.parse(uri);
      const query = qs.parse(parsedUrl.query);
      console.log(JSON.stringify(query, null, 2));
      app.quit();
    }
  });

  win.loadURL(authorizationUrl, { userAgent: "Chrome" });
}

app.name = "devops-buddy";
app.allowRendererProcessReuse = false;
app.commandLine.appendSwitch("allow-insecure-localhost", "true");
app.commandLine.appendSwitch("ignore-certificate-errors", "true");
app.whenReady().then(createWindow);
app.addListener("window-all-closed", () => {
  app.quit();
});
