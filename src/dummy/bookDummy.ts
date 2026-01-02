export interface Book {
    title: string
    publishedYear: number
    modifiedAt: string | null
    isActive: boolean
}

export const bookArrayDummy: Book[] = [
    { title: "수학의 정석", publishedYear: 2019, modifiedAt: "2023-10-10", isActive: true },
    { title: "개념원리 수학", publishedYear: 2021, modifiedAt: "2023-11-15", isActive: true },
    { title: "마플 수학", publishedYear: 2020, modifiedAt: "2024-01-20", isActive: true },
    { title: "신사고 쎈 수학", publishedYear: 2022, modifiedAt: "2024-02-05", isActive: true },
    { title: "블랙라벨 수학", publishedYear: 2021, modifiedAt: "2023-12-18", isActive: false },
    { title: "일품 수학", publishedYear: 2020, modifiedAt: "2024-03-12", isActive: true },
    { title: "수학의 바이블", publishedYear: 2019, modifiedAt: "2023-09-25", isActive: false },
    { title: "개념플러스유형 수학", publishedYear: 2022, modifiedAt: "2024-01-08", isActive: true },
    { title: "풍산자 수학", publishedYear: 2021, modifiedAt: "2023-11-30", isActive: true },
    { title: "기출의 미래 수학", publishedYear: 2023, modifiedAt: null, isActive: true },
    { title: "수학 완전정복", publishedYear: 2020, modifiedAt: "2024-02-28", isActive: false },
    { title: "RPM 수학", publishedYear: 2022, modifiedAt: "2023-10-22", isActive: true },
]
