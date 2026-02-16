#let dummy-topic-array = (
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
    ),
  ),
)

#let create-dummy-book-data(title: "") = (
  title: title,
  topics: dummy-topic-array,
)
