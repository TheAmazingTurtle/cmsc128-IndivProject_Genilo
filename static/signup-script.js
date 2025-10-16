let usernameCheck = false
let passwordCheck = false
let fullnameCheck = false
let authCheck = false

document.getElementById("signup-form").addEventListener("submit", addUser)
document.getElementById("password-input").addEventListener("change", verifyPassword)
document.getElementById("username-input").addEventListener("change", verifyUsername)
document.getElementById("fullname-input").addEventListener("change", verifyFullname)
document.getElementById("fave-place-input").addEventListener("change", verifyAuth)
document.getElementById("toggle-password").addEventListener("click", togglePasssword)

document.getElementById("password-input").addEventListener("input", (e) => {
    e.preventDefault()

    const password = document.getElementById("password-input").value;
    const passwordToggle = document.getElementById("toggle-password")

    if (password.length == 0){
        passwordToggle.classList.add("hidden")
    } else {
        passwordToggle.classList.remove("hidden")
    }
})

document.querySelectorAll("input").forEach((inputElement) => {
  inputElement.addEventListener("input", (e) => {
    e.preventDefault();

    document.getElementById("signup-msg").classList.add("hidden")

    inputElement.classList.remove("red-outline")
    inputElement.nextElementSibling.classList.add("hidden")
  });
});


function togglePasssword(event){
    event.preventDefault()

    const button = document.getElementById("toggle-password")
    const passwordField = document.getElementById("password-input")

    const isPasswordHidden = passwordField.getAttribute('type') == "password"

    button.textContent = isPasswordHidden ? "Hide" : "Show"
    passwordField.setAttribute('type', ( isPasswordHidden ? "text" : "password"))
}


async function verifyUsername(event){
    event.preventDefault();

    const username = document.getElementById("username-input").value;

    if (username.length == 0){
        usernameCheck = false
        showErrorMsg("username-msg", "This field is required.", "username-input");
        return
    }

    for (const c of username) {
        if (c >= '0' && c <= '9' || c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c == '_' || c == '.') {
            continue;
        } 

        usernameCheck = false
        showErrorMsg("username-msg", "Usernames can only use letters, numbers, underscores and periods.", "username-input");
        return
    }

    const usernameList = await getAllUsernames()
    const usernameSet = new Set(usernameList)
    if (usernameSet.has(username)){
        usernameCheck = false
        showErrorMsg("username-msg", "A user with that username already exists.", "username-input")
    }

    usernameCheck = true
    checkSignupCompleteness()
}

async function verifyPassword(event) {
    event.preventDefault();

    const password = document.getElementById("password-input").value;

    if (password.length < 8){
        passwordCheck = false
        showErrorMsg("password-msg", "Create a password at least 8 characters long.", "password-input");
        return
    }

    let numberCheck = false;
    let letterCheck = false;
    let symbolCheck = false;
    for (const c of password) {
        if (c >= '0' && c <= '9') {
            numberCheck = true;
            continue;
        } 

        if (c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z') {
            letterCheck = true;
            continue;
        }

        symbolCheck = true
    }

    if (!numberCheck || !letterCheck || !symbolCheck){
        passwordCheck = false
        showErrorMsg("password-msg", "Create a password with at least one letter, number, and symbol.", "password-input");
        return
    }

    passwordCheck = true
    checkSignupCompleteness()
}

async function verifyFullname(event) {
    event.preventDefault();

    const fullname = document.getElementById("fullname-input").value;

    if (fullname.length == 0){
        fullnameCheck = false
        showErrorMsg("fullname-msg", "This field is required.", "fullname-input"); 
        return
    }

    fullnameCheck = true
    checkSignupCompleteness()
}

async function verifyAuth(event) {
    event.preventDefault();

    const authAns = document.getElementById("fave-place-input").value;

    if (authAns.length == 0){
        authCheck = false
        showErrorMsg("fave-place-msg", "This field is required.", "fave-place-input"); 
        return
    }

    authCheck = true
    checkSignupCompleteness()
}

function showErrorMsg(msgID, message, inputID){
    const container = document.getElementById(msgID)
    const inputField = document.getElementById(inputID)

    container.textContent = message
    container.classList.remove("hidden")
    inputField.classList.add("red-outline")

    checkSignupCompleteness()
}

function checkSignupCompleteness(){
    const formButton = document.querySelector("button")

    formButton.disabled = !usernameCheck || !passwordCheck || !fullnameCheck || !authCheck
}

function resetForm(){
    document.querySelector("button").disabled = true
    document.getElementById('signup-form').reset();
}

async function addUser(event) {
    event.preventDefault();

    const username = document.getElementById('username-input').value;
    const password = document.getElementById('password-input').value;
    const fullname = document.getElementById('fullname-input').value;
    const authAns = document.getElementById('fave-place-input').value;

    const response = await fetch('/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, fullname, authAns})
    });

    const data = await response.json();
    const outmsg = document.getElementById('signup-msg');
    outmsg.classList.remove("hidden")

    if (response.ok) {
        outmsg.textContent = data.message;
        outmsg.style.color = "green";
        resetForm();
    } else {
        outmsg.textContent = data.error || "Something went wrong.";
        outmsg.style.color = "red";
    }    
}

async function getAllUsernames() {
    const response = await fetch('/get-username-list');
    const data = await response.json();

    if (!response.ok) {
        console.error("Error:", data.error);
        return [];
    } 

    return data.usernameList;
}