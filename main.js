let students = [];
let currentScoringId = null;
let currentSettings = {};

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  loadStats();
  loadStudents();
  document.getElementById("searchInput").addEventListener("input", loadStudents);
});

async function loadSettings() {
  const res = await fetch("/api/settings");
  currentSettings = await res.json();
  
  document.getElementById("dispTeacherName").textContent = currentSettings.teacher_name || "វ៉ាន់ ជីវ៉ា";
  document.getElementById("dispTeacherDate").textContent = currentSettings.teacher_date || "ថ្ងៃទី ៣០ ខែ កញ្ញា ឆ្នាំ២០២៦";
  document.getElementById("dispLunarDate").textContent = currentSettings.admin_lunar_date || "ថ្ងៃ  ពុធ ៤រោច ខែ  ភទ្របទ  ឆ្នាំ  មមី  អដ្ឋសក័ ព.ស.២៥៧០";
  document.getElementById("dispSolarDate").textContent = currentSettings.admin_solar_date || "ភ្នំពេញ ត្រូវនឹងថ្ងៃទី  ៣០ ខែ  កញ្ញា  ឆ្នាំ២០២៦";
  document.getElementById("dispAcademicYear").textContent = currentSettings.academic_year || "មុខវិជ្ជាសិក្សា៖ គណិតវិទ្យា /កម្រិតថ្នាក់ ១០ /ក្នុងឆ្នាំ២០២៦";
}

function openSettingsModal() {
  document.getElementById("setTeacherName").value = currentSettings.teacher_name || "";
  document.getElementById("setTeacherDate").value = currentSettings.teacher_date || "";
  document.getElementById("setLunarDate").value = currentSettings.admin_lunar_date || "";
  document.getElementById("setSolarDate").value = currentSettings.admin_solar_date || "";
  document.getElementById("setAcademicYear").value = currentSettings.academic_year || "";
  document.getElementById("settingsModal").classList.remove("hidden");
}

function closeSettingsModal() {
  document.getElementById("settingsModal").classList.add("hidden");
}

async function saveSettings() {
  const payload = {
    teacher_name: document.getElementById("setTeacherName").value,
    teacher_date: document.getElementById("setTeacherDate").value,
    admin_lunar_date: document.getElementById("setLunarDate").value,
    admin_solar_date: document.getElementById("setSolarDate").value,
    academic_year: document.getElementById("setAcademicYear").value
  };

  const res = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeSettingsModal();
    loadSettings();
  } else {
    alert("មានបញ្ហាក្នុងការរក្សាទុក!");
  }
}

async function loadStats() {
  const res = await fetch("/api/dashboard-stats");
  const data = await res.json();
  document.getElementById("statTotal").textContent = `${data.total} នាក់`;
  document.getElementById("statFemale").textContent = `${data.female} នាក់`;
  document.getElementById("statMale").textContent = `${data.male} នាក់`;
}

async function loadStudents() {
  const q = document.getElementById("searchInput").value;
  const res = await fetch(`/api/students?q=${encodeURIComponent(q)}`);
  const result = await res.json();
  students = result.data;

  const tbody = document.getElementById("studentRows");
  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="14" class="py-4 text-center text-slate-400">គ្មានទិន្នន័យ</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map((s, idx) => `
    <tr class="hover:bg-amber-50/50 transition">
      <td class="font-bold">${idx + 1}</td>
      <td class="text-left font-bold text-slate-900 px-3 font-battambang text-[13px]">${s.name}</td>
      <td class="font-bold text-slate-900 font-battambang">${s.gender}</td>
      
      <td class="font-medium text-slate-900">${s.behavior}</td>
      <td class="font-medium text-slate-900">${s.attendance}</td>
      <td class="font-medium text-slate-900">${s.homework}</td>
      <td class="font-medium text-slate-900">${s.worksheet}</td>
      <td class="font-medium text-slate-900">${s.quiz}</td>

      <td class="font-extrabold text-red-600 text-sm">${s.total_score}</td>
      <td class="font-extrabold text-red-600">${s.average}</td>
      <td class="font-extrabold text-red-600 text-sm font-battambang">${s.rank}</td>
      <td class="font-extrabold text-red-600 font-battambang">${s.result}</td>
      <td class="font-extrabold text-red-600 text-sm font-battambang">${s.grade}</td>

      <td class="action-col no-print space-x-1 whitespace-nowrap">
        <button onclick="openScoreModal(${s.id})" title="កែប្រែពិន្ទុ" class="px-2 py-0.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded border border-indigo-200 text-xs font-bold">
          📝
        </button>
        <button onclick="deleteStudent(${s.id})" title="លុប" class="px-2 py-0.5 bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200 text-xs font-bold">
          🗑️
        </button>
      </td>
    </tr>
  `).join("");
}

