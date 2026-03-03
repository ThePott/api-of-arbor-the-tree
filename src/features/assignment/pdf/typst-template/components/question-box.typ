#let index-text(content) = text(
  weight: "semibold",
  content,
)

#let question-data = (
  index: 1,
  page: 1,
  name: "",
  solution_page: 0,
)
#let question-box(question-data) = {
  grid(
    columns: (auto, auto, 1fr),
    [#index-text(str(question-data.index))],
    [
      #h(16pt)
      #text(str(question-data.page))
      쪽
      #text(question-data.name)
      번
    ],
    [
      #h(1fr)
      (답지
      #text(str(question-data.solution_page))
      쪽)
    ],
  )
  v(1fr)
}
