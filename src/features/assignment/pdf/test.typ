#import "./typst-template/page-setting.typ": page-setting
#import "./typst-template/header.typ": header
#import "./typst-template/question-box.typ": question-box
#import "./typst-template/assignment-page.typ": assignment-page

#show: page-setting

#let sample-page = assignment-page(
  header-data: (
    book-string: "일품 중등 수학 3(상)",
    topic-string: "[I] 1 제곱근과 실수",
    step-string: "개념 & 핵심 기출",
    date-string: "20230118",
    name-string: "홍길동",
  ),
  first-question-data: (
    index: 1,
    page: 8,
    question-name: "30",
    solution-page: 0,
  ),
  second-question-data: (
    index: 1,
    page: 8,
    question-name: "30",
    solution-page: 0,
  ),
)

#sample-page
#sample-page
