let db = JSON.parse(localStorage.getItem('school_v16')) || {
    classes: ["1-А","2-А","3-А","4-А","5-А","6-А","7-А","8-А","9-А","10-А","11-А"],
    monthlyData: {},
    teachers: 500
};

// 🔥 защита от старых/битых данных
if (typeof db.teachers !== "number" || isNaN(db.teachers)) {
    db.teachers = 500;
}

let currentYear = 2025;

/* ===================== INIT ===================== */

function init() {
    setupSelectors();
    updateHeader();
    renderTable();
    renderTeachers();
}

/* ===================== SELECTORS ===================== */

function setupSelectors() {
    const mSel = document.getElementById('monthSelect');
    const cSel = document.getElementById('classSelect');
    const ySel = document.getElementById('yearSelect');

    const months = [
        "Сентябрь","Октябрь","Ноябрь","Декабрь",
        "Январь","Февраль","Март","Апрель",
        "Май","Июнь","Июль","Август"
    ];

    mSel.innerHTML = "";
    months.forEach((m, i) => mSel.add(new Option(m, i)));
    mSel.value = 6;
    currentYear = 2026;

    cSel.innerHTML = `<option value="">-- Класс --</option>`;
    db.classes.forEach(c => cSel.add(new Option(c, c)));

    ySel.innerHTML = "";
    [2023, 2024, 2025, 2026].forEach(y => {
        ySel.add(new Option(y, y));
    });

    ySel.value = currentYear;
}

/* ===================== KEY ===================== */

function getKey() {
    const m = document.getElementById('monthSelect').value;
    const y = document.getElementById('yearSelect').value;
    return `y_${y}_m_${m}`;
}

/* ===================== HEADER ===================== */

function updateHeader() {
    const months = [
        "Сентябрь","Октябрь","Ноябрь","Декабрь",
        "Январь","Февраль","Март","Апрель",
        "Май","Июнь","Июль","Август"
    ];

    const m = document.getElementById('monthSelect').value;
    const y = document.getElementById('yearSelect').value;

    document.getElementById('monthTitle').innerText =
        `${months[m]} ${y}`;
}

/* ===================== CHANGE ===================== */

function changeDate() {
    updateHeader();
    renderTable();
}

function changeYear() {
    currentYear = document.getElementById('yearSelect').value;
    updateHeader();
    renderTable();
}

/* ===================== TABLE ===================== */

function renderTable() {
    const y = document.getElementById('yearSelect').value;
    const m = document.getElementById('monthSelect').value;

    let total = 0;
    let inc = 0;
    let dec = 0;

    let html = "";

    if (y !== "2026") {

        let yearly = {};

        Object.keys(db.monthlyData).forEach(key => {
            if (!key.startsWith(`y_${y}_`)) return;

            const stats = db.monthlyData[key];

            Object.keys(stats).forEach(cls => {
                if (!yearly[cls]) {
                    yearly[cls] = { b: 0, g: 0, inc: 0, dec: 0 };
                }

                yearly[cls].b += stats[cls].b || 0;
                yearly[cls].g += stats[cls].g || 0;
                yearly[cls].inc += stats[cls].inc || 0;
                yearly[cls].dec += stats[cls].dec || 0;
            });
        });

        html = `
        <h3>📊 Полный отчёт за ${y} год</h3>
        <table>
            <thead>
                <tr>
                    <th>Класс</th>
                    <th>М</th>
                    <th>Д</th>
                    <th>Всего</th>
                </tr>
            </thead>
            <tbody>
        `;

        Object.keys(yearly).sort().forEach(cls => {
            const d = yearly[cls];

            total += d.b + d.g;
            inc += d.inc;
            dec += d.dec;

            html += `
            <tr>
                <td>${cls}</td>
                <td>${d.b}</td>
                <td>${d.g}</td>
                <td>${d.b + d.g}</td>
            </tr>`;
        });

        html += `</tbody></table>`;

        document.getElementById('tableWrapper').innerHTML = html;

        document.getElementById('monthTitle').innerText =
            `📊 Всего учеников за ${y} год`;

        document.getElementById('globalTotalDisplay').innerText = total;
        document.getElementById('footerTotal').innerText = total;
        document.getElementById('footerIn').innerText = "+" + inc;
        document.getElementById('footerOut').innerText = "-" + dec;

        return;
    }

    const key = `y_${y}_m_${m}`;
    const stats = db.monthlyData[key] || {};

    html = `
    <table>
        <thead>
            <tr>
                <th>Класс</th>
                <th>М</th>
                <th>Д</th>
                <th>Всего</th>
                <th class="no-print">❌</th>
            </tr>
        </thead>
        <tbody>
    `;

    Object.keys(stats).sort().forEach(cls => {
        const d = stats[cls];

        total += d.b || 0;
        total += d.g || 0;
        inc += d.inc || 0;
        dec += d.dec || 0;

        html += `
        <tr>
            <td>${cls}</td>
            <td>${d.b}</td>
            <td>${d.g}</td>
            <td>${(d.b || 0) + (d.g || 0)}</td>
            <td class="no-print" onclick="deleteEntry('${cls}')">❌</td>
        </tr>`;
    });

    html += `</tbody></table>`;

    document.getElementById('tableWrapper').innerHTML = html;

    const months = [
        "Сентябрь","Октябрь","Ноябрь","Декабрь",
        "Январь","Февраль","Март","Апрель",
        "Май","Июнь","Июль","Август"
    ];

    document.getElementById('monthTitle').innerText =
        `${months[m]} ${y}`;

    document.getElementById('globalTotalDisplay').innerText = total;
    document.getElementById('footerTotal').innerText = total;
    document.getElementById('footerIn').innerText = "+" + inc;
    document.getElementById('footerOut').innerText = "-" + dec;
}

