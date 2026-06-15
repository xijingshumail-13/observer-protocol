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
    save.forumReplies = save.forumReplies || [];
    save.flags = save.flags || {};
    save.flags = save.flags || {};
    save.realChoices = save.realChoices || {};
}

function replyLinLan() {
    save.flags.repliedLinLan = true;

    save.forumReplies.push({
        day: save.day,
        author: save.employeeId,
        content: "收到"
    });

    persist();

    openForum();
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

function renderText(text) {

    if (!text) {
        return "";
    }

    return text
        .replace(/\{employeeId\}/g, save.employeeId);
}

function checkCondition(condition) {

    initializeSave();

    if (!condition) {
        return true;
    }

    if (condition.startsWith("!")) {
        return !save.flags[condition.slice(1)];
    }

    return !!save.flags[condition];
}

async function showHome() {

    initializeSave();

    const eventResponse = await fetch("data/events.json");
    const events = await eventResponse.json();

    const mailResponse = await fetch("data/mails.json");
    const mails = await mailResponse.json();

    const archiveCount = events.filter(event =>
        event.day <= save.day &&
        !save.completedArchives.includes(event.id) &&
        checkCondition(event.condition)
    ).length;

    const unreadCount = mails.filter(mail =>
        mail.day <= save.day &&
        checkCondition(mail.condition) &&
        !save.readMails.includes(mail.title)
    ).length;

    document.getElementById("content").innerHTML = `
        <h2>欢迎回来，观测员 ${save.employeeId}</h2>

        <p>当前工作日：Day ${save.day}</p>

        <p>待处理档案：${archiveCount}</p>

        <p>未读邮件：${unreadCount}</p>

        <hr>

        ${
            archiveCount === 0
            ? `
                <button onclick="endDay()">
                    结束工作日
                </button>
            `
            : `
                <p style="color:#aa0000;">
                    尚有未处理档案，无法提交工作日志。
                </p>
            `
        }
    `;
}

async function openArchive() {

    initializeSave();

    const response = await fetch("data/events.json");
    const events = await response.json();

    const available = events.filter(event =>
        event.day <= save.day &&
        !save.completedArchives.includes(event.id) &&
        checkCondition(event.condition)
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

        <h3>${renderText(event.title)}</h3>

        <p>${renderText(event.text).replace(/\n/g, "<br>")}</p>

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
    save.realChoices[eventId] = choice;

    if (eventId === "E-031") {
        save.flags.day6Choice = choice;
    }

    persist();

    openArchive();
}

async function openMail() {

    initializeSave();

    const response = await fetch("data/mails.json");
    const mails = await response.json();

    const available = mails.filter(mail =>
        mail.day <= save.day &&
        checkCondition(mail.condition)
    );

    let html = "<h2>邮件</h2>";

    if (available.length === 0) {

        html += "<p>暂无邮件。</p>";

    } else {

        available.forEach(mail => {

            html += `
                <div class="mail">

                    <h3>${renderText(mail.title)}</h3>

                    <p>发件人：${mail.from}</p>

                    <p>${renderText(mail.content)}</p>

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

    const systemPosts = posts.filter(post =>
        post.day <= save.day &&
        checkCondition(post.condition)
    );

    const playerPosts = save.forumReplies.filter(
        post => post.day <= save.day
    );

    const available = [
        ...systemPosts,
        ...playerPosts
    ];
    available.sort((a, b) => a.day - b.day);
    let html = "<h2>员工论坛</h2>";

    if (available.length === 0) {

        html += "<p>暂无帖子。</p>";

    } else {

        available.forEach(post => {

            html += `
                <div class="post">

                    <strong>${renderText(post.author)}</strong>

                    <p>${renderText(post.content)}</p>

                    <hr>

                </div>
            `;
        });
    }
    if (save.day === 3 &&!save.flags.repliedLinLan) {

        html += `
            <hr>

            <button onclick="replyLinLan()">
                回复：“收到”
            </button>
        `;
    }
    if (
        save.day === 5 &&
        save.flags.repliedLinLan &&
        !save.flags.deniedFakePost
    ) {

        html += `
            <hr>

            <button onclick="denyFakePost()">
                回复：“这不是我发的。”
            </button>
        `;
    }
    if (
        save.day === 6 &&
        save.flags.deniedFakePost &&
        !save.flags.questionedLinLan
    ) {

        html += `
            <hr>

            <button onclick="questionLinLan()">
                回复：“你是谁？”
            </button>
        `;
    }
    document.getElementById("content").innerHTML = html;
}

function denyFakePost() {

    save.flags.deniedFakePost = true;

    save.forumReplies.push({
        day: save.day,
        author: save.employeeId,
        content: "这不是我发的。"
    });

    persist();

    openForum();
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

async function endDay() {

    initializeSave();

    const response = await fetch("data/events.json");
    const events = await response.json();

    const remaining = events.filter(event =>
        event.day === save.day &&
        !save.completedArchives.includes(event.id) &&
        checkCondition(event.condition)
    );

    console.log("当前Day:", save.day);
    console.log("已完成:", save.completedArchives);
    console.log("剩余档案:", remaining);

    if (remaining.length > 0) {

        document.getElementById("content").innerHTML = `
            <h2>系统提示</h2>

            <p>
                尚有 ${remaining.length} 份档案待处理。<br><br>
                请完成全部工作后再提交日志。
            </p>

            <button onclick="openArchive()">
                前往处理
            </button>
        `;

        return;
    }

    /* 真正推进日期 */
    save.day++;

    persist();

    console.log("推进后Day:", save.day);

    /* Day5结束进入Day6时的特殊结算 */
    if (
        save.day === 6 &&
        save.flags.deniedFakePost
    ) {

        document.getElementById("content").innerHTML = `
            <h2>系统同步中……</h2>

            <p>
                检测到身份冲突。<br><br>
                请确认当前登录者身份。
            </p>

            <button onclick="showHome()">
                返回首页
            </button>
        `;

        return;
    }

    /* Day3结束后的特殊警告 */
    if (
        save.day === 4 &&
        save.flags.repliedLinLan
    ) {

        document.getElementById("content").innerHTML = `
            <h2>系统同步中……</h2>

            <p>
                检测到未授权信息交换。<br><br>
                请勿讨论不存在的信息。
            </p>

            <button onclick="showHome()">
                返回首页
            </button>
        `;

        return;
    }

    /* 普通结算 */
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

    if (!confirm(
        "警告：执行记忆清除后，所有观测记录将永久丢失。\n\n确认继续？"
    )) {
        return;
    }
    if (
        save.flags.deniedFakePost &&
        confirm("检测到异常记忆残留，是否执行深度清除？")
    )

    localStorage.removeItem("observer_save");

    alert("记忆清除完成。");

    location.reload();
}
function questionLinLan() {

    save.flags.questionedLinLan = true;

    save.forumReplies.push({
        day: save.day,
        author: save.employeeId,
        content: "你是谁？"
    });

    persist();

    openForum();
}