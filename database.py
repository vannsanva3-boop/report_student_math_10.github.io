import sqlite3

DB_NAME = "school.db"

def get_db():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()

        # ១. តារាង Settings
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY,
                teacher_name TEXT DEFAULT 'វ៉ាន់ ជីវ៉ា',
                teacher_date TEXT DEFAULT 'ថ្ងៃទី ៣០ ខែ កញ្ញា ឆ្នាំ២០២៦',
                admin_lunar_date TEXT DEFAULT 'ថ្ងៃ  ពុធ ៤រោច ខែ  ភទ្របទ  ឆ្នាំ  មមី  អដ្ឋសក័ ព.ស.២៥៧០',
                admin_solar_date TEXT DEFAULT 'ភ្នំពេញ ត្រូវនឹងថ្ងៃទី  ៣០ ខែ  កញ្ញា  ឆ្នាំ២០២៦',
                school_name TEXT DEFAULT 'សាលាបង្វឹក និង បង្រៀនគួរពិសេស តុងប៉',
                school_branch TEXT DEFAULT 'អគារ G   (សាខា ស្វាយប៉ាក)',
                academic_year TEXT DEFAULT 'មុខវិជ្ជាសិក្សា៖ គណិតវិទ្យា /កម្រិតថ្នាក់ ១០ /ក្នុងឆ្នាំ២០២៦'
            )
        """)

        cursor.execute("SELECT COUNT(*) FROM settings")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO settings (id) VALUES (1)")

        # ២. តារាង Users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                fullname TEXT NOT NULL
            )
        """)

        # ៣. តារាងសិស្ស
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_code TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                gender TEXT NOT NULL CHECK(gender IN ('ប្រុស', 'ស្រី')),
                phone TEXT DEFAULT '',
                photo TEXT DEFAULT 'default.png',
                status TEXT DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # ៤. តារាងពិន្ទុ
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS math_scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL UNIQUE,
                behavior REAL DEFAULT 0,
                attendance REAL DEFAULT 0,
                homework REAL DEFAULT 0,
                worksheet REAL DEFAULT 0,
                quiz REAL DEFAULT 0,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            )
        """)

        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            cursor.execute("INSERT INTO users (username, password, fullname) VALUES (?, ?, ?)", 
                           ("chiva", "123", "វ៉ាន់ ជីវ៉ា"))

        # បញ្ចូលសិស្សទាំង ៩ នាក់ជាស្ថាពរ
        cursor.execute("SELECT COUNT(*) FROM students")
        if cursor.fetchone()[0] == 0:
            seed_students = [
                (1, "STU-01", "ហៀប គីមស៊ាន", "ស្រី", 9, 9, 9, 49, 18),
                (2, "STU-02", "សុខ មិញគ័ង", "ប្រុស", 8, 9, 8, 48, 18),
                (3, "STU-03", "តាំង ជីងគ័ង", "ប្រុស", 8, 9, 9, 46, 18),
                (4, "STU-04", "ញឹម ម៉េងគៀង", "ស្រី", 9, 8, 8, 42, 18),
                (5, "STU-05", "គ្រុយ យូអុី", "ស្រី", 9, 9, 8, 40, 15),
                (6, "STU-06", "សែ ម៉ានីម", "ស្រី", 9, 8, 8, 40, 15),
                (7, "STU-07", "ឆៃ សុផានិត", "ប្រុស", 8, 8, 8, 39, 15),
                (8, "STU-08", "ញាណ សុគន្ធកញ្ញា", "ស្រី", 9, 8, 8, 37, 15),
                (9, "STU-09", "ស៊ីម ច័ន្ទបរមី", "ស្រី", 8, 9, 8, 36, 15),
            ]
            for s in seed_students:
                cursor.execute("INSERT INTO students (id, student_code, name, gender) VALUES (?, ?, ?, ?)", 
                               (s[0], s[1], s[2], s[3]))
                cursor.execute("""
                    INSERT INTO math_scores (student_id, behavior, attendance, homework, worksheet, quiz)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (s[0], s[4], s[5], s[6], s[7], s[8]))

        conn.commit()