let save = {};

window.onload = () => {

    const stored = localStorage.getItem("observer_save");

    if (stored) {

        save = JSON.parse(stored);

        enterDesktop();
    }
};

function login() {

    const id = document.getElementById("employee-id").value;

    if (!id) {
        alert("请输入员工编号");
        return;
    }

    save.employeeId = id;
    save.day = 1;

    persist();

    enterDesktop();
}

function enterDesktop() {

    document.title = "BIS 内网";

    document.getElementById("login-screen")
        .classList.add("hidden");

    document.getElementById("desktop")
        .classList.remove("hidden");

    document.getElementById("content")
        .innerHTML =
        `
        欢迎回来，观测员 ${save.employeeId}。<br><br>
        当前工作日：Day ${save.day}
        `;
    showHome();
}

function persist() {

    localStorage.setItem(
        "observer_save",
        JSON.stringify(save)
    );
}

async function openArchive() {

    const response = await fetch("data/events.json");

    const events = await response.json();

    const event = events[0];

    let html =
        `
        <h2>${event.id}</h2>

        <h3>${event.title}</h3>

        <p>${event.text.replace(/\n/g,"<br>")}</p>

        <hr>
        `;

    event.choices.forEach(choice => {

        html +=
        `
        <button onclick="choose('${choice}')">
            ${choice}
        </button>
        `;
    });

    document.getElementById("content").innerHTML = html;
}

function choose(choice) {

    save["E-023"] = choice;

    save.day = 2;

    persist();

    document.getElementById("content").innerHTML =
    `
    <p>已记录决定：</p>

    <h3>${choice}</h3>

    <p>
    系统已更新。<br><br>
    当前工作日：Day ${save.day}
    </p>
    `;
}

function resetSave() {

    if (!confirm("确认删除存档？")) {
        return;
    }

    localStorage.removeItem("observer_save");

    location.reload();
}
function showHome() {

    document.getElementById("content").innerHTML = `
        <h2>欢迎回来，观测员 ${save.employeeId}</h2>

        <p>当前工作日：Day ${save.day}</p>

        <p>待处理档案：1</p>

        <p>未读邮件：${save.mailRead ? 0 : 1}</p>
    `;
}
async function openMail() {

    const response = await fetch("data/mails.json");

    const mails = await response.json();

    const available = mails.filter(
        m => m.day <= save.day
    );

    let html = "<h2>邮件</h2>";

    available.forEach(mail => {

        html += `
            <div class="mail">
                <h3>${mail.title}</h3>

                <p>发件人：${mail.from}</p>

                <p>${mail.content}</p>

                <hr>
            </div>
        `;
    });

    save.mailRead = true;

    persist();

    document.getElementById("content").innerHTML = html;
}
async function openForum() {

    const response = await fetch("data/forum.json");

    const posts = await response.json();

    const available = posts.filter(
        p => p.day <= save.day
    );

    let html = "<h2>员工论坛</h2>";

    available.forEach(post => {

        html += `
            <div class="post">
                <strong>${post.author}</strong>

                <p>${post.content}</p>

                <hr>
            </div>
        `;
    });

    document.getElementById("content").innerHTML = html;
}
