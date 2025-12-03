from flask import Flask, request, session, render_template, jsonify, redirect, url_for, flash
import key
import bcrypt
import database as db

app = Flask(__name__)

app.secret_key = key.secretKey

@app.route("/add-user", methods=["POST"])
def add_user():
    data = request.get_json()

    username = data.get('username')
    password = data.get('password')
    fullname = data.get('fullname')
    fave_place = data.get('authAns')

    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt)

    salt = bcrypt.gensalt()
    hashed_fave_place = bcrypt.hashpw(fave_place.encode('utf-8'), salt)


    conn = db.get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (username, password, fullname, fave_place) VALUES (?, ?, ?, ?)",
            (username, hashed_password, fullname, hashed_fave_place)
        )
        conn.commit()
        print("✅ User created successfully.")
        return jsonify({"message": "Account created successfully!"}), 201
    except Exception:
        print("⚠️ Username already exists.")
        return jsonify({"error": "Username already exists."}), 409
    finally:
        conn.close()

@app.route("/add-task", methods=["POST"])
def add_task():
    data = request.get_json()

    title = data.get("title")
    due_date = data.get("dueDate")
    due_time = data.get("dueTime")
    priority = data.get("priority")

    if not title:
        return jsonify({"error": "Title is required"}), 400

    conn = db.get_connection()
    c = conn.cursor()
    
    try:
        c.execute(
            """
            INSERT INTO task 
                (username, title, due_date, due_time, priority) 
            VALUES (?, ?, ?, ?, ?);
            """,
            (session["username"], title, due_date, due_time, priority)
        )
        conn.commit()
        print("✅ Task created successfully.")
        return jsonify({"message": "To-Do added successfully"}), 201
    except Exception:
        print("⚠️ Task creation unsuccessful.")
        return jsonify({"error": "Add task failed"}), 409
    finally:
        conn.close()

@app.route("/<collab_username>/add-collab-task", methods=["POST"])
def add_collab_task(collab_username):
    data = request.get_json()

    title = data.get("title")
    due_date = data.get("dueDate")
    due_time = data.get("dueTime")
    priority = data.get("priority")

    if not title:
        return jsonify({"error": "Title is required"}), 400

    conn = db.get_connection()
    c = conn.cursor()
    
    try:
        c.execute(
            """
            INSERT INTO task 
                (username, title, due_date, due_time, priority) 
            VALUES (?, ?, ?, ?, ?);
            """,
            (collab_username, title, due_date, due_time, priority)
        )
        conn.commit()
        print("✅ Task created successfully.")
        return jsonify({"message": "To-Do added successfully"}), 201
    except Exception:
        print("⚠️ Task creation unsuccessful.")
        return jsonify({"error": "Add task failed"}), 409
    finally:
        conn.close()

@app.route("/add-collab", methods=["POST"])
def add_collab():
    data = request.get_json()

    collab_username = data.get('collabUsername')

    conn = db.get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE username = ?", (collab_username,))

    if cursor.fetchone() is None:
        print("⚠️ User does not exist.")
        return jsonify({"error": "User does not exist."}), 409
    
    if session["username"] == collab_username:
        print("⚠️ Cannot collab with self.")
        return jsonify({"error": "Cannot collab with self."}), 409    

    try:
        cursor.execute(
            "INSERT INTO collaborators (owner_username, collab_username) VALUES (?, ?)",
            (session["username"], collab_username)
        )
        conn.commit()
        print("✅ Collab linked successfully.")
        return jsonify({"message": "Collab linked successfully."}), 201
    except Exception:
        print("⚠️ Collab already linked exists.")
        return jsonify({"error": "Collab already linked exists."}), 409
    finally:
        conn.close()

@app.route("/get-collab")
def get_collab():
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT owner_username FROM collaborators WHERE collab_username = ?", (session["username"],))

    collab = [
        {
            "username" : row[0]
        }
        for row in cursor.fetchall()
    ]

    conn.close()
    return jsonify(collab)

@app.route("/get-collabee")
def get_collabee():
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT collab_username FROM collaborators WHERE owner_username = ?", (session["username"],))

    collab = [
        {
            "username" : row[0]
        }
        for row in cursor.fetchall()
    ]

    conn.close()
    return jsonify(collab)

