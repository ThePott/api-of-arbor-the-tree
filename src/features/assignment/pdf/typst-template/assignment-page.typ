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
  pagebreak(weak: true)
}

#let handout-per-topic(
  header-data: header-data,
  question-data-array: (),
) = {
  let page-length = calc.ceil(question-data-array.len() / 2)
  for grouped-index in range(page-length) {
    let first-question-data = (
      ..question-data-array.at(grouped-index * 2),
      index: grouped-index * 2 + 1,
    )
    let second-data = question-data-array.at(
      grouped-index * 2 + 1,
      default: none,
    )
    let second-question-data = if second-data == none { none } else {
      (..(second-data), index: grouped-index * 2 + 2)
    }

    assignment-page(
      header-data: header-data,
      first-question-data: first-question-data,
      second-question-data: second-question-data,
    )
  }
  pagebreak(to: "odd", weak: true)
}

