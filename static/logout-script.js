document.getElementById("logout").addEventListener("click", logout);

async function logout(event) {
    event.preventDefault();

    try {
        const res = await fetch("/logout");
        const data = await res.json();

        if (res.ok) {
            console.log(data.message)
            window.location.replace("/login"); 
        } else {
            console.log("Logout failed.")
        }
    } catch (err) {
        console.error("Logout error:", err);
    }
}