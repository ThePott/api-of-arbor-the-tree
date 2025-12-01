-- SQL schema generated from dbml.dbml
-- Use alphabetic order when creating joining tables

-- Core reference tables
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    role VARCHAR(255)
);

CREATE TABLE school (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255)
);

CREATE TABLE hagwon (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255)
);

-- Educational structure tables
CREATE TABLE class (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    teached_by INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP,
    FOREIGN KEY (teached_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);


-- User profile tables
CREATE TABLE student (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    school_id INTEGER NOT NULL,
    hagwon_id INTEGER, -- can be null
    grade INTEGER,
    is_approved BOOLEAN,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (school_id) REFERENCES school(id),
    FOREIGN KEY (hagwon_id) REFERENCES hagwon(id)
);

CREATE TABLE class_student (
    id INTEGER PRIMARY KEY,
    class_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    FOREIGN KEY (class_id) REFERENCES class(id),
    FOREIGN KEY (student_id) REFERENCES student(id)
);

CREATE TABLE parent (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    is_approved BOOLEAN,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE parent_student (
    id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    parent_id INTEGER NOT NULL,
    FOREIGN KEY (student_id) REFERENCES student(id),
    FOREIGN KEY (parent_id) REFERENCES parent(id)
);

CREATE TABLE principal (
    id INTEGER PRIMARY KEY,
    hagwon_id INTEGER NOT NULL,
    user_id INTEGER,
    is_approved BOOLEAN,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (hagwon_id) REFERENCES hagwon(id)
);

CREATE TABLE helper (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    principal_id INTEGER NOT NULL,
    is_approved BOOLEAN,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (principal_id) REFERENCES principal(id)
);

-- Content hierarchy tables
CREATE TABLE book (
    id INTEGER PRIMARY KEY,
    title VARCHAR(255),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE topic (
    id INTEGER PRIMARY KEY,
    book_id INTEGER NOT NULL,
    title VARCHAR(255),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES book(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE step (
    id INTEGER PRIMARY KEY,
    topic_id INTEGER NOT NULL,
    title VARCHAR(255),
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topic(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE question (
    id INTEGER PRIMARY KEY,
    step_id INTEGER NOT NULL,
    order_index INTEGER,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP,
    FOREIGN KEY (step_id) REFERENCES step(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Curriculum and session tables
CREATE TABLE syllabus (
    id INTEGER PRIMARY KEY,
    book_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES book(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE session (
    id INTEGER PRIMARY KEY,
    syllabus_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP,
    FOREIGN KEY (syllabus_id) REFERENCES syllabus(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE session_question (
    id INTEGER PRIMARY KEY,
    session_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES session(id),
    FOREIGN KEY (question_id) REFERENCES question(id)
);

CREATE TABLE session_student (
    id INTEGER PRIMARY KEY,
    session_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    is_resolved BOOLEAN,
    FOREIGN KEY (session_id) REFERENCES session(id),
    FOREIGN KEY (student_id) REFERENCES student(id)
);

-- Assignment and tracking tables
CREATE TABLE handout (
    id INTEGER PRIMARY KEY,
    subtitle VARCHAR(255),
    student_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL, -- refer user id
    created_at TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP,
    is_resolved BOOLEAN,
    FOREIGN KEY (student_id) REFERENCES student(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE criteria (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    description VARCHAR(255),
    min_wrong_count INTEGER,
    scope VARCHAR(255), -- personal or class
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP,
    updated_by INTEGER,
    updated_at TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE handout_question (
    id INTEGER PRIMARY KEY,
    handout_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    order_index INTEGER,
    FOREIGN KEY (handout_id) REFERENCES handout(id),
    FOREIGN KEY (question_id) REFERENCES question(id)
);

-- Student progress tracking tables
CREATE TABLE student_question (
    id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    wronged_count INTEGER DEFAULT 0,
    current_status VARCHAR(255) DEFAULT 'not_started', -- not_started, in_progress, completed, wrong, not_for_you
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    updated_by INTEGER NOT NULL, -- users.id
    FOREIGN KEY (student_id) REFERENCES student(id),
    FOREIGN KEY (question_id) REFERENCES question(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE student_question_history (
    id INTEGER PRIMARY KEY,
    student_question_id INTEGER NOT NULL,
    criteria_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    updated_by INTEGER NOT NULL, -- users.id
    FOREIGN KEY (student_question_id) REFERENCES student_question(id),
    FOREIGN KEY (criteria_id) REFERENCES criteria(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_student_user_id ON student(user_id);
CREATE INDEX idx_student_question_student_id ON student_question(student_id);
CREATE INDEX idx_student_question_question_id ON student_question(question_id);
CREATE INDEX idx_handout_question_handout_id ON handout_question(handout_id);
CREATE INDEX idx_session_question_session_id ON session_question(session_id);
CREATE INDEX idx_session_student_session_id ON session_student(session_id);
CREATE INDEX idx_session_student_student_id ON session_student(student_id);
