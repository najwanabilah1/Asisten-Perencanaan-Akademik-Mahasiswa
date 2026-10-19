"use strict";

const STORAGE_KEY = "smartstudy.tasks.v1";
const SCHEDULE_STORAGE_KEY = "smartstudy.schedules.v1";
const COURSE_COLORS = ["#9789f3", "#f19a78", "#62b89a", "#6fa6e8", "#d48ac1", "#e0ae56", "#71b7c2"];
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const WEEKDAYS_LONG = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const elements = {
  totalTasks: document.querySelector("#total-tasks"),
  dueSoon: document.querySelector("#due-soon-tasks"),
  completedTasks: document.querySelector("#completed-tasks"),
  taskList: document.querySelector("#task-list"),
  visibleTaskCount: document.querySelector("#visible-task-count"),
  navTaskCount: document.querySelector("#nav-task-count"),
  courseList: document.querySelector("#course-list"),
  courseFilter: document.querySelector("#course-filter"),
  statusFilter: document.querySelector("#status-filter"),
  taskDetailsForm: document.querySelector("#task-details-form"),
  taskDeadlineForm: document.querySelector("#task-deadline-form"),
  scheduleForm: document.querySelector("#schedule-form"),
  courseOptions: document.querySelector("#course-options"),
  calendarGrid: document.querySelector("#calendar-grid"),
  calendarMonth: document.querySelector("#calendar-month"),
  agendaDate: document.querySelector("#agenda-date"),
  agendaCount: document.querySelector("#agenda-count"),
  agendaList: document.querySelector("#agenda-list"),
  reminderList: document.querySelector("#reminder-list"),
  weeklyBars: document.querySelector("#weekly-bars"),
  progressBar: document.querySelector("#weekly-progress-bar"),
  progressFill: document.querySelector("#weekly-progress-fill"),
  weeklyPercent: document.querySelector("#weekly-percent"),
  weeklyProgressNote: document.querySelector("#weekly-progress-note"),
  weekRange: document.querySelector("#week-range"),
  todayLabel: document.querySelector("#today-label"),
};

let tasks = loadTasks();
let schedules = loadSchedules();
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedDate = dateKey(new Date());
let activeCourseFilter = "all";
let activeStatusFilter = "all";
let reminderTimer = null;
let pendingTaskDetails = null;
let expandedTaskId = null;

function localDate(value) {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dateKey(value) {
  const date = localDate(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateDifference(from, to) {
  return Math.round((localDate(to).getTime() - localDate(from).getTime()) / 86400000);
}

function formatDate(value, options = { day: "numeric", month: "short" }) {
  return localDate(value).toLocaleDateString("id-ID", options);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === null) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error("Format data tugas tidak sesuai.");
    return parsed.filter((task) =>
      task && typeof task.id === "string" && typeof task.title === "string" &&
      typeof task.course === "string" && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) &&
      typeof task.completed === "boolean"
    );
  } catch (error) {
    console.error("SmartStudy gagal membaca data tersimpan:", error);
    window.setTimeout(() => showToast("Data tugas tidak dapat dibaca. Periksa penyimpanan browser.", true), 0);
    return [];
  }
}

function loadSchedules() {
  try {
    const stored = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (stored === null) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error("Format data jadwal tidak sesuai.");
    return parsed.filter((schedule) =>
      schedule && typeof schedule.id === "string" && typeof schedule.course === "string" &&
      Number.isInteger(schedule.day) && schedule.day >= 0 && schedule.day <= 6 &&
      /^\d{2}:\d{2}$/.test(schedule.startTime) && /^\d{2}:\d{2}$/.test(schedule.endTime)
    );
  } catch (error) {
    console.error("SmartStudy gagal membaca jadwal tersimpan:", error);
    window.setTimeout(() => showToast("Data jadwal kuliah tidak dapat dibaca.", true), 0);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("SmartStudy gagal menyimpan data:", error);
    showToast("Tugas belum tersimpan. Periksa ruang penyimpanan browser.", true);
    return false;
  }
}

function saveSchedules() {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedules));
    return true;
  } catch (error) {
    console.error("SmartStudy gagal menyimpan jadwal kuliah:", error);
    showToast("Jadwal belum tersimpan. Periksa ruang penyimpanan browser.", true);
    return false;
  }
}

