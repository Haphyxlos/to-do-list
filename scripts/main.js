/* ==================== 模块导入 ==================== */
import { createTodoPrompt } from "./custom-prompt.js";
import { createConfirmDialog } from "./confirm-dialog.js";

/* ==================== 数据初始化 ==================== */
let todos = JSON.parse(localStorage.getItem("todos")) || [];

// 数据迁移：确保旧版本数据有isPinned属性
todos = todos.map((todo) => {
  if (todo.isPinned === undefined) {
    todo.isPinned = false;
  }
  return todo;
});

let editingTodoId = null;

/* ==================== 组件初始化 ==================== */
const { show: showPrompt } = createTodoPrompt(addOrUpdateTodo);
const { show: showConfirm } = createConfirmDialog();

/* ==================== DOM加载完成事件 ==================== */
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("Add").addEventListener("click", () => {
    editingTodoId = null;
    showPrompt();
  });

  document.getElementById("Del").addEventListener("click", handleClearAll);

  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = filterTodos(searchTerm);
    updateSearchStatus(searchTerm, filtered.length);
    render();
  });

  document.getElementById("tag-filter").addEventListener("change", render);

  setInterval(checkExpiredTasks, 60 * 1000);
  checkExpiredTasks();
  render();
});

/* ==================== 核心功能函数 ==================== */
function addOrUpdateTodo(text, tag, deadline) {
  if (editingTodoId) {
    const todoIndex = todos.findIndex((t) => t.id === editingTodoId);
    if (todoIndex !== -1) {
      todos[todoIndex].text = text.trim();
      todos[todoIndex].tag = tag?.trim() || null;
      todos[todoIndex].deadline = deadline || null;
      todos[todoIndex].updatedAt = new Date().toLocaleString();
    }
  } else {
    todos.push({
      id: Date.now(),
      text: text.trim(),
      tag: tag?.trim() || null,
      deadline: deadline || null,
      completed: false,
      isPinned: false,
      createdAt: new Date().toLocaleString(),
    });
  }

  save();
  render();
  editingTodoId = null;
}

async function deleteTodo(id) {
  const todo = todos.find((t) => t.id === id);
  const confirmed = await showConfirm(`确定删除"${todo.text}"吗？`);
  if (confirmed) {
    todos = todos.filter((t) => t.id !== id);
    save();
    render();
  }
}

function editTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    editingTodoId = id;
    showPrompt(todo);
  }
}

function togglePin(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.isPinned = !todo.isPinned;
    save();
    render();
  }
}

async function handleClearAll() {
  if (todos.length === 0) return;
  const confirmed = await showConfirm(
    "确定清空所有待办事项吗？此操作不可撤销！"
  );
  if (confirmed) {
    todos = [];
    save();
    render();
  }
}

function toggleComplete(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    save();
    render();
  }
}

/* ==================== 工具函数 ==================== */
function checkExpiredTasks() {
  const now = new Date();
  const expiredTodos = [];

  todos.forEach((todo) => {
    if (todo.deadline) {
      const deadlineDate = new Date(todo.deadline);
      const diffDays = Math.floor((now - deadlineDate) / (1000 * 60 * 60 * 24));

      if (diffDays > 3) {
        expiredTodos.push(todo.id);
      }
    }
  });

  if (expiredTodos.length > 0) {
    todos = todos.filter((todo) => !expiredTodos.includes(todo.id));
    save();
    render();
  }
}

function getExpiryStatus(deadline) {
  if (!deadline) return null;

  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isExpired: diffDays < 0,
    daysRemaining: diffDays,
    isToday: diffDays === 0,
  };
}

function updateTagFilter() {
  const tagFilter = document.getElementById("tag-filter");
  const currentValue = tagFilter.value;

  const tags = [
    ...new Set(
      todos.map((todo) => todo.tag).filter((tag) => tag && tag.trim() !== "")
    ),
  ];

  tagFilter.innerHTML = '<option value="">所有标签</option>';

  if (tags.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "暂无标签";
    option.disabled = true;
    option.selected = true;
    tagFilter.appendChild(option);
  } else {
    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      tagFilter.appendChild(option);
    });
  }

  if (currentValue) {
    tagFilter.value = currentValue;
  }
}

/**
 * 根据搜索词过滤任务
 * @param {string} searchTerm - 搜索关键词
 * @returns {Array} 过滤后的任务数组
 */
function filterTodos(searchTerm) {
  return searchTerm
    ? todos.filter((todo) => todo.text.toLowerCase().includes(searchTerm))
    : [...todos];
}

