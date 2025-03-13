#!/usr/bin/env node

import * as fs from "node:fs"
import {ArgumentParser, type ArgumentParserOptions} from "argparse"
import * as glob from "glob"

interface ParsedArgs {
  include: string
  exclude: string | undefined
  verbose: boolean
  node: boolean
}

function parse_args(): ParsedArgs {
  const apo = {
    description: "Add shebangs",
    add_help: true,
    allow_abbrev: false,
  } as unknown as ArgumentParserOptions

  const ap = new ArgumentParser(apo)

  ap.add_argument("include", {help: "glob of paths to include"})
  ap.add_argument("--exclude", {help: "glob of paths to exclude"})
  ap.add_argument("--verbose", {action: "store_true", help: "show verbose messages"})

  const meg = ap.add_mutually_exclusive_group({required: true})
  meg.add_argument("--node", {action: "store_true", help: "add shebang for Node"})

  return ap.parse_args() as ParsedArgs
}

function console_output(when: boolean, message: string) {
  if (when) {
    fs.writeSync(1, `${message}\n`)
  }
}

function add_shebang({path, shebang, verbose}: {path: string; shebang: string; verbose: boolean}): void {
  const text_in = fs.readFileSync(path, {encoding: "utf8"})

  const lines = text_in.split(/\r?\n/)

  const SHEBANG_START = "#!/"

  if (lines[0].startsWith(SHEBANG_START)) {
    console_output(verbose, `Updating shebang in ‘${path}’`)
    lines[0] = shebang
  } else {
    console_output(verbose, `Adding new shebang to ‘${path}’`)
    lines.unshift(shebang)
  }

  const text_out = lines.join("\n")

  fs.writeFileSync(path, text_out, {encoding: "utf8"})
}

function main(): void {
  const pa = parse_args()

  const {include, exclude, verbose, node} = pa

  const shebang = node ? "#!/usr/bin/env node" : process.exit(1)

  console_output(verbose, `Using shebang ‘${shebang}’`)

  const paths_included = glob.sync(include, {nodir: true})
  const paths_excluded = new Set(exclude ? glob.sync(exclude, {nodir: true}) : [])

  for (const path of paths_included) {
    if (paths_excluded.has(path)) {
      continue
    }

    add_shebang({path, shebang, verbose})
  }
}

main()