// ----------------- EXPORT TO PDF (A4 LANDSCAPE ពេញលេញ ១ ទំព័រ មិនកាត់ដាច់) ----------------- //
async function exportToPDF() {
  const btn = document.getElementById("btnExportPDF");
  const originalText = btn.innerHTML;
  btn.innerHTML = "⏳ កំពុងបង្កើត PDF...";
  btn.disabled = true;

  // រង់ចាំ Font Load ពេញលេញ
  await document.fonts.ready;

  // កំណត់ Scroll ទៅដើមជួរដើម្បីកុំឱ្យដាច់ជ្រុងឆ្វេង
  window.scrollTo(0, 0);
  const wrapper = document.getElementById("printableWrapper");
  if (wrapper) wrapper.scrollLeft = 0;

  // លាក់ Action Column ជាបណ្ដោះអាសន្ន
  document.querySelectorAll(".action-col").forEach(el => el.style.display = "none");

  const element = document.getElementById("printableArea");

  const opt = {
    margin:       [5, 5, 5, 5], // 5mm
    filename:     'របាយការណ៍_លទ្ធផលប្រឡងប្រចាំខែ_ថ្នាក់ទី១០.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { 
      scale: 2, 
      useCORS: true, 
      logging: false,
      scrollX: 0,
      scrollY: 0
    },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
    pagebreak:    { mode: 'avoid-all' } // ធានាថានៅលើ ១ ទំព័រគត់ មិនបែកជា ២ ទំព័រ
  };

  html2pdf().set(opt).from(element).save().then(() => {
    document.querySelectorAll(".action-col").forEach(el => el.style.display = "");
    btn.innerHTML = originalText;
    btn.disabled = false;
  }).catch(err => {
    document.querySelectorAll(".action-col").forEach(el => el.style.display = "");
    console.error(err);
    alert("មានបញ្ហាក្នុងការបង្កើត PDF!");
    btn.innerHTML = originalText;
    btn.disabled = false;
  });
}

// Score Modal Functions
function openScoreModal(sid) {
  currentScoringId = sid;
  const s = students.find(x => x.id === sid);
  if (!s) return;

  document.getElementById("modalStudentName").textContent = `សិស្ស៖ ${s.name} (${s.gender})`;
  document.getElementById("inpBehavior").value = s.behavior;
  document.getElementById("inpAttendance").value = s.attendance;
  document.getElementById("inpHomework").value = s.homework;
  document.getElementById("inpWorksheet").value = s.worksheet;
  document.getElementById("inpQuiz").value = s.quiz;

  calcModalLive();
  document.getElementById("scoreModal").classList.remove("hidden");
}

function closeScoreModal() { document.getElementById("scoreModal").classList.add("hidden"); }

function calcModalLive() {
  const b = parseFloat(document.getElementById("inpBehavior").value) || 0;
  const a = parseFloat(document.getElementById("inpAttendance").value) || 0;
  const h = parseFloat(document.getElementById("inpHomework").value) || 0;
  const w = parseFloat(document.getElementById("inpWorksheet").value) || 0;
  const q = parseFloat(document.getElementById("inpQuiz").value) || 0;

  const total = b + a + h + w + q;
  document.getElementById("modalLiveTotal").textContent = total;
  document.getElementById("modalLiveAvg").textContent = (total / 6.0).toFixed(2);
}

async function saveModalScores() {
  if (!currentScoringId) return;

  const payload = {
    behavior: parseFloat(document.getElementById("inpBehavior").value) || 0,
    attendance: parseFloat(document.getElementById("inpAttendance").value) || 0,
    homework: parseFloat(document.getElementById("inpHomework").value) || 0,
    worksheet: parseFloat(document.getElementById("inpWorksheet").value) || 0,
    quiz: parseFloat(document.getElementById("inpQuiz").value) || 0
  };

  const res = await fetch(`/api/students/${currentScoringId}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    closeScoreModal();
    loadStudents();
  }
}

// Add Student
function openAddModal() { document.getElementById("addModal").classList.remove("hidden"); }
function closeAddModal() { document.getElementById("addModal").classList.add("hidden"); }

async function handleAddStudent(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const res = await fetch("/api/students", { method: "POST", body: formData });
  if (res.ok) {
    closeAddModal();
    e.target.reset();
    loadStats();
    loadStudents();
  }
}

async function deleteStudent(id) {
  if (!confirm("តើអ្នកប្រាកដថាចង់លុបសិស្សនេះ?")) return;
  await fetch(`/api/students/${id}`, { method: "DELETE" });
  loadStats();
  loadStudents();
}