function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast${isError ? " error" : ""}`;
  const icon = document.createElement("span");
  icon.className = "toast-icon";
  icon.textContent = isError ? "!" : "✓";
  const text = document.createElement("span");
  text.textContent = message;
  toast.append(icon, text);
  document.querySelector("#toast-region").append(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

function colorForCourse(course) {
  const index = [...course].reduce((sum, character) => sum + character.charCodeAt(0), 0) % COURSE_COLORS.length;
  return COURSE_COLORS[index];
}

function statusFor(task) {
  if (task.completed) return "completed";
  return dateDifference(new Date(), task.dueDate) < 0 ? "overdue" : "pending";
}

function sortedTasks(list) {
  return [...list].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate) ||
    (a.dueTime || "99:99").localeCompare(b.dueTime || "99:99") ||
    a.title.localeCompare(b.title, "id")
  );
}

function render() {
  renderHeaderAndStats();
  renderCourseOptions();
  renderTasks();
  renderWeeklyProgress();
  renderCalendar();
  renderReminders();
  renderSchedules();
}

function renderHeaderAndStats() {
  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 11 ? "SELAMAT PAGI" : hour < 15 ? "SELAMAT SIANG" : hour < 18 ? "SELAMAT SORE" : "SELAMAT MALAM";
  document.querySelector("#greeting").textContent = greeting;
  elements.todayLabel.textContent = today.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

  const incomplete = tasks.filter((task) => !task.completed);
  const dueSoon = incomplete.filter((task) => {
    const difference = dateDifference(today, task.dueDate);
    return difference >= 0 && difference <= 7;
  });
  const weekStart = startOfWeek(today);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const completedThisWeek = tasks.filter((task) =>
    task.completed && task.completedAt && task.completedAt >= dateKey(weekStart) && task.completedAt <= dateKey(weekEnd)
  );
  elements.totalTasks.textContent = String(tasks.length);
  elements.dueSoon.textContent = String(dueSoon.length);
  elements.completedTasks.textContent = String(completedThisWeek.length);
  elements.navTaskCount.textContent = String(incomplete.length);
  document.querySelector("#tasks-shortcut-note").textContent = incomplete.length
    ? `${incomplete.length} tugas menunggu perhatianmu. Pantau deadline dan progres di daftar tugas.`
    : "Pantau tugas, deadline, dan progres dalam satu halaman.";
}

function renderCourseOptions() {
  const courses = [...new Set([
    ...tasks.map((task) => task.course.trim()),
    ...schedules.map((schedule) => schedule.course.trim()),
  ].filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "id"));
  const previousFilter = activeCourseFilter;
  elements.courseFilter.innerHTML = '<option value="all">Semua mata kuliah</option>' +
    courses.map((course) => `<option value="${escapeHTML(course)}">${escapeHTML(course)}</option>`).join("");
  activeCourseFilter = courses.includes(previousFilter) || previousFilter === "all" ? previousFilter : "all";
  elements.courseFilter.value = activeCourseFilter;
  elements.courseList.innerHTML = courses.length
    ? courses.map((course) => `<div class="course-chip"><i class="course-dot" style="--course-color:${colorForCourse(course)}"></i><span>${escapeHTML(course)}</span></div>`).join("")
    : '<div class="course-empty">Mata kuliah akan muncul setelah kamu menambahkan tugas.</div>';
  elements.courseOptions.innerHTML = courses.map((course) => `<option value="${escapeHTML(course)}"></option>`).join("");
}

function taskLabel(task) {
  if (task.completed) return { label: "Selesai", className: "status-completed" };
  const remaining = dateDifference(new Date(), task.dueDate);
  if (remaining < 0) return { label: "Terlambat", className: "status-overdue" };
  if (remaining === 0) return { label: "Hari ini", className: "status-upcoming" };
  if (remaining === 1) return { label: "Besok", className: "status-upcoming" };
  return { label: "Mendatang", className: "status-upcoming" };
}

function renderTasks() {
  const visible = sortedTasks(tasks).filter((task) => {
    if (activeCourseFilter !== "all" && task.course !== activeCourseFilter) return false;
    const status = statusFor(task);
    return activeStatusFilter === "all" || (activeStatusFilter === "pending" && status === "pending") ||
      (activeStatusFilter === "completed" && status === "completed") ||
      (activeStatusFilter === "overdue" && status === "overdue");
  });
  elements.visibleTaskCount.textContent = String(visible.length);
  if (!visible.length) {
    elements.taskList.innerHTML = tasks.length && (activeCourseFilter !== "all" || activeStatusFilter !== "all")
      ? '<div class="empty-state">Belum ada tugas dengan filter ini.<br>Coba pilih filter lainnya.</div>'
      : '<div class="empty-state">Belum ada tugas. Mulai dengan menambahkan tugas pertamamu ✦</div>';
    return;
  }
  elements.taskList.innerHTML = visible.map((task) => {
    const status = taskLabel(task);
    const difference = dateDifference(new Date(), task.dueDate);
    const deadlineClass = !task.completed && difference < 0 ? "overdue" : !task.completed && difference <= 2 ? "soon" : "";
    const deadlineText = task.completed ? formatDate(task.dueDate) : difference < 0
      ? `Lewat ${Math.abs(difference)} hari`
      : difference === 0 ? "Tenggat hari ini" : difference === 1 ? "Tenggat besok" : formatDate(task.dueDate);
    const deadlineWithTime = `${deadlineText}${task.dueTime ? ` · ${escapeHTML(task.dueTime)}` : ""}`;
    const expanded = expandedTaskId === task.id;
    return `<article class="task-item${task.completed ? " completed" : ""}${expanded ? " expanded" : ""}">
      <button class="task-checkbox" type="button" role="checkbox" aria-checked="${task.completed}" aria-label="${task.completed ? "Tandai belum selesai" : "Tandai selesai"}: ${escapeHTML(task.title)}" data-toggle-task="${task.id}"></button>
      <button class="task-copy task-expand" type="button" aria-expanded="${expanded}" aria-label="${expanded ? "Sembunyikan" : "Lihat"} detail ${escapeHTML(task.title)}" data-expand-task="${task.id}">
        <span class="task-title">${escapeHTML(task.title)}</span>
        <span class="task-meta"><i class="task-course-dot" style="--course-color:${colorForCourse(task.course)}"></i><span class="task-meta-course">${escapeHTML(task.course)}</span><span class="meta-divider">·</span><span class="task-deadline ${deadlineClass}">${deadlineWithTime}</span></span>
        ${expanded ? `<span class="task-expanded-details">${task.notes ? escapeHTML(task.notes) : "Belum ada catatan untuk tugas ini."}<span class="task-detail-date">Tanggal pengumpulan: ${formatDate(task.dueDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${task.dueTime ? ` · ${escapeHTML(task.dueTime)}` : ""}</span></span>` : ""}
      </button>
      <div class="task-actions"><span class="task-status ${status.className}">${status.label}</span><button class="delete-task" type="button" aria-label="Hapus tugas ${escapeHTML(task.title)}" title="Hapus tugas" data-delete-task="${task.id}">×</button></div>
    </article>`;
  }).join("");
}

function startOfWeek(value) {
  const date = localDate(value);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  return date;
}

function renderWeeklyProgress() {
  const today = localDate(new Date());
  const monday = startOfWeek(today);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const weekTasks = tasks.filter((task) => task.dueDate >= dateKey(monday) && task.dueDate <= dateKey(sunday));
  const completed = weekTasks.filter((task) => task.completed).length;
  const percent = weekTasks.length ? Math.round(completed / weekTasks.length * 100) : 0;
  elements.weeklyPercent.textContent = `${percent}%`;
  elements.progressFill.style.width = `${percent}%`;
  elements.progressBar.setAttribute("aria-valuenow", String(percent));
  elements.weekRange.textContent = `${monday.getDate()} – ${sunday.getDate()} ${MONTHS[sunday.getMonth()]}`;
  elements.weeklyProgressNote.textContent = !weekTasks.length
    ? "Belum ada tenggat minggu ini. Nikmati ruang untuk merencanakan."
    : completed === weekTasks.length
      ? "Hebat! Semua tugas minggu ini sudah selesai ✨"
      : `${completed} dari ${weekTasks.length} tugas dengan tenggat minggu ini sudah selesai.`;

  const countsByDay = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + index);
    const key = dateKey(day);
    return { day, count: tasks.filter((task) => task.completed && task.completedAt === key).length };
  });
  const maxCount = Math.max(1, ...countsByDay.map((day) => day.count));
  elements.weeklyBars.innerHTML = countsByDay.map(({ day, count }) => {
    const height = count ? Math.max(12, count / maxCount * 70) : 5;
    return `<div class="bar-day${dateKey(day) === dateKey(today) ? " today" : ""}" title="${count} tugas selesai">
      <div class="bar-track"><i class="bar-fill${count ? " has-tasks" : ""}" style="height:${height}px"></i></div>
      <span>${WEEKDAYS[day.getDay()]}</span>
    </div>`;
  }).join("");
}

function renderCalendar() {
  elements.calendarMonth.textContent = `${MONTHS[calendarMonth.getMonth()]} ${calendarMonth.getFullYear()}`;
  const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(gridStart.getDate() - firstDay.getDay());
  const todayKey = dateKey(new Date());
  const dueDates = new Set(tasks.filter((task) => !task.completed).map((task) => task.dueDate));
  const scheduleDays = new Set(schedules.map((schedule) => schedule.day));
  const cells = WEEKDAYS.map((day) => `<span class="calendar-weekday" role="columnheader">${day}</span>`);
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const key = dateKey(date);
    const classes = ["calendar-day"];
    if (date.getMonth() !== calendarMonth.getMonth()) classes.push("muted");
    if (key === todayKey) classes.push("today");
    if (key === selectedDate) classes.push("selected");
    if (dueDates.has(key)) classes.push("has-due");
    if (scheduleDays.has(date.getDay())) classes.push("has-class");
    const label = date.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    cells.push(`<button class="${classes.join(" ")}" type="button" role="gridcell" aria-label="${label}${dueDates.has(key) ? ", ada tugas dengan tenggat" : ""}${scheduleDays.has(date.getDay()) ? ", ada jadwal kuliah" : ""}" aria-pressed="${key === selectedDate}" data-calendar-date="${key}">${date.getDate()}</button>`);
  }
  elements.calendarGrid.innerHTML = cells.join("");
  renderAgenda();
}

function renderAgenda() {
  const agendaDateValue = localDate(selectedDate);
  const agendaTasks = sortedTasks(tasks.filter((task) => task.dueDate === selectedDate));
  const agendaSchedules = schedules.filter((schedule) => schedule.day === agendaDateValue.getDay())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  elements.agendaDate.textContent = `${WEEKDAYS_LONG[agendaDateValue.getDay()]}, ${formatDate(selectedDate, { day: "numeric", month: "long" })}`;
  const agendaItemsCount = agendaTasks.length + agendaSchedules.length;
  elements.agendaCount.textContent = agendaItemsCount ? `${agendaItemsCount} acara` : "";
  const taskItems = agendaTasks.map((task) => `
    <div class="agenda-item">
      <i class="agenda-color" style="--course-color:${colorForCourse(task.course)}"></i>
      <div class="agenda-copy"><strong${task.completed ? ' style="text-decoration:line-through;color:#a6aab5"' : ""}>${escapeHTML(task.title)}</strong><span>Tenggat · ${escapeHTML(task.course)}${task.dueTime ? ` · ${escapeHTML(task.dueTime)}` : ""}${task.completed ? " · Selesai" : ""}</span></div>
    </div>`);
  const scheduleItems = agendaSchedules.map((schedule) => `
    <div class="agenda-item">
      <i class="agenda-color" style="--course-color:${colorForCourse(schedule.course)}"></i>
      <div class="agenda-copy"><strong>${escapeHTML(schedule.course)}</strong><span>Kuliah · ${escapeHTML(schedule.startTime)}–${escapeHTML(schedule.endTime)}${schedule.room ? ` · ${escapeHTML(schedule.room)}` : ""}</span></div>
    </div>`);
  const combined = [...scheduleItems, ...taskItems].join("");
  elements.agendaList.innerHTML = combined || '<div class="agenda-empty">Tidak ada deadline atau jadwal kuliah pada tanggal ini.</div>';
}

function renderReminders() {
  const upcoming = sortedTasks(tasks.filter((task) => !task.completed && dateDifference(new Date(), task.dueDate) >= 0))
    .slice(0, 3);
  elements.reminderList.innerHTML = upcoming.length ? upcoming.map((task) => {
    const remaining = dateDifference(new Date(), task.dueDate);
    const timing = remaining === 0 ? "Hari ini" : remaining === 1 ? "Besok" : formatDate(task.dueDate);
    return `<div class="reminder-item"><strong>${escapeHTML(task.title)}</strong> · ${escapeHTML(task.course)} <span class="reminder-date">— ${timing}${task.dueTime ? `, ${escapeHTML(task.dueTime)}` : ""}</span></div>`;
  }).join("") : '<div class="reminder-empty">Tidak ada deadline mendatang. Kamu sudah di jalur yang baik.</div>';
}

function addTask(details, deadline) {
  const task = {
    id: window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `task-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: details.title,
    course: details.course,
    dueDate: deadline.get("dueDate"),
    dueTime: deadline.get("dueTime"),
    notes: details.notes,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  if (!task.title || !task.course || !/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate)) {
    showToast("Lengkapi nama tugas, mata kuliah, dan tanggal pengumpulan yang valid.", true);
    return false;
  }
  tasks.push(task);
  if (!saveTasks()) {
    tasks = tasks.filter((item) => item.id !== task.id);
    return false;
  }
  activeCourseFilter = "all";
  activeStatusFilter = "all";
  calendarMonth = new Date(`${task.dueDate}T00:00:00`);
  selectedDate = task.dueDate;
  render();
  showToast("Tugas berhasil disimpan di perangkatmu.");
  pendingTaskDetails = null;
  showView("task-list");
  return true;
}

