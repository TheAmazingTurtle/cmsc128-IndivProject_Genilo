import sqlite3
import bcrypt

def get_connection():
    return sqlite3.connect("todo_webapp.db")

def init():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute  ("""
                       CREATE TABLE IF NOT EXISTS users (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            username TEXT UNIQUE NOT NULL,
                            password BLOB NOT NULL,
                            fullname TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            fave_place BLOB NOT NULL
                        );
                    """)
    
    conn.execute    ("""
                        CREATE TABLE IF NOT EXISTS todo_list (
                            task_id INTEGER PRIMARY KEY AUTOINCREMENT,
                            title TEXT NOT NULL,
                            description TEXT,
                            done_status BOOLEAN NOT NULL DEFAULT 0,
                            due_date DATE,
                            due_time TIME,
                            date_and_time_added DATETIME DEFAULT (datetime('now', 'localtime')),
                            priority TEXT CHECK(priority IN ('high', 'mid', 'low')) NOT NULL DEFAULT 'mid'
                        );
                    """)
    
    conn.commit()
    conn.close()
