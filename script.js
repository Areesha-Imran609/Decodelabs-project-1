/* =========================================================
   Tasklight – Project 1 (DecodeLabs)
   Vanilla JavaScript: state, rendering, validation, storage
   ========================================================= */
(() => {
  'use strict';

  /* ---------- Constants ---------- */
  const STORAGE_KEY = 'tasklight.tasks.v1';
  const THEME_KEY = 'tasklight.theme';
  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
  const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };

  /* ---------- DOM references ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const els = {
    form: $('#task-form'),
    title: $('#task-title'),
    priority: $('#task-priority'),
    due: $('#task-due'),
    titleError: $('#title-error'),
    dueError: $('#due-error'),
    submit: $('#submit-btn'),
    cancel: $('#cancel-edit'),
    formHeading: $('#form-heading'),
    list: $('#task-list'),
    listHeading: $('#list-heading'),
    empty: $('#empty-state'),
    search: $('#task-search'),
    sort: $('#task-sort'),
    filterBtns: $$('[data-filter]'),
    progress: $('#progress-bar'),
    progressLabel: $('#progress-label'),
    clearDone: $('#clear-done'),
    menuBtn: $('#menu-toggle'),
    sidebar: $('#sidebar'),
    themeBtn: $('#theme-toggle'),
    themeLabel: $('#theme-label'),
    status: $('#status'),
  };

  /* ---------- State ---------- */
  const state = {
    tasks: loadTasks(),
    filter: 'all',
    search: '',
    sort: 'newest',
    editingId: null,
  };

  /* ---------- Storage helpers (always guarded) ---------- */
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return seedTasks();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
    } catch {
      announce('Could not save tasks in this browser.');
    }
  }

  function seedTasks() {
    // Friendly starter data on first visit
    return [
      makeTask('Create wireframes (mobile first)', 'high', offsetDate(2)),
      makeTask('Build semantic HTML structure', 'medium', offsetDate(4)),
      { ...makeTask('Read the project brief', 'low', ''), done: true },
    ];
  }

  /* ---------- Utilities ---------- */
  function makeTask(title, priority, due) {
    return {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      title,
      priority,
      due,
      done: false,
      createdAt: Date.now(),
    };
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function toISO(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function todayISO() { return toISO(new Date()); }

  function offsetDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return toISO(d);
  }

  function formatDate(iso) {
    return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  function announce(message) {
    // Clear first so repeated messages are re-announced
    els.status.textContent = '';
    setTimeout(() => { els.status.textContent = message; }, 50);
  }

  /* ---------- Validation ---------- */
  function validate() {
    let valid = true;
    const title = els.title.value.trim();

    els.titleError.textContent = '';
    els.dueError.textContent = '';
    els.title.removeAttribute('aria-invalid');
    els.due.removeAttribute('aria-invalid');

    if (title.length === 0) {
      els.titleError.textContent = 'Enter a task name.';
    } else if (title.length < 3) {
      els.titleError.textContent = 'Task name needs at least 3 characters.';
    }
    if (els.titleError.textContent) {
      els.title.setAttribute('aria-invalid', 'true');
      valid = false;
    }

    // Only block past dates for new tasks (editing old tasks stays possible)
    if (els.due.value && !state.editingId && els.due.value < todayISO()) {
      els.dueError.textContent = 'Choose today or a future date.';
      els.due.setAttribute('aria-invalid', 'true');
      valid = false;
    }

    if (!valid) {
      (els.titleError.textContent ? els.title : els.due).focus();
    }
    return valid;
  }

  /* ---------- Filtering / sorting ---------- */
  function getVisibleTasks() {
    const q = state.search.trim().toLowerCase();

    const list = state.tasks.filter((t) => {
      if (state.filter === 'active' && t.done) return false;
      if (state.filter === 'completed' && !t.done) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });

    if (state.sort === 'due') {
      list.sort((a, b) => (a.due || '9999-12-31').localeCompare(b.due || '9999-12-31'));
    } else if (state.sort === 'priority') {
      list.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }
    return list;
  }

  /* ---------- Rendering ---------- */
  function createTaskItem(task) {
    const today = todayISO();
    const li = document.createElement('li');

    const card = document.createElement('div');
    card.className = 'task' + (task.done ? ' is-done' : '');
    card.dataset.id = task.id;
    card.dataset.priority = task.priority;

    // Row 1: checkbox + title
    const main = document.createElement('div');
    main.className = 'task-main';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'chk-' + task.id;
    checkbox.checked = task.done;
    checkbox.dataset.action = 'toggle';

    const label = document.createElement('label');
    label.className = 'task-title';
    label.htmlFor = checkbox.id;
    label.textContent = task.title;   // textContent => safe from HTML injection

    main.append(checkbox, label);

    // Row 2: meta
    const meta = document.createElement('div');
    meta.className = 'task-meta';

    const badge = document.createElement('span');
    badge.className = 'badge badge-' + task.priority;
    badge.textContent = PRIORITY_LABEL[task.priority] + ' priority';
    meta.append(badge);

    if (task.due) {
      const due = document.createElement('span');
      const overdue = !task.done && task.due < today;
      due.className = 'due' + (overdue ? ' is-overdue' : '');
      due.textContent = (overdue ? 'Overdue: ' : 'Due ') + formatDate(task.due);
      meta.append(due);
    }

    // Row 3: actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-outline btn-small';
    editBtn.dataset.action = 'edit';
    editBtn.textContent = 'Edit';
    editBtn.setAttribute('aria-label', 'Edit task: ' + task.title);

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn btn-danger btn-small';
    delBtn.dataset.action = 'delete';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', 'Delete task: ' + task.title);

    actions.append(editBtn, delBtn);

    card.append(main, meta, actions);
    li.append(card);
    return li;
  }

  function render() {
    const visible = getVisibleTasks();

    els.list.replaceChildren(...visible.map(createTaskItem));

    // Empty state messages
    const noTasksAtAll = state.tasks.length === 0;
    els.empty.hidden = visible.length > 0;
    if (visible.length === 0) {
      const [title, hint] = els.empty.querySelectorAll('p');
      if (noTasksAtAll) {
        title.textContent = 'Nothing here yet';
        hint.textContent = 'Add your first task using the form above.';
      } else {
        title.textContent = 'No tasks match';
        hint.textContent = 'Try a different filter or search term.';
      }
    }

    renderStats();
  }

  function renderStats() {
    const total = state.tasks.length;
    const done = state.tasks.filter((t) => t.done).length;
    const pending = total - done;

    $('[data-count="all"]').textContent = total;
    $('[data-count="active"]').textContent = pending;
    $('[data-count="completed"]').textContent = done;

    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    els.progress.value = pct;
    els.progress.setAttribute('aria-valuetext', pct + ' percent complete');
    els.progressLabel.textContent =
      total === 0 ? 'No tasks yet' : `${done} of ${total} done (${pct}%)`;

    els.clearDone.disabled = done === 0;
  }

  /* ---------- Form mode (add / edit) ---------- */
  function enterEditMode(task) {
    state.editingId = task.id;
    els.title.value = task.title;
    els.priority.value = task.priority;
    els.due.value = task.due || '';
    els.formHeading.textContent = 'Edit task';
    els.submit.textContent = 'Save changes';
    els.cancel.hidden = false;
    els.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    els.title.focus();
  }

  function exitEditMode() {
    state.editingId = null;
    els.form.reset();
    els.priority.value = 'medium';
    els.titleError.textContent = '';
    els.dueError.textContent = '';
    els.title.removeAttribute('aria-invalid');
    els.due.removeAttribute('aria-invalid');
    els.formHeading.textContent = 'Add a task';
    els.submit.textContent = 'Add task';
    els.cancel.hidden = true;
  }

  /* ---------- Event handlers ---------- */
  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validate()) return;

    const title = els.title.value.trim();
    const priority = els.priority.value;
    const due = els.due.value;

    if (state.editingId) {
      const task = state.tasks.find((t) => t.id === state.editingId);
      if (task) Object.assign(task, { title, priority, due });
      announce('Task updated.');
    } else {
      state.tasks.push(makeTask(title, priority, due));
      announce('Task added.');
    }

    saveTasks();
    exitEditMode();
    render();
    els.title.focus();
  });

  els.cancel.addEventListener('click', () => {
    exitEditMode();
    announce('Edit cancelled.');
  });

  // Event delegation for checkbox / edit / delete
  els.list.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const id = btn.closest('.task').dataset.id;
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;

    if (btn.dataset.action === 'edit') {
      enterEditMode(task);
    } else if (btn.dataset.action === 'delete') {
      state.tasks = state.tasks.filter((t) => t.id !== id);
      if (state.editingId === id) exitEditMode();
      saveTasks();
      render();
      announce('Task deleted.');
      els.listHeading.focus();   // keep keyboard focus in a sensible place
    }
  });

  els.list.addEventListener('change', (e) => {
    const box = e.target.closest('input[data-action="toggle"]');
    if (!box) return;
    const id = box.closest('.task').dataset.id;
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    task.done = box.checked;
    saveTasks();
    render();
    announce(task.done ? 'Task marked as done.' : 'Task marked as to do.');
    // Restore focus to the same checkbox after re-render
    const again = document.getElementById('chk-' + id);
    if (again) again.focus();
  });

  els.filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.filter = btn.dataset.filter;
      els.filterBtns.forEach((b) =>
        b.setAttribute('aria-pressed', String(b === btn)));
      render();
      closeMenu();
    });
  });

  els.search.addEventListener('input', () => {
    state.search = els.search.value;
    render();
  });

  els.sort.addEventListener('change', () => {
    state.sort = els.sort.value;
    render();
  });

  els.clearDone.addEventListener('click', () => {
    const count = state.tasks.filter((t) => t.done).length;
    if (count === 0) return;
    if (!window.confirm(`Delete ${count} completed task${count > 1 ? 's' : ''}?`)) return;
    state.tasks = state.tasks.filter((t) => !t.done);
    saveTasks();
    render();
    announce('Completed tasks cleared.');
  });

  /* ---------- Mobile menu ---------- */
  function openMenu() {
    els.sidebar.classList.add('is-open');
    els.menuBtn.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    els.sidebar.classList.remove('is-open');
    els.menuBtn.setAttribute('aria-expanded', 'false');
  }

  els.menuBtn.addEventListener('click', () => {
    els.sidebar.classList.contains('is-open') ? closeMenu() : openMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.sidebar.classList.contains('is-open')) {
      closeMenu();
      els.menuBtn.focus();
    }
  });

  /* ---------- Theme toggle ---------- */
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function currentTheme() {
    const explicit = document.documentElement.getAttribute('data-theme');
    if (explicit) return explicit;
    return darkQuery.matches ? 'dark' : 'light';
  }

  function paintThemeButton() {
    const isDark = currentTheme() === 'dark';
    els.themeBtn.setAttribute('aria-pressed', String(isDark));
    els.themeLabel.textContent = isDark ? 'Light mode' : 'Dark mode';
  }

  els.themeBtn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    paintThemeButton();
  });

  /* ---------- Init ---------- */
  els.due.min = todayISO();
  paintThemeButton();
  saveTasks();   // persists seed data on first run
  render();
})();
