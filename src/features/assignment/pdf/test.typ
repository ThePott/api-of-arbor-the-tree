#import "./typst-template/page-setting.typ": page-setting
#import "./typst-template/header.typ": header
#import "./typst-template/question-box.typ": question-box
#import "./typst-template/assignment-page.typ": (
  assignment-page, handout-per-topic,
)
#import "./typst-template/utils/create-dummies.typ": create-dummy-book-data

#show: page-setting

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

#handout-per-student(
  student-name: "홍길동",
  date-string: "2025-02-16",
  book-data-array: (
    create-dummy-book-data(title: "일품 중등 수학 3(상)"),
    create-dummy-book-data(title: "쎈 중등 수학 3(상)"),
  ),
)
