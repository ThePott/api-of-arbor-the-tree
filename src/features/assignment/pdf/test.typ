#import "./typst-template/page-setting.typ": page-setting
#import "./typst-template/header.typ": header
#import "./typst-template/question-box.typ": question-box
#import "./typst-template/assignment-page.typ": (
  assignment-page, handout-per-topic,
)

#show: page-setting

// #let header-data = (
//   book-string: "일품 중등 수학 3(상)",
//   topic-string: "[I] 1 제곱근과 실수",
//   date-string: "20230118",
//   name-string: "홍길동",
// )
//
// #handout-per-topic(
//   header-data: header-data,
//   question-data-array: (
//     (
//       page: 8,
//       question-name: "30",
//       solution-page: 0,
//     ),
//     (
//       page: 8,
//       question-name: "31",
//       solution-page: 0,
//     ),
//     (
//       page: 8,
//       question-name: "32",
//       solution-page: 0,
//     ),
//   ),
// )

#let book-data = (
  title: "일품 중등 수학 3(상)",
  topics: (
    (
      title: "[I] 제곱근과 실수",
      questions: (
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
      ),
    ),
    (
      title: "[II] 제곱근과 실수",
      questions: (
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
      ),
    ),
    (
      title: "[III] 제곱근과 실수",
      questions: (
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
      ),
    ),
    (
      title: "[IV] 제곱근과 실수",
      questions: (
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
        (
          page: 8,
          name: "30",
          solution-page: 0,
        ),
      ),
    ),
  ),
)

#let handout-per-book(
  book-data: book-data,
  student-name: "홍길동",
  date-string: "2023-01-18",
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

#handout-per-book(
  book-data: book-data,
  student-name: "홍길동",
  date-string: "2023-01-18",
)
