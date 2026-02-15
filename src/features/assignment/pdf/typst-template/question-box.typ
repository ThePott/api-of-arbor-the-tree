#let index-text(value) = text(
  weight: "semibold",
  value,
)
#let question-box(index, page, question-name, solution-page) = {
  grid(
    columns: (auto, auto, 1fr),
    [#index-text(index)],
    [
      #h(16pt)
      #text(page)
      쪽
      #text(question-name)
      번
    ],
    [
      #h(1fr)
      (답지
      #text(solution-page)
      쪽)
    ],
  )
  v(1fr)
}