function renderSchedules() {
  const dayOrder = [1, 2, 3, 4, 5, 6, 0];
  const sorted = [...schedules].sort((a, b) =>
    dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day) || a.startTime.localeCompare(b.startTime)
  );
  document.querySelector("#schedule-count").textContent = String(sorted.length);
  document.querySelector("#schedule-list").innerHTML = sorted.length ? sorted.map((schedule) => `
    <article class="schedule-item">
      <span class="schedule-item-dot" style="--course-color:${colorForCourse(schedule.course)}"></span>
      <div class="schedule-item-copy">
        <strong>${escapeHTML(schedule.course)}</strong>
        <span>${WEEKDAYS_LONG[schedule.day]} · ${escapeHTML(schedule.startTime)}–${escapeHTML(schedule.endTime)}</span>
        <span>${[schedule.room, schedule.lecturer].filter(Boolean).map(escapeHTML).join(" · ") || "Detail tambahan belum diisi"}</span>
        ${schedule.notes ? `<span class="schedule-notes">${escapeHTML(schedule.notes)}</span>` : ""}
      </div>
      <button class="delete-task" type="button" aria-label="Hapus jadwal ${escapeHTML(schedule.course)}" title="Hapus jadwal" data-delete-schedule="${schedule.id}">×</button>
    </article>`).join("") : '<div class="empty-state">Belum ada jadwal kuliah tersimpan.<br>Tambahkan jadwal agar muncul di kalender mingguan.</div>';
}

