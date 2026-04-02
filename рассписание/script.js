const i18n = {
    ru: {
        navMain: "🗓️ Расписание", navStats: "👥 Ученики", navRating: "📊 Рейтинг",
        tSubj: "📚 Предметы", tTeach: "👨‍🏫 Учителя", tClass: "🏫 Классы",
        btnReset: "🗑️ Сбросить всё",
        optSubj: "- Предмет -", optTeach: "- Учитель -",
        confirm_reset: "ВНИМАНИЕ! Это удалит ВСЕ данные (расписание и учеников). Продолжить?",
        days: ["ДУШАНБА", "СЕШАНБА", "ЧОРШАНБА", "ПАЙШАНБА", "ЖУМА", "ШАНБА"]
    },
    uz: {
        navMain: "🗓️ Jadval", navStats: "👥 O'quvchilar",
        tSubj: "📚 Fanlar", tTeach: "👨‍🏫 O'qituvchilar", tClass: "🏫 Sinflar",
        btnReset: "🗑️ Tozalash",
        optSubj: "- Fan -", optTeach: "- O'qituvchi -",
        confirm_reset: "DIQQAT! Bu barcha ma'lumotlarni o'chirib tashlaydi. Davom etasizmi?",
        days: ["DUSHANBA", "SESHANBA", "CHORSHANBA", "PAYSHANBA", "JUMA", "SHANBA"]
    }
};

let currentLang = localStorage.getItem('school_lang') || 'ru';

const timeGrid = {
    junior: {1:"08:45-09:50",2:"09:55-11:00",3:"11:05-12:10",4:"12:45-13:50",5:"13:55-14:35",6:"15:25-16:30"},
    senior: {1:"08:30-09:35",2:"09:55-11:00",3:"11:05-12:10",4:"12:15-13:20",5:"13:55-15:00",6:"15:25-16:30"}
};

let state = JSON.parse(localStorage.getItem('school_v16')) || {
    teachers: [],
    subjects: [],
    classes: ["1-А","2-А","3-А","4-А","5-А","6-А","7-А","8-А","9-А","10-А","11-А"],
    schedule: {},
    monthlyData: {},
    classRatings: {}
};

function sortClasses() {
    state.classes.sort((a, b) => {
        const numA = parseInt(a) || 0;
        const numB = parseInt(b) || 0;
        if (numA !== numB) return numA - numB;
        return a.localeCompare(b);
    });
}

function saveToDevice() {
    sortClasses();
    localStorage.setItem('school_v16', JSON.stringify(state));
}

function init() {
    sortClasses();
    applyLang();
    renderAll();
}

function toggleLang() {
    currentLang = currentLang === 'ru' ? 'uz' : 'ru';
    localStorage.setItem('school_lang', currentLang);
    location.reload();
}

function applyLang() {
    const T = i18n[currentLang];
    ["navMain","navStats","navRating","tSubj","tTeach","tClass","btnReset"]
    .forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerText = T[id];
    });
}

function renderAll() {
    const T = i18n[currentLang];

    if(document.getElementById('subjectsList')) {
        document.getElementById('subjectsList').innerHTML =
            state.subjects.map((s,i)=>`<div class="tag">${s}<span onclick="remove('subjects',${i})">×</span></div>`).join('');

        document.getElementById('teacherSubjectSelect').innerHTML =
            `<option value="">${T.optSubj}</option>` +
            state.subjects.map(s=>`<option value="${s}">${s}</option>`).join('');

        document.getElementById('teachersList').innerHTML =
            state.teachers.map((t,i)=>`<div class="tag">${t.name} (${t.subject})<span onclick="remove('teachers',${i})">×</span></div>`).join('');

        document.getElementById('classesList').innerHTML =
            state.classes.map((c,i)=>`<div class="tag">${c}<span onclick="remove('classes',${i})">×</span></div>`).join('');
    }

    if(document.getElementById('tableBody')) renderSchedule();
}

/* ✅ ПРАВИЛЬНЫЙ КОНФЛИКТ (день + урок + учитель) */
function getConflicts() {
    const conflicts = {};
    const map = {};

    Object.entries(state.schedule).forEach(([id, val]) => {
        if (!val.t) return;

        const parts = id.split("-");
        const lesson = parts.pop();
        const day = parts.pop();

        const key = `${day}-${lesson}-${val.t}`;

        if (!map[key]) map[key] = [];
        map[key].push(id);
    });

    Object.values(map).forEach(list => {
        if (list.length > 1) {
            list.forEach(id => conflicts[id] = true);
        }
    });

    return conflicts;
}

