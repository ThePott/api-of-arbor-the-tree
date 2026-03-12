#let index-text(content) = text(
  weight: "semibold",
  content,
)

#let char-text(char) = text(size: 8pt, fill: gray, char)
#let char-array(char-array) = [
  #char-text("[")
  #h(16pt)
  #for char in char-array {
    char-text(char)
    h(16pt)
  }
  #char-text("]")
]

#let question-data = (
  index: 1,
  page: 1,
  name: "",
  repeat_count: 0,
  solution_page: 0,
)
#let question-box(question-data) = {
  grid(
    columns: (auto, auto, 1fr),
    [
      #index-text(str(question-data.index))
    ],
    [
      #h(16pt)
      #text(str(question-data.page))
      쪽
      #text(question-data.name)
      번
      #h(16pt)
      R
      #text(str(question-data.repeat_count))
    ],
    [
      #h(1fr)
      (답지
      #text(str(question-data.solution_page))
      쪽)
    ],
  )
  grid(
    columns: (auto, 1fr),
    char-array(("H", "D", "C", "M", "K")),
    line(length: 100%, start: (0%, 14pt), stroke: silver),
  )
  v(1fr)
}
