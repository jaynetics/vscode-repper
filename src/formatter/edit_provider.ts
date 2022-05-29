import * as vscode from "vscode"
import Repper from "./repper"

export default class EditProvider
  implements vscode.DocumentRangeFormattingEditProvider
{
  private repper: Repper

  constructor() {
    this.repper = new Repper()
  }

  public register(
    ctx: vscode.ExtensionContext,
    documentSelector: vscode.DocumentSelector
  ) {
    this.repper.test().then(() => {
      ctx.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
          documentSelector,
          this
        ),
        vscode.languages.registerDocumentRangeFormattingEditProvider(
          documentSelector,
          this
        )
      )
    })
  }

  public provideDocumentFormattingEdits(
    document: vscode.TextDocument
  ): Thenable<vscode.TextEdit[]> {
    const range = new vscode.Range(0, 0, Infinity, Infinity)
    return this.formatDocument(document, range)
  }

  public provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    r: vscode.Range
  ): Thenable<vscode.TextEdit[]> {
    // expand selection to beginning of line to make repper's auto-indent work
    const range = new vscode.Range(r.start.line, 0, r.end.line, r.end.character)
    return this.formatDocument(document, range)
  }

  private formatDocument(document: vscode.TextDocument, range: vscode.Range) {
    const input = document.getText(range)
    return this.repper.format(input).then(
      (res) => [new vscode.TextEdit(document.validateRange(range), res)],
      (err) => [] // will be handled in format
    )
  }
}
