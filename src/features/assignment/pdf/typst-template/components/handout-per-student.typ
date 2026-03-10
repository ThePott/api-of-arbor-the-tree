#import "./assignment-page.typ": assignment-page
#let handout-per-topic(
  header-data: (:),
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

#let handout-per-book(
  id: 0,
  student-name: "",
  date-string: "",
  book-data: (:),
) = {
  let book-title = book-data.title
  for topic-data in book-data.topics {
    let header-data = (
      id: id,
      book-string: book-title,
      topic-string: topic-data.title,
      date-string: date-string,
      name-string: student-name,
    )
    handout-per-topic(
      header-data: header-data,
      question-data-array: topic-data.questions,
    )
  }
}

#let handout-per-student(
  id: 0,
  student-name: "",
  date-string: "",
  book-data-array: (),
) = {
  for book-data in book-data-array {
    handout-per-book(
      id: id,
      student-name: student-name,
      date-string: date-string,
      book-data: book-data,
    )
  }
}

