import type { condenseBookForPdf } from "../../router/index.js"
import makeTypstData from "@/src/utils/makeTypstData.js"

type MakeTemplateProps = {
    studentName: string
    bookForPdfArray: ReturnType<typeof condenseBookForPdf>
    assigned_at: Date
}
export const makeTemplate = ({ studentName, bookForPdfArray, assigned_at }: MakeTemplateProps) => {
    const dateString = assigned_at.toISOString().slice(0, 10)

    const template = `#import "./typst-template/components/page-setting.typ": page-setting
#import "./typst-template/components/handout-per-student.typ": (
  handout-per-student,
)

#show: page-setting

#handout-per-student(
  book-data-array: ${makeTypstData(bookForPdfArray)},
  student-name: "${studentName}",
  date-string: "${dateString}",
)
`
    return template
}
