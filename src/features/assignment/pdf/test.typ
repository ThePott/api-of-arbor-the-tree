#import "./typst-template/page-setting.typ": page-setting
#import "./typst-template/header.typ": header
#import "./typst-template/question-box.typ": question-box
#import "./typst-template/assignment-page.typ": assignment-page

#show: page-setting

#let sample-page = assignment-page(
  (
    "일품 중등 수학 3(상)",
    "[I] 1 제곱근과 실수",
    "개념 & 핵심 기출",
    "20230118",
    "홍길동",
  ),
  (
    "1",
    "8",
    "30",
    "0",
  ),
  second-question-data: (
    "2",
    "8",
    "30",
    "0",
  ),
)

#sample-page
#sample-page
