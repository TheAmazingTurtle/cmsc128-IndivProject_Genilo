
document.getElementById("login-form").addEventListener("submit", login)
document.getElementById("toggle-password").addEventListener("click", togglePasssword)

document.querySelectorAll("input").forEach((inputElement) => {
  inputElement.addEventListener("input", (e) => {
    e.preventDefault();

    const formButton = document.querySelector("button")

    hasProperUsernameInput = document.getElementById("username-input").value.length > 0
    hasProperPasswordInput = document.getElementById("password-input").value.length >= 8

    formButton.disabled = !hasProperPasswordInput || !hasProperUsernameInput
  });
});

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

function togglePasssword(event){
    event.preventDefault()

    const button = document.getElementById("toggle-password")
    const passwordField = document.getElementById("password-input")

    const isPasswordHidden = passwordField.getAttribute('type') == "password"

    button.textContent = isPasswordHidden ? "Hide" : "Show"
    passwordField.setAttribute('type', ( isPasswordHidden ? "text" : "password"))
}

async function login(event) {
    event.preventDefault();

    const username = document.getElementById('username-input').value;
    const password = document.getElementById('password-input').value;

    const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    

    if (!res.ok) {
        let msg = document.getElementById('login-msg');
        msg.classList.remove('hidden');
        msg.style.color = "red";
        msg.textContent = data.error;
        
        return
    } 

    document.getElementById("login-form").reset();
    window.location.href = data.redirect;
}
