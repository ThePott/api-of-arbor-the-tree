#let book(value) = text(
  size: 12pt,
  value,
)
#let topic(value) = text(
  size: 16pt,
  value,
)
#let step(value) = text(
  size: 18pt,
  weight: "semibold",
  value,
)
#let date(value) = text(
  size: 12pt,
  value,
)
#let name(value) = text(
  size: 14pt,
  value,
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
    #book(book-string) \
    #topic(topic-string) \
    #step(step-string)
  ],
  [
    #date(date-string) \
    #name(name-string)
  ],
)
