#import "./typst-template/page-setting.typ": page-setting
#import "./typst-template/utils/create-dummies.typ": create-dummy-book-data
#import "./typst-template/handout-per-student.typ": handout-per-student

#show: page-setting

#handout-per-student(
  book-data-array: (
    create-dummy-book-data(title: "일품 중등 수학 3(상)"),
    create-dummy-book-data(title: "쎈 중등 수학 3(상)"),
  ),
  student-name: "홍길동",
  date-string: "2025-01-02",
)