function addSchedule(formData) {
  const startTime = formData.get("startTime");
  const endTime = formData.get("endTime");
  if (endTime <= startTime) {
    showToast("Waktu selesai harus lebih akhir dari waktu mulai.", true);
    elements.scheduleForm.elements.namedItem("endTime").focus();
    return false;
  }
  const schedule = {
    id: window.crypto && typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `schedule-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    course: formData.get("course").trim(),
    day: Number(formData.get("day")),
    startTime,
    endTime,
    room: formData.get("room").trim(),
    lecturer: formData.get("lecturer").trim(),
    notes: formData.get("notes").trim(),
  };
  if (!schedule.course || !Number.isInteger(schedule.day) || schedule.day < 0 || schedule.day > 6) {
    showToast("Lengkapi nama mata kuliah dan hari kuliah.", true);
    return false;
  }
  schedules.push(schedule);
  if (!saveSchedules()) {
    schedules = schedules.filter((item) => item.id !== schedule.id);
    return false;
  }
  elements.scheduleForm.reset();
  render();
  showToast("Jadwal kuliah berhasil disimpan.");
  return true;
}

function deleteSchedule(id) {
  const schedule = schedules.find((item) => item.id === id);
  if (!schedule || !window.confirm(`Hapus jadwal "${schedule.course}" setiap hari ${WEEKDAYS_LONG[schedule.day]}?`)) return;
  const originalSchedules = schedules;
  schedules = schedules.filter((item) => item.id !== id);
  if (!saveSchedules()) {
    schedules = originalSchedules;
    return;
  }
  render();
  showToast("Jadwal kuliah berhasil dihapus.");
}

function showView(view) {
  document.querySelectorAll("[data-page]").forEach((page) => {
    page.hidden = page.dataset.page !== view;
  });
  document.querySelectorAll(".nav-link[data-view]").forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view ||
      (view === "task" && link.dataset.view === "task-list"));
  });
  const pageTitles = {
    dashboard: "Ringkasan",
    "task-list": "Daftar tugas",
    task: "Tambah tugas",
    schedule: "Jadwal kuliah",
  };
  const pageTitle = pageTitles[view] || pageTitles.dashboard;
  document.querySelector(".breadcrumb strong").textContent = pageTitle;
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (view === "task") elements.taskDetailsForm.elements.namedItem("title").focus();
}

function showTaskListWithFilter(status) {
  activeCourseFilter = "all";
  activeStatusFilter = status;
  elements.courseFilter.value = "all";
  elements.statusFilter.value = status;
  renderTasks();
  showView("task-list");
}

function toggleTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  const oldState = { completed: task.completed, completedAt: task.completedAt };
  task.completed = !task.completed;
  task.completedAt = task.completed ? dateKey(new Date()) : null;
  if (!saveTasks()) {
    task.completed = oldState.completed;
    task.completedAt = oldState.completedAt;
    return;
  }
  render();
  showToast(task.completed ? "Tugas ditandai selesai. Bagus sekali!" : "Tugas ditandai belum selesai.");
}

function deleteTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;
  if (!window.confirm(`Hapus tugas "${task.title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
  const originalTasks = tasks;
  tasks = tasks.filter((item) => item.id !== id);
  if (!saveTasks()) {
    tasks = originalTasks;
    return;
  }
  render();
  showToast("Tugas berhasil dihapus.");
}

function openTaskPage() {
  pendingTaskDetails = null;
  elements.taskDetailsForm.reset();
  elements.taskDeadlineForm.reset();
  elements.taskDetailsForm.hidden = false;
  elements.taskDeadlineForm.hidden = true;
  document.querySelector("#task-step-indicator-1").classList.add("active");
  document.querySelector("#task-step-indicator-2").classList.remove("active");
  elements.taskDeadlineForm.elements.namedItem("dueDate").value =
    selectedDate < dateKey(new Date()) ? dateKey(new Date()) : selectedDate;
  showView("task");
}

function startTaskDeadlineStep(event) {
  event.preventDefault();
  const data = new FormData(elements.taskDetailsForm);
  pendingTaskDetails = {
    title: data.get("title").trim(),
    course: data.get("course").trim(),
    notes: data.get("notes").trim(),
  };
  const preview = document.querySelector("#task-preview");
  preview.replaceChildren();
  const title = document.createElement("strong");
  title.textContent = pendingTaskDetails.title;
  const course = document.createElement("span");
  course.textContent = pendingTaskDetails.course;
  preview.append(title, course);
  elements.taskDetailsForm.hidden = true;
  elements.taskDeadlineForm.hidden = false;
  document.querySelector("#task-step-indicator-1").classList.remove("active");
  document.querySelector("#task-step-indicator-2").classList.add("active");
  elements.taskDeadlineForm.elements.namedItem("dueDate").focus();
}

function returnToTaskDetails() {
  elements.taskDeadlineForm.hidden = true;
  elements.taskDetailsForm.hidden = false;
  document.querySelector("#task-step-indicator-1").classList.add("active");
  document.querySelector("#task-step-indicator-2").classList.remove("active");
  elements.taskDetailsForm.elements.namedItem("title").focus();
}

function checkBrowserReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const today = dateKey(new Date());
  for (const task of tasks) {
    if (!task.completed && task.dueDate === today) {
      const key = `smartstudy.reminder.${task.id}.${today}`;
      if (localStorage.getItem(key) === "shown") continue;
      new Notification("Deadline SmartStudy", { body: `Tenggat hari ini: ${task.title} (${task.course})` });
      localStorage.setItem(key, "shown");
    }
  }
}

