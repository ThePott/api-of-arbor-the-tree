#import "./typst-template/components/page-setting.typ": page-setting
#import "./typst-template/components/handout-per-student.typ": (
  handout-per-student,
)

#show: page-setting

#handout-per-student(
  book-data-array: (,),
  student-name: "홍길동",
  date-string: "2026-02-26",
)
