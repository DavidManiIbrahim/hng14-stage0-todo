const todoContainer = document.getElementById("todoContainer");
const addTodoButton = document.getElementById("addTodoButton");
const todoModal = document.getElementById("todoModal");
const confirmModal = document.getElementById("confirmModal");
const modalTitle = document.getElementById("modalTitle");
const todoForm = document.getElementById("todoForm");
const titleInput = document.getElementById("todoTitleInput");
const descInput = document.getElementById("todoDescriptionInput");
const priorityInput = document.getElementById("todoPriorityInput");
const dueInput = document.getElementById("todoDueInput");
const tagsInput = document.getElementById("todoTagsInput");
const cancelTodoButton = document.getElementById("cancelTodoButton");
const closeModalButtons = document.querySelectorAll(".close-modal");
const confirmDeleteButton = document.getElementById("confirmDeleteButton");
const cancelDeleteButton = document.getElementById("cancelDeleteButton");
const confirmMessage = document.getElementById("confirmMessage");

let activeEditCard = null;
let deleteTarget = null;

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRemaining(diff) {
  const totalMinutes = Math.max(0, Math.floor(Math.abs(diff) / 60000));
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (diff > 0) {
    if (totalDays > 1) return `Due in ${totalDays} days`;
    if (totalDays === 1) return "Due tomorrow";
    if (totalHours > 1) return `Due in ${totalHours} hours`;
    if (totalHours === 1) return "Due in 1 hour";
    if (totalMinutes > 1) return `Due in ${totalMinutes} minutes`;
    return "Due now!";
  }

  if (totalDays > 1) return `Overdue by ${totalDays} days`;
  if (totalHours > 1) return `Overdue by ${totalHours} hours`;
  if (totalHours === 1) return "Overdue by 1 hour";
  if (totalMinutes > 1) return `Overdue by ${totalMinutes} minutes`;
  return "Overdue now!";
}

function normalizeTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function updateCardTime(card) {
  const dueDate = new Date(card.dataset.due);
  const dueDateEl = card.querySelector("[data-testid='test-todo-due-date']") || card.querySelector(".due-date");
  const remainingEl = card.querySelector("[data-testid='test-todo-time-remaining']") || card.querySelector(".time-remaining");
  const remainingText = formatRemaining(dueDate - new Date());

  if (dueDateEl) {
    dueDateEl.textContent = `Due ${formatDate(dueDate)}`;
    dueDateEl.setAttribute("datetime", dueDate.toISOString());
  }

  if (remainingEl) {
    remainingEl.textContent = remainingText;
  }
}

function updateAllTimes() {
  const cards = todoContainer.querySelectorAll(".todo-card");
  cards.forEach(updateCardTime);
}

function openModal(modal) {
  modal.classList.remove("hidden");
  document.body.classList.add("no-scroll");
  const focusable = modal.querySelector("input, textarea, select, button");
  if (focusable) focusable.focus();
}

function closeModal(modal) {
  modal.classList.add("hidden");
  document.body.classList.remove("no-scroll");
  activeEditCard = null;
  deleteTarget = null;
}

function attachCardEvents(card) {
  const checkbox = card.querySelector("input[type='checkbox']");
  const statusLabel = card.querySelector(".status");
  const editButton = card.querySelector(".edit");
  const deleteButton = card.querySelector(".delete");

  checkbox.addEventListener("change", () => {
    const done = checkbox.checked;
    statusLabel.textContent = done ? "Done" : card.dataset.status || "Pending";
    card.classList.toggle("completed", done);
  });

  editButton.addEventListener("click", () => {
    activeEditCard = card;
    modalTitle.textContent = "Edit todo";
    titleInput.value = card.querySelector("h2").textContent;
    descInput.value = card.querySelector("p").textContent;
    priorityInput.value = card.dataset.priority || card.querySelector(".badge").textContent.trim();
    dueInput.value = new Date(card.dataset.due).toISOString().slice(0, 10);
    tagsInput.value = Array.from(card.querySelectorAll(".tag")).map((tag) => tag.textContent).join(", ");
    openModal(todoModal);
  });

  deleteButton.addEventListener("click", () => {
    deleteTarget = card;
    confirmMessage.textContent = "Delete this todo from the list?";
    openModal(confirmModal);
  });
}

