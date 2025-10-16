document.getElementById("logout").addEventListener("click", logout);

async function initPage(){
    try {
        const userInfo = await getUserInfo();

        if (!userInfo) {
            window.location.href = "/";
            return;
        }

        displayUserInfo(userInfo.fullname, userInfo.username, userInfo.created_at);
    } catch (err) {
        console.error("Failed to initialize profile:", err);
    }
}

async function getUserInfo(){
    const response = await fetch('/get-user-info');
    const data = await response.json();

    if (!response.ok) {
        console.error("Error:", data.error);
        return [];
    } 

    return data;
}

function displayUserInfo(fullname, username, created_at){
    document.querySelector("h1").textContent = `Welcome, ${fullname}!`

    const formattedDate = new Date(created_at).toLocaleDateString("en-US", {year: "numeric", month: "long", day: "numeric"});
    document.getElementById("created-at").textContent = `Been a user since ${formattedDate}`
}

async function logout(event) {
    event.preventDefault();

    try {
        const res = await fetch("/logout");
        const data = await res.json();


        if (res.ok) {
            console.log(data.message)

            setTimeout(() => {
                window.location.href = "/"; 
            }, 1000);
        } else {
            console.log("Logout failed.")
        }
    } catch (err) {
        console.error("Logout error:", err);
    }
}

initPage()