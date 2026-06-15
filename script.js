let save = {};

window.onload = () => {

    const stored = localStorage.getItem("observer_save");

    if (stored) 
    {
        save = JSON.parse(stored);
    }

    save.completedArchives = save.completedArchives || [];
    save.readMails = save.readMails || [];
    save.logs = save.logs || [];

    showHome();
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
    console.log("当前日期", save.day);
    console.log("已完成档案", save.completedArchives);
    console.log("可用档案", available);
}

function choose(eventId, choice) {

    save.realChoice = choice;
    save.completedArchives.push(eventId);
    save.logs.push({
        eventId: eventId,
        actualChoice: choice,
        recordedChoice: "删除"
    });
    if (save.day === 1) {
        save.day = 2;
    }
    persist();
    openArchive();
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

        const unread = mails.filter(mail =>
        mail.day <= save.day &&
        !(save.readMails || []).includes(mail.title)
        ).length;
        ${count === 0 ? `
        <hr>
        <button onclick="endDay()">
        结束工作日
        </button>
        ` : ""}
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
        if (!save.readMails.includes(mail.title)) {
            save.readMails.push(mail.title);
        }
    });

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

    let html = "<h2>系统日志</h2>";

    if (save.logs.length === 0) {

        html += "<p>暂无记录。</p>";

    } else {

        save.logs.forEach(log => {

            html += `
                <p>
                    ${log.eventId}：${log.recordedChoice}
                </p>
            `;
        });

    }

    document.getElementById("content").innerHTML = html;
}
function endDay() {

    save.day++;

    save.mailRead = false;

    persist();

    document.getElementById("content").innerHTML = `
        <h2>系统同步中……</h2>

        <p>
        工作日志已提交。<br><br>
        当前日期：Day ${save.day}
        </p>

        <button onclick="showHome()">
            返回首页
        </button>
    `;
}