function createTodoCard(todo) {
  const card = document.createElement("article");
  card.className = "todo-card";
  card.dataset.due = todo.dueDate.toISOString();
  card.dataset.status = todo.status;
  card.dataset.priority = todo.priority;
  card.dataset.tags = todo.tags.join(", ");
  card.setAttribute("data-testid", "test-todo-card");
  card.innerHTML = `
    <div class="checkbox-group">
      <input type="checkbox" id="${todo.elementId}" data-testid="test-todo-complete-toggle" />
      <label for="${todo.elementId}">Mark as complete</label>
    </div>
    <h2 data-testid="test-todo-title">${todo.title}</h2>
    <p data-testid="test-todo-description">${todo.description}</p>
    <div class="row">
      <span class="badge ${todo.priority.toLowerCase()}" data-testid="test-todo-priority">${todo.priority}</span>
      <span class="status" data-testid="test-todo-status">${todo.status}</span>
    </div>
    <div class="time-list">
      <time data-testid="test-todo-due-date" class="due-date" datetime="${todo.dueDate.toISOString()}">Due ${formatDate(todo.dueDate)}</time>
      <time data-testid="test-todo-time-remaining" class="time-remaining" aria-live="polite">${formatRemaining(todo.dueDate - new Date())}</time>
    </div>
    <ul class="tags" role="list" data-testid="test-todo-tags">
      ${todo.tags.map((tag) => `<li class="tag">${tag}</li>`).join("")}
    </ul>
    <div class="actions">
      <button class="edit" type="button" data-testid="test-todo-edit-button">Edit</button>
      <button class="delete" type="button" data-testid="test-todo-delete-button">Delete</button>
    </div>
  `;

  attachCardEvents(card);
  return card;
}

function openAddModal() {
  activeEditCard = null;
  modalTitle.textContent = "Add todo";
  titleInput.value = "";
  descInput.value = "";
  priorityInput.value = "Medium";
  dueInput.value = new Date().toISOString().slice(0, 10);
  tagsInput.value = "work, urgent";
  openModal(todoModal);
}

function saveTodo(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const description = descInput.value.trim();
  const priority = priorityInput.value;
  const dueDate = new Date(dueInput.value);
  const tags = normalizeTags(tagsInput.value);

  if (!title || !description || Number.isNaN(dueDate.getTime())) {
    return;
  }

  if (activeEditCard) {
    activeEditCard.querySelector("h2").textContent = title;
    activeEditCard.querySelector("p").textContent = description;
    const badge = activeEditCard.querySelector(".badge");
    badge.textContent = priority;
    badge.className = `badge ${priority.toLowerCase()}`;
    activeEditCard.dataset.priority = priority;
    activeEditCard.dataset.due = dueDate.toISOString();
    activeEditCard.dataset.tags = tags.join(", ");
    const tagList = activeEditCard.querySelector(".tags");
    tagList.innerHTML = tags.map((tag) => `<li class="tag">${tag}</li>`).join("");
    updateCardTime(activeEditCard);
  } else {
    const todo = {
      elementId: `todo-checkbox-${Date.now()}`,
      title,
      description,
      priority,
      status: "Pending",
      dueDate,
      tags,
    };

    const newCard = createTodoCard(todo);
    todoContainer.appendChild(newCard);
    newCard.scrollIntoView({ behavior: "smooth" });
  }

  closeModal(todoModal);
}

function confirmDelete() {
  if (deleteTarget) {
    deleteTarget.remove();
    deleteTarget = null;
  }
  closeModal(confirmModal);
}

function handleKeydown(event) {
  if (event.key === "Escape") {
    if (!todoModal.classList.contains("hidden")) closeModal(todoModal);
    if (!confirmModal.classList.contains("hidden")) closeModal(confirmModal);
  }
}

function initStaticCard() {
  const card = document.querySelector("[data-testid='test-todo-card']");
  if (!card) return;
  card.dataset.status = "Pending";
  card.dataset.priority = "High";
  attachCardEvents(card);
}

addTodoButton.addEventListener("click", openAddModal);
todoForm.addEventListener("submit", saveTodo);
cancelTodoButton.addEventListener("click", () => closeModal(todoModal));
confirmDeleteButton.addEventListener("click", confirmDelete);
cancelDeleteButton.addEventListener("click", () => closeModal(confirmModal));
closeModalButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const modal = button.closest(".modal-backdrop");
    if (modal) closeModal(modal);
  });
});
window.addEventListener("keydown", handleKeydown);

initStaticCard();
updateAllTimes();
setInterval(updateAllTimes, 60000);