/* ===================== SAVE ===================== */

function handleSave() {
    const key = getKey();
    const cls = document.getElementById('classSelect').value;

    const bInp = document.getElementById('boysInp').value.trim();
    const gInp = document.getElementById('girlsInp').value.trim();

    if (!cls) return alert("Выберите класс!");

    if (!db.monthlyData[key]) db.monthlyData[key] = {};
    if (!db.monthlyData[key][cls]) {
        db.monthlyData[key][cls] = { b: 0, g: 0, inc: 0, dec: 0 };
    }

    const entry = db.monthlyData[key][cls];

    const proc = (curr, inp) => {
        if (!inp) return curr;

        if (inp.startsWith('+')) {
            const v = parseInt(inp);
            entry.inc += v;
            return curr + v;
        }

        if (inp.startsWith('-')) {
            const v = Math.abs(parseInt(inp));
            entry.dec += v;
            return curr - v;
        }

        return parseInt(inp);
    };

    entry.b = proc(entry.b || 0, bInp);
    entry.g = proc(entry.g || 0, gInp);

    localStorage.setItem('school_v16', JSON.stringify(db));

    renderTable();
}

/* ===================== DELETE ===================== */

function deleteEntry(cls) {
    const key = getKey();
    if (db.monthlyData[key]) {
        delete db.monthlyData[key][cls];
    }

    localStorage.setItem('school_v16', JSON.stringify(db));
    renderTable();
}

/* ===================== TEACHERS ===================== */

function updateTeachers(input) {
    if (!input) return;

    let val = parseInt(input);
    if (isNaN(val)) return alert("Введите число!");

    if (input.startsWith('+')) {
        db.teachers = (db.teachers || 0) + val;
    } 
    else if (input.startsWith('-')) {
        db.teachers = (db.teachers || 0) - Math.abs(val);
    } 
    else {
        db.teachers = val;
    }

    if (db.teachers < 0) db.teachers = 0;

    localStorage.setItem('school_v16', JSON.stringify(db));
    renderTeachers();
}

function renderTeachers() {
    document.getElementById('teacherCountDisplay').innerText = db.teachers;
}

/* ===================== EXPORT / IMPORT ===================== */

function exportData() {
    const blob = new Blob([JSON.stringify(db, null, 2)], {
        type: "application/json"
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "school_backup.json";
    a.click();
}

function importData() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";

    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = () => {
            try {
                db = JSON.parse(reader.result);

                if (typeof db.teachers !== "number") db.teachers = 500;

                localStorage.setItem('school_v16', JSON.stringify(db));

                renderTable();
                renderTeachers();
            } catch {
                alert("Ошибка файла!");
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

/* ===================== START ===================== */

init();