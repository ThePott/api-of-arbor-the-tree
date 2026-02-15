#import "./header.typ": header, header-data
#import "./question-box.typ": question-box, question-data

#let assignment-page(
  header-data: header-data,
  first-question-data: question-data,
  second-question-data: none,
) = {
  header(header-data)
  question-box(first-question-data)
  if second-question-data != none {
    question-box(second-question-data) // NOTE: this is optional
  }

  pagebreak(to: "odd") // NOTE: this should be called only when book has been changed
}
