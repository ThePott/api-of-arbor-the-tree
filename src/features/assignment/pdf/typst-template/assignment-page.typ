#import "./header.typ": header
#import "./question-box.typ": question-box

#let assignment-page(
  header-data,
  first-question-data,
  second-question-data: none,
) = {
  header(..header-data)
  question-box(..first-question-data)
  if second-question-data != none {
    question-box(..second-question-data) // NOTE: this is optional
  }

  pagebreak(to: "odd") // NOTE: this should be called only when book has been changed
}