function renderSchedule() {
    const T = i18n[currentLang];
    const days = T.days;
    const conflicts = getConflicts();

    const dHead = document.getElementById('daysHeader');
    const lHead = document.getElementById('lessonsHeader');
    const tbody = document.getElementById('tableBody');

    if(!dHead) return;

    dHead.innerHTML = `<th rowspan="2" class="class-name">${currentLang==='ru'?'Класс':'Sinf'}</th>`;
    lHead.innerHTML = '';

    days.forEach(day => {
        let th = document.createElement('th');
        th.colSpan = 6;
        th.className = 'day-title';
        th.innerText = day;
        dHead.appendChild(th);

        for(let i=1;i<=6;i++){
            let lth = document.createElement('th');
            lth.className = 'lesson-num';
            lth.innerText = i;
            lHead.appendChild(lth);
        }
    });

    tbody.innerHTML = '';

    state.classes.forEach(cls => {
        let row = document.createElement('tr');
        row.innerHTML = `<td class="class-name">${cls}</td>`;

        let times = parseInt(cls) <= 4 ? timeGrid.junior : timeGrid.senior;

        days.forEach((d, di) => {
            for(let l=1;l<=6;l++) {
                let id = `${cls}-${di}-${l}`;
                let data = state.schedule[id] || {s:"", t:""};

                let tList = data.s
                    ? state.teachers.filter(t=>t.subject===data.s)
                    : state.teachers;

                let td = document.createElement('td');

                /* 🔴 подсветка */
                if(conflicts[id]) {
                    td.style.background = "#ffe5e5";
                    td.style.border = "2px solid red";
                }

                td.innerHTML = `
                    <div class="cell-box">
                        <span class="time-label">${times[l]||""}</span>

                        <select onchange="updCell('${id}','s',this.value)">
                            <option value="">${T.optSubj}</option>
                            ${state.subjects.map(s=>`<option value="${s}" ${data.s===s?'selected':''}>${s}</option>`).join('')}
                        </select>

                        <select onchange="updCell('${id}','t',this.value)">
                            <option value="">${T.optTeach}</option>
                            ${tList.map(t=>`<option value="${t.name}" ${data.t===t.name?'selected':''}>${t.name}</option>`).join('')}
                        </select>
                    </div>
                `;

                row.appendChild(td);
            }
        });

        tbody.appendChild(row);
    });
}

function updCell(id, field, value) {
    if(!state.schedule[id]) state.schedule[id] = {s:"", t:""};

    state.schedule[id][field] = value;

    saveToDevice();
    renderAll();

    const conflicts = getConflicts();
    if(conflicts[id]) {
        alert("⚠️ Учитель уже занят в это время!");
    }
}

/* ДОБАВЛЕНИЕ */
function addSubject() {
    let v = document.getElementById('subjectInput').value.trim();
    if(v){
        state.subjects.push(v);
        saveToDevice();
        renderAll();
        document.getElementById('subjectInput').value='';
    }
}

function addTeacher() {
    let n = document.getElementById('teacherInput').value.trim();
    let s = document.getElementById('teacherSubjectSelect').value;

    if(n && s){
        state.teachers.push({name:n, subject:s});
        saveToDevice();
        renderAll();
        document.getElementById('teacherInput').value='';
    } else {
        alert("Введите имя и выберите предмет");
    }
}

function addClass() {
    let v = document.getElementById('classInput').value.trim().toUpperCase();
    if(v && !state.classes.includes(v)) {
        state.classes.push(v);
        saveToDevice();
        renderAll();
        document.getElementById('classInput').value = '';
    }
}

function remove(type, index) {
    state[type].splice(index, 1);
    saveToDevice();
    renderAll();
}

function clearAll() {
    if(confirm(i18n[currentLang].confirm_reset)) {
        localStorage.removeItem('school_v16');
        location.reload();
    }
}

function toggleFullScreen() {
    const el = document.getElementById("tableContainer");
    if (!document.fullscreenElement) el.requestFullscreen();
    else document.exitFullscreen();
}

/* 📤 ЭКСПОРТ */
function exportData() {
    const dataStr = JSON.stringify(state, null, 2);

    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "school_data.json";
    a.click();

    URL.revokeObjectURL(url);
}

/* 📥 ИМПОРТ */
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (!data.subjects || !data.teachers || !data.classes) {
                alert("❌ Неверный файл");
                return;
            }

            state = data;
            saveToDevice();
            renderAll();

            alert("✅ Данные успешно загружены");
        } catch {
            alert("❌ Ошибка чтения файла");
        }
    };

    reader.readAsText(file);
}

init();
