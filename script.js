// State Initialization from LocalStorage
let tasks = JSON.parse(localStorage.getItem('dh_tasks')) || [];
let stats = JSON.parse(localStorage.getItem('dh_stats')) || {
  xp: 0,
  streak: 0,
  lastCompletedDate: null
};

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const xpDisplay = document.getElementById('xp-display');
const streakDisplay = document.getElementById('streak-display');

// Set default date input to today
document.getElementById('task-deadline').valueAsDate = new Date();

// Save state to LocalStorage
function saveState() {
  localStorage.setItem('dh_tasks', JSON.stringify(tasks));
  localStorage.setItem('dh_stats', JSON.stringify(stats));
}

// Calculate days remaining & urgency level
function getUrgencyDetails(deadlineStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [year, month, day] = deadlineStr.split('-');
  const dueDate = new Date(year, month - 1, day);
  
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'urgent', label: `Overdue by ${Math.abs(diffDays)} day(s)!` };
  } else if (diffDays === 0) {
    return { status: 'urgent', label: 'Due TODAY!' };
  } else if (diffDays <= 2) {
    return { status: 'warning', label: `Due in ${diffDays} day(s)` };
  } else {
    return { status: 'safe', label: `Due in ${diffDays} days` };
  }
}

// Render XP & Streak Stats
function renderStats() {
  xpDisplay.textContent = stats.xp;
  streakDisplay.textContent = `${stats.streak} 🔥`; }  // Render Task Cards function renderTasks() { taskList.innerHTML = '';  if (tasks.length === 0) { emptyState.style.display = 'block'; return; } emptyState.style.display = 'none';  // Sort tasks by earliest deadline first tasks.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));  tasks.forEach(task => { const urgency = getUrgencyDetails(task.deadline);  const card = document.createElement('div'); card.className = `task-card ${urgency.status}`;
    card.innerHTML = `
      <div>
        <span class="subject-tag">${escapeHTML(task.subject)}</span>
        <h3 class="task-title">${escapeHTML(task.title)}</h3>
        <p class="deadline-text">📅 ${task.deadline} • <strong>${urgency.label}</strong></p>
      </div>
      <div class="card-actions">
        <button class="btn-done" onclick="completeTask(${task.id})">✓ Complete (+50 XP)</button>
        <button class="btn-delete" onclick="deleteTask(${task.id})" title="Delete">✕</button>
      </div>
    `;
    taskList.appendChild(card);
  });
}

// Add New Task
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const titleInput = document.getElementById('task-title');
  const subjectInput = document.getElementById('task-subject');
  const deadlineInput = document.getElementById('task-deadline');

  const newTask = {
    id: Date.now(),
    title: titleInput.value.trim(),
    subject: subjectInput.value.trim(),
    deadline: deadlineInput.value
  };

  tasks.push(newTask);
  saveState();
  renderTasks();

  titleInput.value = '';
  subjectInput.value = '';
});

// Complete Task & Award XP/Streak
window.completeTask = function(id) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Award XP
  stats.xp += 50;

  // Update Daily Streak
  if (stats.lastCompletedDate !== todayStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (stats.lastCompletedDate === yesterdayStr) {
      stats.streak += 1;
    } else {
      stats.streak = 1;
    }
    stats.lastCompletedDate = todayStr;
  }

  tasks = tasks.filter(task => task.id !== id);
  saveState();
  renderStats();
  renderTasks();
};

// Delete Task without XP
window.deleteTask = function(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveState();
  renderTasks();
};

// Prevent XSS injection from user inputs
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag]));
}

// Initial Render
renderStats();
renderTasks();
