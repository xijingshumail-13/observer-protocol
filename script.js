let save = {};

window.onload = () => {

    const stored = localStorage.getItem("observer_save");

    if (stored) 
    {
        save = JSON.parse(stored);
    }

    save.completedArchives = save.completedArchives || [];

    enterDesktop();
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

    const available = events.filter(event =>
        event.day <= save.day &&
        !save.completedArchives.includes(event.id)
    );
    if (available.length === 0) {

        document.getElementById("content").innerHTML = `
            <h2>今日档案</h2>

            <p>暂无待处理档案。</p>
        `;

        return;
    }
    const event = available[0];
    let html =
        `
        <h2>${event.id}</h2>

        <h3>${event.title}</h3>

        <p>${event.text.replace(/\n/g,"<br>")}</p>

        <hr>
        `;

    event.choices.forEach(choice => {

        html += `
        <button onclick="choose('${event.id}','${choice}')">
            ${choice}
        </button>
        `; 
    });

    document.getElementById("content").innerHTML = html;
}

function choose(eventId, choice) {

    save.realChoice = choice;
    save.completedArchives.push(eventId);
    save.systemLog = "删除";
    if (save.day === 1) {
        save.day = 2;
    }
    persist();

    document.getElementById("content").innerHTML = `
        <h2>处理完成</h2>

        <p>档案：${eventId}</p>

        <p>你的决定：</p>

        <h3>${choice}</h3>

        <p>
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

    fetch("data/events.json")
    .then(r => r.json())
    .then(events => {

        const count = events.filter(event =>
            event.day <= save.day &&
            !save.completedArchives.includes(event.id)
        ).length;

    document.getElementById("content").innerHTML = `
        <h2>欢迎回来，观测员 ${save.employeeId}</h2>

        <p>当前工作日：Day ${save.day}</p>

        <p>待处理档案：${count}</p>

        <p>未读邮件：${save.mailRead ? 0 : 1}</p>
    `;
});
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
function openLog() {

    document.getElementById("content").innerHTML = `
        <h2>系统日志</h2>

        <p>
        E-023：
        ${save.systemLog || "无记录"}
        </p>
    `;
}
