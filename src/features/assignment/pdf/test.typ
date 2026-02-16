#import "./typst-template/page-setting.typ": page-setting
#import "./typst-template/header.typ": header
#import "./typst-template/question-box.typ": question-box
#import "./typst-template/assignment-page.typ": assignment-page, topic-handout

#show: page-setting

#let header-data = (
  book-string: "일품 중등 수학 3(상)",
  topic-string: "[I] 1 제곱근과 실수",
  date-string: "20230118",
  name-string: "홍길동",
)

#topic-handout(
  header-data: header-data,
  question-data-array: (
    (
      page: 8,
      question-name: "30",
      solution-page: 0,
    ),
    (
      page: 8,
      question-name: "31",
      solution-page: 0,
    ),
    (
      page: 8,
      question-name: "32",
      solution-page: 0,
    ),
  ),
)
