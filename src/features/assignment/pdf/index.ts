// 여기서 해야 하는 게 뭔가
// 1. test.typ compile without writing
// 2. pdf to blob

import { fileURLToPath } from "url"
import { dirname } from "path"
import { execSync } from "child_process"
import fs from "fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const convertTypstToPdf = () => {
    const testTypstPath = `${__dirname}/test.typ`
    execSync(`typst compile ${testTypstPath}`)
    const pdf = fs.readFileSync(`${__dirname}/test.pdf`)
    return pdf
}
