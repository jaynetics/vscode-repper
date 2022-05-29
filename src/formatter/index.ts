import * as vscode from "vscode"
import EditProvider from "./edit_provider"

export function registerFormatter(ctx: vscode.ExtensionContext) {
  const documentSelector = [
    {language: "ruby", scheme: "file"},
    {language: "ruby", scheme: "untitled"},
  ]
  new EditProvider().register(ctx, documentSelector)
}
