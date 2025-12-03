async function initPage(){
    try {
        const userInfo = await getUserInfo();

        if (!userInfo) {
            window.location.href = "/";
            return;
        }

        displayUserInfo(userInfo.fullname, userInfo.username, userInfo.created_at, userInfo.id);
    } catch (err) {
        console.error("Failed to initialize profile:", err);
    }
}

async function getUserInfo(){
    const response = await fetch('/user-info');
    const data = await response.json();

    if (!response.ok) {
        console.error("Error:", data.error);
        return [];
    } 

    return data;
}

function displayUserInfo(fullname, username, created_at, id){
    document.querySelector("h1").textContent = `Welcome, ${fullname}!`

    const formattedDate = new Date(created_at).toLocaleDateString("en-US", {year: "numeric", month: "long", day: "numeric"});
    document.getElementById("user-id").textContent = `ID #: ${id}`
    document.getElementById("created-at").textContent = `Been a user since ${formattedDate}`
}

initPage()