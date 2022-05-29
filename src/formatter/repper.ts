import * as cp from "child_process"
import * as vscode from "vscode"

type RepperOptions = {
  exe: string
  useBundler: boolean
}

const DEFAULT_OPTIONS: RepperOptions = {
  exe: "repper",
  useBundler: false,
}

function cleanUpError(message: string) {
  return message.replace("STDIN is invalid code. ", "")
}

export default class Repper {
  public test(): Promise<void> {
    return new Promise((resolve, reject) => {
      const repper = this.spawn(["//"])

      if (!repper.stderr) {
        const msg = "Couldn't initialize STDERR"
        console.warn(msg)
        vscode.window.showErrorMessage(msg)
        reject(msg)
        return
      }

      repper.on("error", (err) => {
        console.warn(err)

        if (err.message.includes("ENOENT")) {
          vscode.window.showErrorMessage(
            `couldn't find ${this.exe} for formatting (ENOENT)`
          )
        } else {
          vscode.window.showErrorMessage(
            `couldn't run ${this.exe} '${err.message}'`
          )
        }
        reject(err)
      })

      repper.stderr.on("data", (data) => {
        // for debugging
        console.log(`Repper stderr ${data}`)
      })

      repper.on("exit", (code) => {
        if (code) {
          vscode.window.showErrorMessage(`Repper failed with code: ${code}`)
          return reject()
        }
        resolve()
      })
    })
  }

  public format(data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const repper = this.spawn([])

      if (!repper.stdin || !repper.stdout || !repper.stderr) {
        const msg = "Couldn't initialize STDIN, STDOUT or STDERR"
        console.warn(msg)
        vscode.window.showErrorMessage(msg)
        reject(msg)
        return
      }

      // we need to assume UTF-8, because vscode's extension API doesn't provide
      // functionality to retrieve or set the current encoding:
      // https://github.com/microsoft/vscode/issues/824
      repper.stdin.setDefaultEncoding("utf-8")
      repper.stdout.setEncoding("utf-8")

      let result = ""
      let error = ""

      repper.on("error", (err) => {
        console.warn(err)
        vscode.window.showErrorMessage(
          `couldn't run ${this.exe} '${err.message}'`
        )
        reject(err)
      })

      repper.stdout.on("data", (data) => {
        result += data.toString()
      })

      repper.stderr.on("data", (data) => {
        console.warn(`Repper STDERR: ${data}`)
        error += data.toString()
      })

      repper.on("exit", (code) => {
        if (code) {
          const cleanedError = cleanUpError(error)
          const msg = cleanedError.length
            ? cleanedError
            : `Repper failed with code: ${code}`
          vscode.window.showErrorMessage(msg)
          return reject()
        }
        resolve(result)
      })

      repper.stdin.write(data)
      repper.stdin.end()
    })
  }

  private get exe(): string[] {
    const {exe, useBundler} = this.options
    return useBundler ? [`bundle exec ${exe}`] : [exe]
  }

  private get options(): RepperOptions {
    const config = vscode.workspace.getConfiguration("repper")
    const opts = Object.assign({}, DEFAULT_OPTIONS, config)
    return opts
  }

  private spawn = (
    args: string[],
    spawnOpt: cp.SpawnOptions = {}
  ): cp.ChildProcess => {
    const exe = this.exe

    if (!spawnOpt.cwd) {
      spawnOpt.cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    }

    if (!spawnOpt.env) {
      // also here we need to assume UTF-8 (see above)
      spawnOpt.env = {...process.env, LANG: "en_US.UTF-8"} // eslint-disable-line @typescript-eslint/naming-convention
    }

    const cmd = exe.shift() as string
    return cp.spawn(cmd, exe.concat(args), spawnOpt)
  }
}
