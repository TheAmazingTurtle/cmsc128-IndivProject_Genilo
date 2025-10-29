from flask import Flask, request, session, render_template, jsonify, redirect, url_for
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
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        conn = db.get_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT id, fullname, password FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return jsonify({"error": "Invalid username or password"}), 401

        db_user_id, db_fullname, db_password = row
        if bcrypt.checkpw(password.encode("utf-8"), db_password):
            
            session["user_id"] = db_user_id

            return jsonify({"redirect": url_for("profile_page")}), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401

    except Exception as e:
        print("🔥 Login error:", e)
        return jsonify({"error": "Internal server error"}), 500
    
@app.route("/user-profile")
def profile_page():
    if "user_id" not in session:
        return render_template('login.html')
    
    return render_template("user-profile.html")

@app.route("/get-user-info")
def getUser():
    conn = db.get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT fullname, username, created_at FROM users WHERE id = ?', (session["user_id"],))
        row = cursor.fetchone()
        

        return jsonify({"fullname" : row[0], "username" : row[1], "created_at" : row[2]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        conn.close()

@app.route("/logout")
def logout():
    session.clear()
    return jsonify({"message": "Logged out"}), 200
    
@app.route('/')
def login_page():
    return render_template('login.html')

# routing

@app.route('/signup')
def signup_page():
    return render_template('signup.html')

if __name__ == "__main__":
    db.init()
    app.run(debug=True)