@app.route("/fetch-tasks")
def get_todos():
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT task_id, title, done_status, due_date, due_time, date_and_time_added, priority FROM task WHERE username = ?", (session["username"],))

    tasks = [
        {
            "id": row[0],
            "title": row[1],
            "doneStatus": bool(row[2]),
            "dueDate": row[3],
            "dueTime": row[4],
            "createdOn": row[5],
            "priority": row[6]
        }
        for row in cursor.fetchall()
    ]

    conn.close()
    return jsonify(tasks)

@app.route("/<collab_username>/fetch-collab-tasks")
def get_collab_todos(collab_username):
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT task_id, title, done_status, due_date, due_time, date_and_time_added, priority FROM task WHERE username = ?", (collab_username,))

    tasks = [
        {
            "id": row[0],
            "title": row[1],
            "doneStatus": bool(row[2]),
            "dueDate": row[3],
            "dueTime": row[4],
            "createdOn": row[5],
            "priority": row[6]
        }
        for row in cursor.fetchall()
    ]

    conn.close()
    return jsonify(tasks)

@app.route("/<int:task_id>/toggle-done", methods=["PATCH"])
def toggle_done(task_id):
    data = request.json
    new_status = bool(data.get("done_status"))

    conn = db.get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
                UPDATE task
                SET done_status = ?
                WHERE task_id = ?;
            """, 
            (new_status, task_id)
        )
        conn.commit()
        return jsonify({"message": "Task status updated!"}), 200
    except:
        return jsonify({"error": "Failed to update status"}), 200
    finally:
        conn.close()

@app.route("/<int:task_id>/delete-task", methods=["DELETE"])
def delete_task(task_id):
    conn = db.get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM task WHERE task_id = ?", (task_id,))
        conn.commit()
        return jsonify({"message": f"Task {task_id} deleted!"}), 200
    except:
        return jsonify({"error": "Unsuccessful Deletion"}), 200
    finally:
        conn.close()

@app.route("/<username>/delete-collab", methods=["DELETE"])
def delete_collab(username):
    conn = db.get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("DELETE FROM collaborators WHERE owner_username = ? and collab_username = ?", (session["username"], username))
        conn.commit()
        return jsonify({"message": f"Collab with {username} deleted!"}), 200
    except:
        return jsonify({"error": "Unsuccessful Deletion"}), 200
    finally:
        conn.close()

@app.route("/get-username-list")
def getAllUsernames():
    conn = db.get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT username FROM users')
        output = cursor.fetchall()

        usernameList = [row[0] for row in output]
        print(usernameList)
        return jsonify({"usernameList" : usernameList}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    conn = db.get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id, fullname, password FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({"error": "Invalid username or password"}), 500

        db_user_id, db_fullname, db_password = row
        if bcrypt.checkpw(password.encode("utf-8"), db_password):
            session["user_id"] = db_user_id
            session["username"] = username
            return jsonify({"redirect": url_for("profile_page")}), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 500
    except Exception as e:
        print("🔥 Login error:", e)
        return jsonify({"error": "Internal server error"}), 500
    finally:
        conn.close()
    
@app.route("/user-profile")
def profile_page():
    if "user_id" not in session:
        return render_template('index.html')
    
    session["active"] = True
    return render_template("user-profile.html")

@app.route("/user-info")
def getUser():
    conn = db.get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT fullname, username, created_at, id FROM users WHERE id = ?', (session["user_id"],))
        row = cursor.fetchone()
        

        return jsonify({"fullname" : row[0], "username" : row[1], "created_at" : row[2], "id" : row[3]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()
    
@app.after_request
def add_no_cache_headers(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.route("/logout")
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200
    
@app.route('/')
@app.route('/login')
def login_page():
    session.clear()
    return render_template('index.html')

@app.route('/signup')
def signup_page():
    session.clear()
    return render_template('signup.html')

@app.route('/account-recovery')
def account_recovery():
    session.clear()
    return render_template('recover-account.html')

@app.route('/to-do-list')
def to_do_page():
    return render_template('my-todo-list.html')

@app.route('/collab-list')
def collab_page():
    return render_template('collab-list.html')

if __name__ == "__main__":
    db.init()
    app.run(debug=True)