document.querySelector("#add-task-button").addEventListener("click", openTaskPage);
document.querySelector("#task-list-add-button").addEventListener("click", openTaskPage);
document.querySelector("#open-task-list").addEventListener("click", () => showView("task-list"));
document.querySelector("#mobile-tasks-button").addEventListener("click", () => showView("task-list"));
document.querySelector("#mobile-schedule-button").addEventListener("click", () => showView("schedule"));
document.querySelectorAll("[data-task-view]").forEach((button) => {
  button.addEventListener("click", () => showTaskListWithFilter(button.dataset.taskView));
});
elements.taskDetailsForm.addEventListener("submit", startTaskDeadlineStep);
document.querySelector("#task-step-back").addEventListener("click", returnToTaskDetails);
elements.taskDeadlineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (pendingTaskDetails) addTask(pendingTaskDetails, new FormData(elements.taskDeadlineForm));
});
elements.scheduleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addSchedule(new FormData(elements.scheduleForm));
});
document.querySelector("#schedule-list").addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-schedule]");
  if (deleteButton) deleteSchedule(deleteButton.dataset.deleteSchedule);
});
document.querySelectorAll("[data-back-dashboard]").forEach((button) => {
  button.addEventListener("click", () => showView("dashboard"));
});
document.querySelector("#task-form-back").addEventListener("click", () => showView("task-list"));
document.querySelectorAll(".nav-link[data-view]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showView(link.dataset.view);
  });
});
elements.courseFilter.addEventListener("change", (event) => {
  activeCourseFilter = event.target.value;
  renderTasks();
});
elements.statusFilter.addEventListener("change", (event) => {
  activeStatusFilter = event.target.value;
  renderTasks();
});
elements.taskList.addEventListener("click", (event) => {
  const toggleButton = event.target.closest("[data-toggle-task]");
  const deleteButton = event.target.closest("[data-delete-task]");
  const expandButton = event.target.closest("[data-expand-task]");
  if (toggleButton) toggleTask(toggleButton.dataset.toggleTask);
  if (deleteButton) deleteTask(deleteButton.dataset.deleteTask);
  if (expandButton) {
    expandedTaskId = expandedTaskId === expandButton.dataset.expandTask ? null : expandButton.dataset.expandTask;
    renderTasks();
  }
});
elements.calendarGrid.addEventListener("click", (event) => {
  const dayButton = event.target.closest("[data-calendar-date]");
  if (!dayButton) return;
  selectedDate = dayButton.dataset.calendarDate;
  renderCalendar();
});
document.querySelector("#calendar-prev").addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
  renderCalendar();
});
document.querySelector("#calendar-next").addEventListener("click", () => {
  calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
  renderCalendar();
});
document.querySelector("#calendar-today").addEventListener("click", () => {
  const today = new Date();
  selectedDate = dateKey(today);
  calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  renderCalendar();
});
document.querySelector("#notification-button").addEventListener("click", async () => {
  if (!("Notification" in window)) {
    showToast("Browser ini belum mendukung notifikasi deadline.", true);
    return;
  }
  if (Notification.permission === "granted") {
    showToast("Pengingat deadline browser sudah aktif.");
    return;
  }
  if (Notification.permission === "denied") {
    showToast("Izin notifikasi diblokir. Aktifkan lewat pengaturan situs di browser.", true);
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    document.querySelector("#notification-button").classList.add("enabled");
    showToast("Pengingat deadline browser berhasil diaktifkan.");
    checkBrowserReminders();
  } else if (permission === "denied") {
    showToast("Izin notifikasi tidak diberikan. Pengingat tetap terlihat di halaman ini.", true);
  }
});

if ("Notification" in window && Notification.permission === "granted") {
  document.querySelector("#notification-button").classList.add("enabled");
}
render();
checkBrowserReminders();
reminderTimer = window.setInterval(() => {
  const now = new Date();
  if (now.getHours() === 8 && now.getMinutes() === 0) checkBrowserReminders();
  renderHeaderAndStats();
  renderTasks();
  renderReminders();
}, 60000);
window.addEventListener("beforeunload", () => window.clearInterval(reminderTimer));
