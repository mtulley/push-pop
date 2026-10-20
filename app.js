const DB_NAME = "pushpop-daily";
const DB_VERSION = 1;
const STORE_NAME = "tasks";

const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const dialog = document.querySelector("#task-dialog");
const form = document.querySelector("#task-form");
const toast = document.querySelector("#toast");

let tasks = [];
let database;
let toastTimer;
let editingTaskId = null;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not support local task storage."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function store(mode = "readonly") {
  return database.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

function getAllTasks() {
  return new Promise((resolve, reject) => {
    const request = store().getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveTask(task) {
  return new Promise((resolve, reject) => {
    const request = store("readwrite").put(task);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
}

function removeTask(id) {
  return new Promise((resolve, reject) => {
    const request = store("readwrite").delete(id);
    request.onsuccess = resolve;
    request.onerror = () => reject(request.error);
  });
}

function updateTask(task) {
  return saveTask(task);
}

function makeTaskElement(task) {
  const card = document.createElement("article");
  card.className = `task-card${task.completed ? " done" : ""}`;

  const check = document.createElement("button");
  check.className = "check-button";
  check.type = "button";
  const checkLabel = task.completed
    ? `Mark ${task.name} as not completed`
    : `Mark ${task.name} as completed`;
  check.setAttribute("aria-label", checkLabel);
  check.setAttribute("aria-pressed", String(task.completed));
  check.innerHTML = task.completed
    ? '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
      '<path d="m3 8 3.2 3.2L13 4.5" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" ' +
      'stroke-linejoin="round"/></svg>'
    : "";
  check.addEventListener("click", async () => {
    task.completed = !task.completed;
    await updateTask(task);
    render();
  });

  const copy = document.createElement("div");
  copy.className = "task-copy";

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.name;
  copy.append(title);

  if (task.description) {
    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent = task.description;
    copy.append(description);
  }

  const meta = document.createElement("div");
  meta.className = "task-meta";
  if (task.duration) {
    const duration = document.createElement("span");
    duration.className = "duration";
    duration.textContent = `${task.duration} min`;
    meta.append(duration);
  }

  const remove = document.createElement("button");
  remove.className = "delete-button";
  remove.type = "button";
  remove.setAttribute("aria-label", `Permanently remove ${task.name}`);
  remove.title = "Remove task";
  remove.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/>' +
    "</svg>";
  remove.addEventListener("click", async () => {
    await removeTask(task.id);
    tasks = tasks.filter((item) => item.id !== task.id);
    render();
    showToast("Task removed from today.");
  });

  const edit = document.createElement("button");
  edit.className = "edit-button";
  edit.type = "button";
  edit.setAttribute("aria-label", `Edit ${task.name}`);
  edit.title = "Edit task";
  edit.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="m14 5 5 5M4 20l4.2-.9L19 8.3' +
    'a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z"/>' +
    "</svg>";
  edit.addEventListener("click", () => openForm(task));

  meta.append(edit, remove);
  card.append(check, copy, meta);
  return card;
}

function render() {
  taskList.replaceChildren(...tasks.map(makeTaskElement));
  emptyState.hidden = tasks.length > 0;

  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  document.querySelector("#completed-count").textContent = completed;
  document.querySelector("#total-count").textContent = total;
  document.querySelector("#heading-total").textContent = `(${total})`;
  document.querySelector("#progress-fill").style.width = `${percent}%`;
  document
    .querySelector(".progress-track")
    .setAttribute("aria-valuenow", percent);

  const badge = document.querySelector("#progress-badge");
  const message = document.querySelector("#progress-message");
  badge.classList.toggle("complete", total > 0 && completed === total);

  if (total > 0 && completed === total) {
    badge.textContent = "DAY COMPLETE";
    message.textContent = "You made room for what matters.";
  } else if (completed > 0) {
    badge.textContent = "IN MOTION";
    message.textContent = "Keep your good thing going.";
  } else {
    badge.textContent = "FRESH START";
    message.textContent = "Every good day starts somewhere.";
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2300);
}

function openForm(task = null) {
  editingTaskId = task?.id ?? null;
  document.querySelector("#dialog-title").textContent = task
    ? "Edit this task."
    : "A new task.";
  document.querySelector("#task-name").value = task?.name ?? "";
  document.querySelector("#task-description").value = task?.description ?? "";
  document.querySelector("#task-duration").value = task?.duration ?? "";
  document.querySelector("#submit-label").textContent = task
    ? "Save changes"
    : "Add to the stack";

  dialog.showModal();
  requestAnimationFrame(() => {
    document.querySelector("#task-name").focus();
  });
}

const dateOptions = {
  weekday: "long",
  month: "long",
  day: "numeric",
};
const today = new Intl.DateTimeFormat(undefined, dateOptions);
document.querySelector("#today-date").textContent = today
  .format(new Date())
  .toUpperCase();

document.querySelector("#open-form").addEventListener("click", openForm);
document.querySelector("#empty-add").addEventListener("click", openForm);
document.querySelector("#close-form").addEventListener("click", () => {
  dialog.close();
});
document.querySelector("#cancel-form").addEventListener("click", () => {
  dialog.close();
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const existingTask = tasks.find((item) => item.id === editingTaskId);
  const task = {
    id: editingTaskId ?? crypto.randomUUID(),
    name: data.get("name").trim(),
    description: data.get("description").trim(),
    duration: data.get("duration") ? Number(data.get("duration")) : null,
    completed: existingTask?.completed ?? false,
    createdAt: existingTask?.createdAt ?? Date.now(),
  };

  if (!task.name) return;
  await saveTask(task);

  if (editingTaskId) {
    tasks = tasks.map((item) => (item.id === editingTaskId ? task : item));
  } else {
    tasks.push(task);
  }

  render();
  form.reset();
  dialog.close();
  showToast(editingTaskId ? "Task updated." : "Added to your stack.");
  editingTaskId = null;
});

document.querySelector("#reset-button").addEventListener("click", async () => {
  const changed = tasks.some((task) => task.completed);
  if (!changed) {
    const message = tasks.length
      ? "Your tasks are already fresh."
      : "Add a task to start your day.";
    showToast(message);
    return;
  }

  tasks = tasks.map((task) => ({ ...task, completed: false }));
  await Promise.all(tasks.map(updateTask));
  render();
  showToast("A fresh start. Your tasks are still here.");
});

async function init() {
  try {
    database = await openDatabase();
    tasks = (await getAllTasks()).sort((a, b) => a.createdAt - b.createdAt);
    render();
  } catch (error) {
    console.error(error);
    showToast("Could not open local storage. Please check browser settings.");
    document.querySelector("#open-form").disabled = true;
    document.querySelector("#empty-add").disabled = true;
  }
}

init();
