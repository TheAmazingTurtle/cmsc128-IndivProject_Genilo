from flask import Flask, request, jsonify, send_from_directory
import sqlite3, os

app = Flask(__name__, static_folder="../frontend", static_url_path="")

dbName = "todo_list_app.db"

# Serve frontend
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

# Serve static files (CSS/JS)
@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(app.static_folder, path)

# API routes
@app.route("/todo_list", methods=["GET"])
def get_todos():
    conn = sqlite3.connect(dbName)
    c = conn.cursor()
    c.execute("SELECT * FROM todo_list")

    tasks = [
        {
            "task_id": row[0],
            "title": row[1],
            "description": row[2],
            "done_status": bool(row[3]),
            "due_date": row[4],
            "due_time": row[5],
            "date_and_time_added": row[6],
            "priority": row[7]
        }
        for row in c.fetchall()
    ]

    conn.close()
    return jsonify(tasks)

@app.route("/todo_list", methods=["POST"])
def add_todo():
    data = request.json

    title       = data.get("title")
    description = data.get("description")
    due_date    = data.get("dueDate")   # match JS naming
    due_time    = data.get("dueTime")   # match JS naming
    priority    = data.get("priority")

    if not title:
        return jsonify({"error": "Title is required"}), 400

    conn = sqlite3.connect(dbName)
    c = conn.cursor()
    c.execute(
        """
        INSERT INTO todo_list 
            (title, description, due_date, due_time, priority) 
        VALUES (?, ?, ?, ?, ?);
        """,
        (title, description, due_date, due_time, priority)
    )
    
    conn.commit()
    conn.close()
    return jsonify({"message": "Task added!"}), 201

@app.route("/todo_list/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    conn = sqlite3.connect(dbName)
    c = conn.cursor()
    c.execute("DELETE FROM todo_list WHERE task_id = ?", (task_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": f"Task {task_id} deleted!"}), 200

@app.route("/todo_list/<int:task_id>", methods=["PUT"])
def edit_todo(task_id):
    data = request.json
    title = data.get("title")
    description = data.get("description")
    due_date = data.get("dueDate")
    due_time = data.get("dueTime")
    priority = data.get("priority")

    if not title:
        return jsonify({"error": "Title is required"}), 400

    conn = sqlite3.connect(dbName)
    c = conn.cursor()
    c.execute(
        """
        UPDATE todo_list
        SET title = ?, description = ?, due_date = ?, due_time = ?, priority = ?
        WHERE task_id = ?;
        """, 
        (title, description, due_date, due_time, priority, task_id)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "Task updated!"}), 200

@app.route("/todo_list/<int:task_id>/done", methods=["PATCH"])
def toggle_done(task_id):
    data = request.json
    new_status = bool(data.get("done_status", False))

    conn = sqlite3.connect(dbName)
    c = conn.cursor()
    c.execute(
        """
            UPDATE todo_list
            SET done_status = ?
            WHERE task_id = ?;
        """, 
        (new_status, task_id)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Task status updated!"}), 200

if __name__ == "__main__":
    if not os.path.exists(dbName):
        conn = sqlite3.connect(dbName)
        c = conn.cursor()
        c.execute('''CREATE TABLE todo_list (
                        task_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        description TEXT,
                        done_status BOOLEAN NOT NULL DEFAULT 0,
                        due_date DATE,
                        due_time TIME,
                        date_and_time_added DATETIME DEFAULT (datetime('now', 'localtime')),
                        priority TEXT CHECK(priority IN ('high', 'mid', 'low')) NOT NULL DEFAULT 'mid'
                    )''')
        conn.commit()
        conn.close()
    app.run(debug=True)