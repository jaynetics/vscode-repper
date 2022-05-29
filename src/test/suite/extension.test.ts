import * as assert from "assert"
import * as vscode from "vscode"
import Repper from "../../formatter/repper"

suite("Repper Tests", () => {
  const FIXTURE = `
class Klass
  REGEXP = /(x)/i
end
`
  const EXPECTED_RESULT = `
class Klass
  REGEXP = /
    (
      x
    )
  /ix
end
`

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  test("test detects repper", (done) => {
    const repper = new Repper()
    repper.test().then(() => {
      done()
    })
  })

  test("formats text via repper", (done) => {
    const repper = new Repper()
    repper.format(FIXTURE).then((result: any) => {
      assert.strictEqual(result, EXPECTED_RESULT)
      done()
    })
  })

  test("formats whole documents", () => {
    let document: vscode.TextDocument
    return vscode.workspace
      .openTextDocument({language: "ruby", content: FIXTURE})
      .then((doc) => {
        document = doc
        return vscode.window.showTextDocument(doc)
      })
      .then(() => wait(1500)) // we need to wait a little bit until repper is loaded
      .then(() =>
        vscode.commands.executeCommand("editor.action.formatDocument")
      )
      .then(() => wait(500)) // wait until repper executed
      .then(() => {
        assert.strictEqual(document.getText(), EXPECTED_RESULT)
      })
  }).timeout(20000)

  test("formats text selection", () => {
    let document: vscode.TextDocument
    let textEdit: vscode.TextEditor
    return vscode.workspace
      .openTextDocument({language: "ruby", content: FIXTURE})
      .then((doc) => {
        document = doc
        return vscode.window.showTextDocument(doc)
      })
      .then((text) => {
        textEdit = text
        // we need to wait a little bit until repper is loaded
        return wait(1000)
      })
      .then(() => {
        // format part NOT containing a regexp - should not change content
        const selection = new vscode.Selection(0, 0, 1, 0)
        textEdit.selection = selection
        return vscode.commands.executeCommand("editor.action.formatSelection")
      })
      .then(() => wait(500)) // wait until repper executed
      .then(() => {
        assert.strictEqual(document.getText(), FIXTURE)
      })
      .then(() => {
        // format part containing a regexp
        const selection = new vscode.Selection(2, 11, 2, 17)
        textEdit.selection = selection
        return vscode.commands.executeCommand("editor.action.formatSelection")
      })
      .then(() => wait(500)) // wait until repper executed
      .then(() => {
        assert.strictEqual(document.getText(), EXPECTED_RESULT)
      })
  }).timeout(20000)
})
