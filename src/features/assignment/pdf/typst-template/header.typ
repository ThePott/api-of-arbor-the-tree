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

#let header(
  book-string,
  topic-string,
  step-string,
  date-string,
  name-string,
) = grid(
  columns: (1fr, auto),
  align: (left, right),
  [
    #book-title(book-string) \
    #topic-title(topic-string) \
    #step-title(step-string)
  ],
  [
    #assigned-date(date-string) \
    #student-name(name-string)
  ],
)
