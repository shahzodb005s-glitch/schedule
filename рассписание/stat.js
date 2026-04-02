const i18n = {
    ru: {
        total: "Всего учащихся",
        best: "Лучший класс",
        avg: "Средний показатель",
        title: "🏆 Общий рейтинг",
        inp: "📝 Ввод",
        btn: "Сохранить",
        confirm: "Удалить рейтинг?"
    },
    uz: {
        total: "Jami o'quvchilar",
        best: "Eng yaxshi sinf",
        avg: "O'rtacha",
        title: "🏆 Reyting",
        inp: "📝 Kiritish",
        btn: "Saqlash",
        confirm: "O'chirasizmi?"
    }
};

let lang = localStorage.getItem('school_lang') || 'ru';

let db = JSON.parse(localStorage.getItem('school_v16')) || {
    classes: [],
    classRatings: {},
    teachers: 0,
    monthlyData: {},
    period: { year: 2026, month: "03" }
};

// ================= INIT (FIXED SAFETY) =================
function init() {
    if (!document.getElementById("statClassSelect")) return;
    setupClasses();
    setupDate();
    renderStats();
}

// ================= CLASS SELECT (FIXED RESET) =================
function setupClasses() {
    const sel = document.getElementById("statClassSelect");
    if (!sel) return;

    sel.innerHTML = ""; // FIX: очищаем всегда

    const option = document.createElement("option");
    option.value = "";
    option.textContent = "-- Выберите --";
    sel.appendChild(option);

    (db.classes || []).forEach(c => {
        sel.add(new Option(c, c));
    });
}

// ================= DATE (SAFE FIX) =================
function setupDate() {
    const y = document.getElementById("yearSelect");
    const m = document.getElementById("monthSelect");

    if (!y || !m) return;

    if (y.options.length === 0) {
        for (let i = 2024; i <= 2030; i++) {
            y.add(new Option(i, i));
        }
    }

    if (m.options.length === 0) {
        ["01","02","03","04","05","06","07","08","09","10","11","12"]
            .forEach(mm => m.add(new Option(mm, mm)));
    }

    y.value = db.period?.year || 2026;
    m.value = db.period?.month || "03";

    y.onchange = m.onchange = () => {
        db.period = { year: y.value, month: m.value };
        saveDB();
        renderStats();
    };
}

// ================= SAVE DB =================
function saveDB() {
    localStorage.setItem("school_v16", JSON.stringify(db));
}

// ================= RENDER (FIXED SAFETY + LAST DATA BUG) =================
function renderStats() {
    const wrap = document.getElementById("ratingListWrapper");
    if (!wrap) return;

    let list = Object.keys(db.classRatings || {}).map(cls => ({
        cls,
        score: db.classRatings[cls]
    })).sort((a,b) => b.score - a.score);

    let html = "";
    let sum = 0;
    let best = "-";
    let max = -1;

    list.forEach(i => {
        sum += i.score;

        if (i.score > max) {
            max = i.score;
            best = i.cls;
        }

        let color =
            i.score >= 80 ? "bg-high" :
            i.score >= 50 ? "bg-mid" : "bg-low";

        html += `
        <div class="rating-item" ondblclick="deleteRating('${i.cls}')">
            <div class="rating-header">
                <span>${i.cls}</span>
                <span>${i.score}%</span>
            </div>
            <div class="progress-bg">
                <div class="progress-bar ${color}" style="width:${i.score}%"></div>
            </div>
        </div>`;
    });

    wrap.innerHTML = html || "<p style='text-align:center;color:#999'>Нет данных</p>";

    const bestEl = document.getElementById("valBest");
    const avgEl = document.getElementById("valAvg");
    const totalEl = document.getElementById("valTotal");
    const teacherEl = document.getElementById("valTeachers");

    if (bestEl) bestEl.innerText = best + (max >= 0 ? ` (${max}%)` : "");
    if (avgEl) avgEl.innerText = list.length ? Math.round(sum / list.length) + "%" : "0%";

    // FIX: monthlyData может быть пустым → не падаем
    let totalStudents = 0;
    const values = Object.values(db.monthlyData || {});

    if (values.length > 0) {
        const last = values[values.length - 1];
        Object.values(last || {}).forEach(c => {
            totalStudents += (c.b || 0) + (c.g || 0);
        });
    }

    if (totalEl) totalEl.innerText = totalStudents;

    const t = db.teachers;

    if (teacherEl) {
        if (Array.isArray(t)) teacherEl.innerText = t.length;
        else if (typeof t === "number") teacherEl.innerText = t;
        else teacherEl.innerText = 0;
    }
}

// ================= SAVE RATING =================
function saveClassRating() {
    const cls = document.getElementById("statClassSelect").value;
    const score = parseInt(document.getElementById("scoreInput").value);

    if (!cls || isNaN(score) || score < 0 || score > 100) {
        alert("Введите корректное значение 0-100");
        return;
    }

    db.classRatings[cls] = score;
    saveDB();
    renderStats();
}

// ================= DELETE =================
function deleteRating(cls) {
    if (confirm("Удалить рейтинг " + cls + "?")) {
        delete db.classRatings[cls];
        saveDB();
        renderStats();
    }
}

// ================= LANGUAGE =================
function toggleLang() {
    lang = lang === "ru" ? "uz" : "ru";
    localStorage.setItem("school_lang", lang);
    location.reload();
}

// ================= EXPORT =================
function exportData() {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "school_backup.json";
    a.click();
}

// ================= IMPORT (FIX TRY/CATCH) =================
function importData() {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = ev => {
            try {
                db = JSON.parse(ev.target.result);
                saveDB();
                renderStats();
            } catch (err) {
                alert("Ошибка файла JSON");
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

init();