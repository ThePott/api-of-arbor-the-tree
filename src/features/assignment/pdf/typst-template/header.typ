#let book-title(content) = text(
  size: 12pt,
  content,
)
#let topic-title(content) = text(
  size: 16pt,
  content,
)
#let step-title(content) = text(
  size: 18pt,
  weight: "semibold",
  content,
)
#let assigned-date(content) = text(
  size: 12pt,
  content,
)
#let student-name(content) = text(
  size: 14pt,
  content,
)

#let header-data = (
  book-string: "",
  topic-string: "",
  step-string: "",
  date-string: "",
  name-string: "",
)
#let header(
  header-data,
) = grid(
  columns: (1fr, auto),
  align: (left, right),
  [
    #book-title(header-data.book-string) \
    #topic-title(header-data.topic-string) \
    #step-title(header-data.step-string)
  ],
  [
    #assigned-date(header-data.date-string) \
    #student-name(header-data.name-string)
  ],
)
