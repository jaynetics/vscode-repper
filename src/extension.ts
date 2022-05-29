import * as vscode from "vscode"
import {registerFormatter} from "./formatter"

export function activate(context: vscode.ExtensionContext) {
  registerFormatter(context)
}

export function deactivate() {
  // nothing yet
}
