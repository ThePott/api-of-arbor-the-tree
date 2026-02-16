#let handout-per-book(
  student-name: "",
  date-string: "",
  book-data: (),
) = {
  let book-title = book-data.title
  for (topic-data) in book-data.topics {
    let header-data = (
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
  student-name: "",
  date-string: "",
  book-data-array: (),
) = {
  for book-data in book-data-array {
    handout-per-book(
      student-name: student-name,
      date-string: date-string,
      book-data: book-data,
    )
  }
}

