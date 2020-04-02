# Azure DevOps NPM Auth

The purpose of this package is to provide a cross platform and interactive authentication experience like `vsts-npm-auth`, but without the limitation of it being Windows only.

## Installation

Because of the size of the package, it is recommended to just install it globally like this:

```
npm install -g devops-buddy
```

or

```
yarn global add devops-buddy
```

When the size is reduced, the global installation guidance would be lifted

## Usage

To use it, run it at the root of the repository that has a `.npmrc` file:

```
# cd project
# devops-buddy
```

A window would open for you to authenticate. Then it'll proceed to get a new accesstoken for you to use to install from npm feeds from Azure Artifacts.

## The Stack

1. an Azure DevOps registered application
2. a cross-platform application with a webview - handles the interactive prompt (used for 1st time)
3. a CLI app that manages access tokens and refresh tokens - saves the tokens securely via `keytar`

## Future Work

Currently the interactive app is based on Electron. It is completely overkill (@ 170mb) and carries a huge installation burden. There are alternatives:

1. [webview](https://github.com/zserge/webview)
2. [WebWindow](https://github.com/SteveSandersonMS/WebWindow)
3. build our own node.js binding for webview to reduce the installation size