function updateSearchStatus(searchTerm, resultCount) {
  const searchStatus = document.getElementById("search-status");
  const searchContainer = document.querySelector(".search-container");

  if (!searchTerm) {
    searchStatus.textContent = "";
    searchStatus.className = "search-status";
    searchContainer.classList.remove("has-search");
    return;
  }

  searchContainer.classList.add("has-search");

  if (resultCount > 0) {
    searchStatus.textContent = `找到 ${resultCount} 个结果`;
    searchStatus.className = "search-status results-found";
  } else {
    searchStatus.textContent = "没有找到匹配项";
    searchStatus.className = "search-status no-results";
  }
}

function sortTodos(todos) {
  return todos.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    const aExpiry = a.deadline ? getExpiryStatus(a.deadline) : null;
    const bExpiry = b.deadline ? getExpiryStatus(b.deadline) : null;

    if (aExpiry && aExpiry.isExpired && bExpiry && bExpiry.isExpired) {
      return aExpiry.daysRemaining - bExpiry.daysRemaining;
    }
    if (aExpiry && aExpiry.isExpired) return -1;
    if (bExpiry && bExpiry.isExpired) return 1;

    if (aExpiry && bExpiry) {
      return aExpiry.daysRemaining - bExpiry.daysRemaining;
    }
    if (aExpiry) return -1;
    if (bExpiry) return 1;

    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

/* ==================== 渲染相关函数 ==================== */
function render() {
  const todoListContainer = document.getElementById("ToDoList");
  todoListContainer.innerHTML = "";

  const searchTerm = document
    .getElementById("search-input")
    .value.toLowerCase();
  const selectedTag = document.getElementById("tag-filter").value;

  let filteredTodos = [...todos];
  filteredTodos = filterTodos(searchTerm);

  if (selectedTag) {
    filteredTodos = filteredTodos.filter((todo) => todo.tag === selectedTag);
  }

  updateTagFilter();
  filteredTodos = sortTodos(filteredTodos);

  if (filteredTodos.length === 0) {
    const template = document.getElementById("empty-state-template");
    const clone = template.content.cloneNode(true);
    todoListContainer.appendChild(clone);
    return;
  }

  filteredTodos.forEach((todo) => {
    const todoElement = createTodoElement(todo);
    todoListContainer.appendChild(todoElement);
  });
}

function createTodoElement(todo) {
  const template = document.getElementById("todo-item-template");
  const clone = template.content.cloneNode(true);
  const item = clone.querySelector(".todo-item");

  item.dataset.id = todo.id;
  const checkbox = item.querySelector(".todo-checkbox");
  const textSpan = item.querySelector(".todo-text");
  const metaContainer = item.querySelector(".todo-meta");

  checkbox.checked = todo.completed;
  textSpan.textContent = todo.text;

  if (todo.completed) {
    textSpan.classList.add("completed");
  }

  if (todo.tag && todo.tag.trim() !== "") {
    const tagSpan = document.createElement("span");
    tagSpan.className = "tag";
    tagSpan.textContent = `#${todo.tag}`;
    metaContainer.appendChild(tagSpan);
  }

  if (todo.deadline) {
    const expiryStatus = getExpiryStatus(todo.deadline);
    const deadlineDate = new Date(todo.deadline);
    const formattedDate = deadlineDate.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const deadlineSpan = document.createElement("span");
    deadlineSpan.className = "deadline";
    deadlineSpan.textContent = `📅 ${formattedDate}`;

    if (expiryStatus) {
      if (expiryStatus.isToday) {
        deadlineSpan.classList.add("deadline-today");
        deadlineSpan.textContent += " (今天到期)";
      } else if (expiryStatus.isExpired) {
        if (expiryStatus.daysRemaining >= -3) {
          item.classList.add("expired");
          deadlineSpan.textContent += ` (已过期 ${Math.abs(
            expiryStatus.daysRemaining
          )} 天)`;
        }
      } else if (expiryStatus.daysRemaining <= 3) {
        deadlineSpan.classList.add("deadline-soon");
        deadlineSpan.textContent +=
          expiryStatus.daysRemaining === 1
            ? " (明天到期)"
            : ` (${expiryStatus.daysRemaining} 天后到期)`;
      }
    }

    metaContainer.appendChild(deadlineSpan);
  }

  item
    .querySelector(".delete-btn")
    .addEventListener("click", () => deleteTodo(todo.id));
  item
    .querySelector(".edit-btn")
    .addEventListener("click", () => editTodo(todo.id));
  item
    .querySelector(".pin-btn")
    .addEventListener("click", () => togglePin(todo.id));
  checkbox.addEventListener("change", () => toggleComplete(todo.id));

  if (todo.isPinned) {
    item.classList.add("pinned");
    item.querySelector(".pin-btn").classList.add("pinned");
  }

  return clone;
}

/* ==================== 数据持久化 ==================== */
function save() {
  localStorage.setItem("todos", JSON.stringify(todos));
}
