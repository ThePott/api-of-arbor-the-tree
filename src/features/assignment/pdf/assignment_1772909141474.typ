#import "./typst-template/components/page-setting.typ": page-setting
#import "./typst-template/components/handout-per-student.typ": (
  handout-per-student,
)

#show: page-setting

#handout-per-student(
  book-data-array: ((id: 86,title: "완전 새 문제집 완전 새로움",published_year: 2026,user_id: 10,topics: ((id: 122,title: "[I] 1. 다항식의 연산",order: 1,book_id: 86,questions: ((id: 3198,name: "1",page: 1,solution_page: 1,order: 1,step_id: 273,sub_question_id: none,questionAttempts: ((id: 139,student_id: 6,question_id: 3198,classroom_id: 22,session_id: none,review_assignment_id: 8,status: "CORRECT",parent_attempt_id: 122,created_at: ()),)),(id: 3200,name: "3",page: 1,solution_page: 1,order: 3,step_id: 273,sub_question_id: none,questionAttempts: ((id: 141,student_id: 6,question_id: 3200,classroom_id: 22,session_id: none,review_assignment_id: 8,status: "CORRECT",parent_attempt_id: 130,created_at: ()),)),(id: 3202,name: "5",page: 1,solution_page: 1,order: 5,step_id: 273,sub_question_id: none,questionAttempts: ((id: 143,student_id: 6,question_id: 3202,classroom_id: 22,session_id: none,review_assignment_id: 8,status: "CORRECT",parent_attempt_id: 132,created_at: ()),)),(id: 3204,name: "7",page: 1,solution_page: 1,order: 7,step_id: 273,sub_question_id: none,questionAttempts: ((id: 145,student_id: 6,question_id: 3204,classroom_id: 22,session_id: none,review_assignment_id: 8,status: "CORRECT",parent_attempt_id: 121,created_at: ()),)),)),)),),
  student-name: "홍길동",
  date-string: "2026-03-07",
)
