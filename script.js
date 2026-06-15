let save = {};

window.onload = () => {

    const stored = localStorage.getItem("observer_save");

    if (stored) {

        save = JSON.parse(stored);

        initializeSave();

        enterDesktop();
    }
};

function initializeSave() {

    save.completedArchives = save.completedArchives || [];
    save.readMails = save.readMails || [];
    save.logs = save.logs || [];
}

function login() {

    const id = document.getElementById("employee-id").value.trim();

    if (!id) {

        alert("请输入员工编号");

        return;
    }

    save = {

        employeeId: id,

        day: 1,

        completedArchives: [],

        readMails: [],

        logs: []
    };

    persist();

    enterDesktop();
}

function enterDesktop() {

    document.title = "BIS 内网";

    document.getElementById("login-screen")
        .classList.add("hidden");

    document.getElementById("desktop")
        .classList.remove("hidden");

    showHome();
}

function persist() {

    localStorage.setItem(
        "observer_save",
        JSON.stringify(save)
    );
}
async function showHome() {

    initializeSave();

    const eventResponse = await fetch("data/events.json");
    const events = await eventResponse.json();

    const mailResponse = await fetch("data/mails.json");
    const mails = await mailResponse.json();

    const archiveCount = events.filter(event =>
        event.day <= save.day &&
        !save.completedArchives.includes(event.id)
    ).length;

    const unreadCount = mails.filter(mail =>
        mail.day <= save.day &&
        !save.readMails.includes(mail.title)
    ).length;

    document.getElementById("content").innerHTML = `
        <h2>欢迎回来，观测员 ${save.employeeId}</h2>

        <p>当前工作日：Day ${save.day}</p>

        <p>待处理档案：${archiveCount}</p>

        <p>未读邮件：${unreadCount}</p>

        ${
            archiveCount === 0
            ? `
            <hr>

            <button onclick="endDay()">
                结束工作日
            </button>
            `
            : ""
        }
    `;
}

async function openArchive() {

    initializeSave();

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

    let html = `
        <h2>${event.id}</h2>

        <h3>${event.title}</h3>

        <p>${event.text.replace(/\n/g, "<br>")}</p>

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

    initializeSave();

    if (!save.completedArchives.includes(eventId)) {

        save.completedArchives.push(eventId);
    }

    save.logs.push({

        eventId: eventId,

        actualChoice: choice,

        recordedChoice: "删除"
    });

    persist();

    openArchive();
}
async function openMail() {

    initializeSave();

    const response = await fetch("data/mails.json");
    const mails = await response.json();

    const available = mails.filter(mail =>
        mail.day <= save.day
    );

    let html = "<h2>邮件</h2>";

    if (available.length === 0) {

        html += "<p>暂无邮件。</p>";

    } else {

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
    }

    document.getElementById("content").innerHTML = html;
}

async function openForum() {

    const response = await fetch("data/forum.json");
    const posts = await response.json();

    const available = posts.filter(post =>
        post.day <= save.day
    );

    let html = "<h2>员工论坛</h2>";

    if (available.length === 0) {

        html += "<p>暂无帖子。</p>";

    } else {

        available.forEach(post => {

            html += `
                <div class="post">

                    <strong>${post.author}</strong>

                    <p>${post.content}</p>

                    <hr>

                </div>
            `;
        });
    }

    document.getElementById("content").innerHTML = html;
}

function openLog() {

    initializeSave();

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

function resetSave() {

    if (!confirm("确认删除存档？")) {

        return;
    }

    localStorage.removeItem("observer_save");

    location.reload();
}