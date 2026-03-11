import { fileURLToPath } from "url"
import { dirname } from "path"
import { execSync } from "child_process"
import fs from "fs"
import type { condenseBookForPdf } from "../router/index.js"
import { makeTemplate } from "./typst-template/index.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

type MakeAssignmentPdfProps = {
    id: bigint
    studentName: string
    bookForPdfArray: ReturnType<typeof condenseBookForPdf>
    assigned_at: Date
}
const makeAssignmentPdf = ({ id, studentName, bookForPdfArray, assigned_at }: MakeAssignmentPdfProps) => {
    const template = makeTemplate({ id, studentName, bookForPdfArray, assigned_at })
    const now = Date.now()
    const fileName = `assignment_${now}`
    const typstPath = `${__dirname}/${fileName}.typ`
    fs.writeFileSync(typstPath, template)
    execSync(`typst compile ${typstPath}`)
    const pdfPath = `${__dirname}/${fileName}.pdf`
    const pdf = fs.readFileSync(pdfPath)
    setTimeout(() => {
        fs.unlink(pdfPath, (error) => console.error(error))
        fs.unlink(typstPath, (error) => console.error(error))
    }, 5000)
    return pdf
}

export default makeAssignmentPdf
