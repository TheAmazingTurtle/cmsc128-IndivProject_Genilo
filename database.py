import sqlite3

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
                        CREATE TABLE IF NOT EXISTS task (
                            task_id INTEGER PRIMARY KEY AUTOINCREMENT,
                            username TEXT UNIQUE NOT NULL,
                            title TEXT NOT NULL,
                            done_status BOOLEAN NOT NULL DEFAULT 0,
                            due_date DATE,
                            due_time TIME,
                            date_and_time_added DATETIME DEFAULT (datetime('now', 'localtime')),
                            priority TEXT CHECK(priority IN ('high', 'mid', 'low')) NOT NULL DEFAULT 'mid',
                            FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
                        );
                    """)
    
    conn.execute    ("""
                        CREATE TABLE IF NOT EXISTS collaborators (
                            owner_username TEXT NOT NULL,
                            collab_username TEXT NOT NULL,
                            added_at DATETIME DEFAULT (datetime('now', 'localtime')),
                            PRIMARY KEY (owner_username, collab_username),
                            FOREIGN KEY (owner_username) REFERENCES users(username) ON DELETE CASCADE,
                            FOREIGN KEY (collab_username) REFERENCES users(username) ON DELETE CASCADE
                        );
                    """)
    

    
    conn.commit()
    conn.close()
