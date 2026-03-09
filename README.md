# Solhint VS Code Extension

[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/protofire.solhint-vscode-ext)](https://marketplace.visualstudio.com/items?itemName=protofire.solhint-vscode-ext)
[![VS Code Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/protofire.solhint-vscode-ext)](https://marketplace.visualstudio.com/items?itemName=protofire.solhint-vscode-ext)
[![VS Code Marketplace Rating](https://img.shields.io/visual-studio-marketplace/r/protofire.solhint-vscode-ext)](https://marketplace.visualstudio.com/items?itemName=protofire.solhint-vscode-ext)
[![License](https://img.shields.io/github/license/protofire/solhint-vscode-ext)](https://github.com/protofire/solhint-vscode-ext)

A Visual Studio Code extension that runs **Solhint from your workspace** and reports linting diagnostics directly in the editor.
Using the workspace version ensures that the same Solhint version and rule configuration used by the project is applied in the editor, avoiding inconsistencies across developers and CI environments (similar to how tools like ESLint and Prettier operate).

Unlike many Solidity extensions, this extension **does not bundle Solhint**.  
Instead, it uses the **Solhint version installed in your project**, ensuring consistent linting between:

- VS Code
- CLI
- CI pipelines

---

## Features

- Uses **Solhint from your project's `node_modules`**
- Displays diagnostics in the **Problems panel**
- Supports **Solhint plugins**
- Supports **local plugin development**
- Works with `.solhint.json`
- Avoids version conflicts by not bundling Solhint

---

## Requirements

Your project must have **Solhint installed**.

```bash
npm install --save-dev solhint
```

---

## Installation

Install the extension from the **VS Code Marketplace**.

Or install manually from a VSIX file:

```bash
code --install-extension solhint-vscode-ext.vsix
```

---

## Quick Start

1. Install Solhint:

```bash
npm install --save-dev solhint
```

2. Create `.solhint.json`:

```json
{
  "extends": "solhint:recommended"
}
```

3. Open any `.sol` file.

Diagnostics will appear automatically.

---

## Example Project Structure

```
project
├ contracts
│  └ MyContract.sol
├ node_modules
│  └ solhint
├ .solhint.json
└ package.json
```

---

## Using Solhint Plugins

Add plugins in `.solhint.json`:

```json
{
  "plugins": ["security"],
  "rules": {
    "security/some-rule": "error"
  }
}
```

Install the plugin:

```bash
npm install --save-dev solhint-plugin-security
```

---

## Local Plugin Development

If a plugin is **not published on npm**, you can load it manually.

Example folder:

```
/home/user/dev/solhint-plugins
└ node_modules
   └ solhint-plugin-myplugin
```

Then configure VS Code:

```json
{
  "solhintVscodeExt.pluginPaths": [
    "/home/user/dev/solhint-plugins"
  ]
}
```

And enable the plugin in `.solhint.json`:

```json
{
  "plugins": ["myplugin"]
}
```

---

## Extension Settings

### `solhintVscodeExt.trace`

Enable debug logs.

```json
{
  "solhintVscodeExt.trace": true
}
```

Logs appear in:

```
View → Output → solhint-vscode-ext
```

---

### `solhintVscodeExt.solhintModule`

Custom path to a Solhint module.

Normally not required because the extension resolves:

```
workspace/node_modules/solhint
```

Example:

```json
{
  "solhintVscodeExt.solhintModule": "/custom/path/to/solhint"
}
```

---

### `solhintVscodeExt.pluginPaths`

Additional directories used to resolve plugins that are **not installed via npm**.

Example:

```json
{
  "solhintVscodeExt.pluginPaths": [
    "/home/user/dev/solhint-plugins"
  ]
}
```

---

## Troubleshooting

### Solhint not found

Install Solhint in your project:

```bash
npm install --save-dev solhint
```

---

### Plugins cannot be loaded

Ensure the plugin exists in:

```
node_modules/solhint-plugin-<name>
```

Or configure `pluginPaths`.

---

### No diagnostics appear

Verify Solhint works in CLI:

```bash
npx solhint contracts/*.sol
```

---

## Why This Extension Exists

Some Solidity extensions bundle their own Solhint version.  
This can cause:

- inconsistent lint results
- plugin resolution problems
- version mismatches

This extension avoids those issues by **always using your project's Solhint installation**.

---

## Contributing

```bash
git clone https://github.com/protofire/solhint-vscode-ext
npm install
npm run compile
```

Press **F5** to launch the extension in a development VS Code instance.

---

## License

MIT