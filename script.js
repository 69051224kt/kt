(function () {
  const STORAGE_TASKS = "studyflow-tasks";
  const STORAGE_NAME = "studyflow-name";
  const STORAGE_SESSIONS = "studyflow-sessions-done";
  const STORAGE_QUOTE = "studyflow-quote-index";

  const defaultTasks = [
    { id: "t1", title: "Finish calculus problem set 6", subject: "Math", priority: "high", done: false },
    { id: "t2", title: "Read biology chapter on cell membranes", subject: "Science", priority: "medium", done: false },
    { id: "t3", title: "Outline history essay introduction", subject: "History", priority: "medium", done: true },
    { id: "t4", title: "Practice 20 Spanish flashcards", subject: "Language", priority: "low", done: false }
  ];

  const quotes = [
    "Small, finished sessions beat long, unfinished plans.",
    "Review yesterday’s notes before starting something new.",
    "Protect one deep-work hour. The rest of the day will follow.",
    "Rest is part of studying — tired minds do not keep ideas.",
    "If it takes two minutes, do it now and clear the list."
  ];

  const weeklySchedule = [
    {
      day: "Monday",
      sessions: [
        { time: "09:00–10:30", title: "Calculus lecture" },
        { time: "13:00–14:30", title: "Library problem set" },
        { time: "19:00–20:00", title: "Spanish vocabulary" }
      ]
    },
    {
      day: "Tuesday",
      sessions: [
        { time: "10:00–11:30", title: "Biology lab recap" },
        { time: "15:00–16:30", title: "Group project standup" },
        { time: "20:00–20:40", title: "Light review walk" }
      ]
    },
    {
      day: "Wednesday",
      sessions: [
        { time: "09:00–10:30", title: "History seminar" },
        { time: "12:30–14:00", title: "Essay research block" },
        { time: "18:30–19:30", title: "Practice quiz" }
      ]
    },
    {
      day: "Thursday",
      sessions: [
        { time: "08:30–10:00", title: "Office hours / questions" },
        { time: "14:00–16:00", title: "Science reading sprint" },
        { time: "21:00–21:20", title: "Plan Friday’s tasks" }
      ]
    },
    {
      day: "Friday",
      sessions: [
        { time: "09:00–11:00", title: "Project studio time" },
        { time: "15:00–16:00", title: "Weekly recap notes" },
        { time: "Evening", title: "Social reset — no study" }
      ]
    },
    {
      day: "Saturday",
      sessions: [
        { time: "10:00–12:00", title: "Catch-up study block" },
        { time: "16:00–16:45", title: "Flashcards outdoors" }
      ]
    },
    {
      day: "Sunday",
      sessions: [
        { time: "11:00–12:00", title: "Plan the coming week" },
        { time: "Afternoon", title: "Rest and reset" }
      ]
    }
  ];

  const els = {
    nav: document.getElementById("siteNav"),
    navToggle: document.getElementById("navToggle"),
    views: document.querySelectorAll(".view"),
    links: document.querySelectorAll("[data-nav]"),
    todayDate: document.getElementById("todayDate"),
    displayName: document.getElementById("displayName"),
    nameForm: document.getElementById("nameForm"),
    nameInput: document.getElementById("nameInput"),
    statCompleted: document.getElementById("statCompleted"),
    statTotal: document.getElementById("statTotal"),
    statOpen: document.getElementById("statOpen"),
    statSessions: document.getElementById("statSessions"),
    progressPercent: document.getElementById("progressPercent"),
    progressBar: document.getElementById("progressBar"),
    progressFill: document.getElementById("progressFill"),
    todayFocus: document.getElementById("todayFocus"),
    goToTasks: document.getElementById("goToTasks"),
    studyQuote: document.getElementById("studyQuote"),
    newQuote: document.getElementById("newQuote"),
    taskForm: document.getElementById("taskForm"),
    taskTitle: document.getElementById("taskTitle"),
    taskSubject: document.getElementById("taskSubject"),
    taskPriority: document.getElementById("taskPriority"),
    taskList: document.getElementById("taskList"),
    taskEmpty: document.getElementById("taskEmpty"),
    clearCompleted: document.getElementById("clearCompleted"),
    filters: document.querySelectorAll("[data-filter]"),
    scheduleGrid: document.getElementById("scheduleGrid")
  };

  let tasks = loadTasks();
  let filter = "all";
  let doneSessions = loadJson(STORAGE_SESSIONS, {});
  let quoteIndex = Number(localStorage.getItem(STORAGE_QUOTE) || 0);

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function loadTasks() {
    const saved = loadJson(STORAGE_TASKS, null);
    return Array.isArray(saved) ? saved : defaultTasks.slice();
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_TASKS, JSON.stringify(tasks));
  }

  function showView(name) {
    els.views.forEach(function (view) {
      const match = view.id === name;
      view.hidden = !match;
      view.classList.toggle("is-visible", match);
    });
    els.links.forEach(function (link) {
      link.classList.toggle("is-active", link.dataset.nav === name);
    });
    els.nav.classList.remove("is-open");
    els.navToggle.setAttribute("aria-expanded", "false");
    els.navToggle.setAttribute("aria-label", "Open menu");
    if (history.replaceState) {
      history.replaceState(null, "", "#" + name);
    }
  }

  function formatToday() {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    });
  }

  function weekdayName() {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
  }

  function updateName() {
    const name = (localStorage.getItem(STORAGE_NAME) || "Student").trim() || "Student";
    els.displayName.textContent = name;
    els.nameInput.value = name === "Student" ? "" : name;
  }

  function progress() {
    const total = tasks.length;
    const completed = tasks.filter(function (task) { return task.done; }).length;
    const open = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    els.statCompleted.textContent = String(completed);
    els.statTotal.textContent = String(total);
    els.statOpen.textContent = String(open);
    els.progressPercent.textContent = percent + "%";
    els.progressFill.style.width = percent + "%";
    els.progressBar.setAttribute("aria-valuenow", String(percent));
    return { total: total, completed: completed, open: open, percent: percent };
  }

  function renderFocus() {
    const open = tasks.filter(function (task) { return !task.done; }).slice(0, 3);
    if (!open.length) {
      els.todayFocus.innerHTML = "<li class=\"focus-item\"><p>All caught up. Add a new task when you are ready.</p></li>";
      return;
    }
    els.todayFocus.innerHTML = open.map(function (task) {
      return (
        "<li class=\"focus-item\">" +
          "<div><p>" + escapeHtml(task.title) + "</p><span class=\"task-meta\">" + escapeHtml(task.subject) + "</span></div>" +
          "<button type=\"button\" class=\"btn btn-secondary\" data-complete=\"" + task.id + "\">Mark done</button>" +
        "</li>"
      );
    }).join("");
  }

  function visibleTasks() {
    if (filter === "open") return tasks.filter(function (task) { return !task.done; });
    if (filter === "done") return tasks.filter(function (task) { return task.done; });
    return tasks;
  }

  function renderTasks() {
    const list = visibleTasks();
    els.taskEmpty.hidden = list.length !== 0;
    els.taskList.innerHTML = list.map(function (task) {
      return (
        "<li class=\"task-item" + (task.done ? " is-done" : "") + "\">" +
          "<div class=\"task-main\">" +
            "<input class=\"checkbox\" type=\"checkbox\" data-toggle=\"" + task.id + "\" " + (task.done ? "checked" : "") + " aria-label=\"Complete " + escapeHtml(task.title) + "\" />" +
            "<div>" +
              "<p>" + escapeHtml(task.title) + "</p>" +
              "<span class=\"task-meta\">" + escapeHtml(task.subject) +
              " · <span class=\"priority priority-" + task.priority + "\">" + task.priority + "</span></span>" +
            "</div>" +
          "</div>" +
          "<div class=\"task-actions\">" +
            "<button type=\"button\" class=\"btn btn-secondary\" data-toggle=\"" + task.id + "\">" + (task.done ? "Undo" : "Complete") + "</button>" +
            "<button type=\"button\" class=\"btn btn-danger\" data-delete=\"" + task.id + "\">Delete</button>" +
          "</div>" +
        "</li>"
      );
    }).join("");
  }

  function sessionKey(day, title) {
    return day + "::" + title;
  }

  function renderSchedule() {
    const today = weekdayName();
    els.scheduleGrid.innerHTML = weeklySchedule.map(function (day) {
      const sessions = day.sessions.map(function (session) {
        const key = sessionKey(day.day, session.title);
        const done = Boolean(doneSessions[key]);
        return (
          "<div class=\"session\">" +
            "<time>" + session.time + "</time>" +
            "<p>" + session.title + "</p>" +
            "<div class=\"session-actions\">" +
              "<button type=\"button\" class=\"btn " + (done ? "btn-ghost" : "btn-secondary") + "\" data-session=\"" + encodeURIComponent(key) + "\">" +
                (done ? "Undo session" : "Mark attended") +
              "</button>" +
            "</div>" +
          "</div>"
        );
      }).join("");
      return (
        "<article class=\"card day-card" + (day.day === today ? " is-today" : "") + "\">" +
          "<h2>" + day.day + (day.day === today ? " · today" : "") + "</h2>" +
          sessions +
        "</article>"
      );
    }).join("");
    updateSessionStat();
  }

  function updateSessionStat() {
    els.statSessions.textContent = String(Object.keys(doneSessions).filter(function (key) {
      return doneSessions[key];
    }).length);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function refresh() {
    progress();
    renderFocus();
    renderTasks();
    updateSessionStat();
  }

  els.navToggle.addEventListener("click", function () {
    const open = !els.nav.classList.contains("is-open");
    els.nav.classList.toggle("is-open", open);
    els.navToggle.setAttribute("aria-expanded", String(open));
    els.navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  els.links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      showView(link.dataset.nav);
    });
  });

  els.goToTasks.addEventListener("click", function () {
    showView("tasks");
  });

  els.nameForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const name = els.nameInput.value.trim() || "Student";
    localStorage.setItem(STORAGE_NAME, name);
    updateName();
  });

  els.newQuote.addEventListener("click", function () {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    localStorage.setItem(STORAGE_QUOTE, String(quoteIndex));
    els.studyQuote.textContent = quotes[quoteIndex];
  });

  els.taskForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const title = els.taskTitle.value.trim();
    if (!title) return;
    tasks.unshift({
      id: "t" + Date.now(),
      title: title,
      subject: els.taskSubject.value,
      priority: els.taskPriority.value,
      done: false
    });
    els.taskTitle.value = "";
    saveTasks();
    refresh();
  });

  document.addEventListener("click", function (event) {
    const completeBtn = event.target.closest("[data-complete]");
    const toggleBtn = event.target.closest("[data-toggle]");
    const deleteBtn = event.target.closest("[data-delete]");
    const sessionBtn = event.target.closest("[data-session]");
    const filterBtn = event.target.closest("[data-filter]");

    if (completeBtn) {
      toggleTask(completeBtn.getAttribute("data-complete"), true);
    }
    if (toggleBtn) {
      const id = toggleBtn.getAttribute("data-toggle");
      const task = tasks.find(function (item) { return item.id === id; });
      if (task) toggleTask(id, !task.done);
    }
    if (deleteBtn) {
      const id = deleteBtn.getAttribute("data-delete");
      tasks = tasks.filter(function (item) { return item.id !== id; });
      saveTasks();
      refresh();
    }
    if (sessionBtn) {
      const key = decodeURIComponent(sessionBtn.getAttribute("data-session"));
      doneSessions[key] = !doneSessions[key];
      localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(doneSessions));
      renderSchedule();
    }
    if (filterBtn) {
      filter = filterBtn.getAttribute("data-filter");
      els.filters.forEach(function (chip) {
        chip.classList.toggle("is-active", chip === filterBtn);
      });
      renderTasks();
    }
  });

  function toggleTask(id, done) {
    tasks = tasks.map(function (task) {
      if (task.id === id) {
        return { id: task.id, title: task.title, subject: task.subject, priority: task.priority, done: done };
      }
      return task;
    });
    saveTasks();
    refresh();
  }

  els.clearCompleted.addEventListener("click", function () {
    tasks = tasks.filter(function (task) { return !task.done; });
    saveTasks();
    refresh();
  });

  function boot() {
    els.todayDate.textContent = formatToday();
    updateName();
    els.studyQuote.textContent = quotes[quoteIndex % quotes.length];
    renderSchedule();
    refresh();
    const hash = (location.hash || "#dashboard").replace("#", "");
    const allowed = { dashboard: true, tasks: true, schedule: true };
    showView(allowed[hash] ? hash : "dashboard");
  }

  boot();
})();
