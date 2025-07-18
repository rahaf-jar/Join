/**
 * Creates a new task based on form input and stores it in Firebase.
 */
async function createTask() {
    if (!validateForm()) return;
    let task = buildTaskObject();
    await saveTaskToFirebase(task);
    closeAddTaskOverlay();
    showTaskAddedOverlay();
    await reloadAndHighlightNewTask();
}

/**
 * Builds and returns a task object from current form input values.
 * @returns {Object} The task object.
 */
function buildTaskObject() {
    return {
        title: getInputValue("title"),
        description: getInputValue("description"),
        dueDate: getInputValue("dueDate"),
        priority: selectedPriority,
        assignedTo: selectedContacts.map((c) => c.name),
        category: selectedCategory,
        subtask: subtasks.map(st => ({ title: st, completed: false })),
        createdAt: new Date().toISOString(),
        status: addTaskDefaultStatus,
    };
}

/**
 * Opens the add task overlay and sets a default status.
 * @param {string} status - The status to assign the new task.
 */
function openAddTaskForStatus(status) {
    addTaskDefaultStatus = status;
    openAddTaskOverlay();
}

/**
 * Opens and initializes the add task overlay modal.
 */
function openAddTaskOverlay() {
    showAddTaskOverlay();
    renderAddTaskModal();
    addAddTaskOverlayEventListeners();
    initAddTaskOverlayLogic();
}

/**
 * Shows the add task overlay and disables background scrolling.
 */
function showAddTaskOverlay() {
    let overlay = document.getElementById("add_task_overlay");
    overlay.classList.remove("d-none");
    document.getElementById("html").style.overflow = "hidden";
}

/**
 * Renders the content of the add task modal and initializes the animation.
 */
function renderAddTaskModal() {
    let overlay = document.getElementById("add_task_overlay");
    overlay.innerHTML = getAddTaskOverlay();
    updateHTML();
    setTimeout(() => {
        let modal = document.querySelector('.board-add-task-modal');
        if (modal) modal.classList.add('open');
    }, 10);
}

/**
 * Adds event listeners to handle clicks outside the add task overlay/modal.
 */
function addAddTaskOverlayEventListeners() {
    setTimeout(() => {
        document.addEventListener('mousedown', handleAddTaskOverlayClickOutside);
    }, 0);
}

/**
 * Closes the add task overlay. Handles animation if modal is open.
 */
function closeAddTaskOverlay() {
    let modal = document.querySelector('.board-add-task-modal');
    if (modal) {
        closeAddTaskModalWithAnimation();
    } else {
        hideAndResetAddTaskOverlay();
    }
    resetAddTaskDefaultStatus();
    removeAddTaskOverlayEventListener();
}

/**
 * Closes the add task modal with animation and then hides and resets overlay.
 */
function closeAddTaskModalWithAnimation() {
    let modal = document.querySelector('.board-add-task-modal');
    modal.classList.remove('open');
    setTimeout(hideAndResetAddTaskOverlay, 400);
}

/**
 * Hides and resets the add task overlay content and restores scroll.
 */
function hideAndResetAddTaskOverlay() {
    let overlay = document.getElementById("add_task_overlay");
    if (overlay) {
        overlay.classList.add("d-none");
        document.getElementById("html").style.overflow = "";
        overlay.innerHTML = "";
    }
}

/**
 * Resets the default status for new tasks to 'todo'.
 */
function resetAddTaskDefaultStatus() {
    addTaskDefaultStatus = "todo";
}

/**
 * Removes the add task overlay's outside click event listener.
 */
function removeAddTaskOverlayEventListener() {
    document.removeEventListener('mousedown', handleAddTaskOverlayClickOutside);
}

/**
 * Handles click outside of the add task modal and closes the overlay.
 * @param {Event} event - The mousedown event.
 */
function handleAddTaskOverlayClickOutside(event) {
    let modal = document.querySelector('.board-add-task-modal');
    if (!modal) return;
    if (
        !modal.contains(event.target) &&
        !event.target.closest('.flatpickr-calendar')
    ) {
        closeAddTaskOverlay();
    }
}

/**
 * Toggles error styling and visibility for a form field.
 * @param {HTMLElement} inputEl - The input element to style.
 * @param {string} errorElId - The ID of the error message element.
 * @param {boolean} isValid - Whether the field is valid.
 * @param {string} [errorClass='error-border'] - CSS class for error border.
 * @param {string} [errorVisibleClass='visible'] - CSS class for error message visibility.
 */
function showFieldError(inputEl, errorElId, isValid, errorClass = 'error-border', errorVisibleClass = 'visible') {
    let errorEl = document.getElementById(errorElId);
    if (inputEl) inputEl.classList.toggle(errorClass, !isValid);
    if (errorEl) errorEl.classList.toggle(errorVisibleClass, !isValid);
}

/**
 * Validates all main form fields: title, due date, and category.
 * @returns {boolean} True if valid, false otherwise.
 */
function validateForm() {
    let titleEl = document.getElementById("title");
    let dueDateEl = document.getElementById("dueDate");
    let categoryToggle = document.getElementById("category-toggle");

    let titleValid = isInputFilled(titleEl);
    let dueDateValid = isInputFilled(dueDateEl);
    let categoryValid = isCategorySelected();

    showFieldError(titleEl, "error-title", titleValid, "error", "visible");
    showFieldError(dueDateEl, "error-dueDate", dueDateValid, "error-border", "visible");
    showFieldError(categoryToggle, "error-category", categoryValid, "error-border", "visible");

    return titleValid && dueDateValid && categoryValid;
}

/**
 * Resets all main form fields and UI state.
 */
function resetForm() {
    resetTitle();
    resetDescription();
    resetDueDate();
    resetPriority();
    resetContacts();
    resetCategory();
    resetSubtasks();
}

/**
 * Enables or disables the submit button based on form state.
 */
function updateSubmitState() {
    let button = document.getElementById("submit-task-btn");
    if (button) button.disabled = false;
}

/**
 * Resets the title input field.
 */
function resetTitle() {
    let title = document.getElementById("title");
    if (title) title.value = "";
}

/**
 * Resets the description input field.
 */
function resetDescription() {
    let description = document.getElementById("description");
    if (description) description.value = "";
}

/**
 * Resets the due date input field.
 */
function resetDueDate() {
    let dueDate = document.getElementById("dueDate");
    if (dueDate) dueDate.value = "";
}

/**
 * Resets the priority selection to the default value.
 */
function resetPriority() {
    selectedPriority = "medium";
    selectPriority("medium");
}

/**
 * Clears all selected contacts and updates the UI.
 */
function resetContacts() {
    selectedContacts = [];
    updateSelectedContactsUI();
}

/**
 * Clears the selected category and resets UI.
 */
function resetCategory() {
    selectedCategory = "";
    let categoryPlaceholder = document.querySelector("#category-toggle span");
    if (categoryPlaceholder) categoryPlaceholder.textContent = "Select category";
}

/**
 * Sets up date input validation, ensures only today or future dates are selectable.
 */
function setupDateValidation() {
    setTimeout(() => {
        let dateInput = document.getElementById("dueDate");
        let errorText = document.getElementById("error-dueDate");
        if (!dateInput || !errorText) return;
        setMinDateToday(dateInput);
        addDateInputListener(dateInput, errorText);
    }, 100);
}

/**
 * Shows the "task added" overlay for a short duration.
 */
function showTaskAddedOverlay() {
    let overlay = document.getElementById("task-added-overlay");
    if (!overlay) return;
    overlay.style.display = "flex";
    overlay.classList.add("show");
    setTimeout(() => {
        overlay.classList.remove("show");
        setTimeout(() => {
            overlay.style.display = "none";
        }, 200);
    }, 2500);
}

/**
 * Updates the category UI to display the selected category icon.
 */
function updateCategoryUI() {
    let box = document.getElementById("selected-category");
    if (!box) return;
    clearCategoryBox(box);
    if (selectedCategory) {
        let icon = createCategoryIcon(selectedCategory);
        box.appendChild(icon);
    }
}

/**
 * Sets up all event listeners for the add task form, including dropdowns, category, and subtask input.
 */
function setupEventListeners() {
    setupDropdownListeners();
    setupCategoryListeners();
    setupSubtaskInputListeners();
}

/**
 * Initializes the logic for the add task overlay: loads contacts, sets up listeners, validates date, and resets form.
 */
function initAddTaskOverlayLogic() {
    fetchContacts();
    setupEventListeners();
    setupDateValidation();
    resetForm();
}

/**
 * Reloads the tasks from Firebase and highlights the most recently created task.
 * @returns {Promise<void>}
 */
async function reloadAndHighlightNewTask() {
    await loadTasks();
    setTimeout(() => {
        highlightLastCreatedTask();
    }, 100);
}

/**
 * Highlights the most recently created task on the board for a short duration.
 */
function highlightLastCreatedTask() {
    let lastTask = arrayTasks[arrayTasks.length - 1];
    if (lastTask && lastTask.firebaseKey) {
        lastCreatedTaskKey = lastTask.firebaseKey;
        updateHTML();
        setTimeout(() => {
            let newTaskEl = document.getElementById(lastCreatedTaskKey);
            if (newTaskEl) {
                newTaskEl.classList.remove("task-blink");
            }
            lastCreatedTaskKey = null;
        }, 2000);
    }
}

/**
 * Handles Add Task button click for mobile and desktop views.
 */
document.addEventListener('DOMContentLoaded', function () {
    const addTaskBtn = document.getElementById('add-task-btn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (window.innerWidth <= 1040) {
                window.location.href = 'add-task.html';
            } else {
                if (typeof openAddTaskOverlay === 'function') {
                    openAddTaskOverlay();
                }
            }
        });
    }
});

/**
 * Adds click listeners to all board plus buttons for task creation.
 */
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.board-plus-btn').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const status = btn.getAttribute('data-status') || 'todo';
            if (window.innerWidth <= 1040) {
                window.location.href = `add-task.html?status=${encodeURIComponent(status)}`;
            } else {
                if (typeof openAddTaskForStatus === 'function') {
                    openAddTaskForStatus(status);
                }
            }
        });
    });
});


/**
 * Injects the Add Task overlay HTML into the overlay container.
 */
let overlay = document.getElementById("add_task_overlay");
overlay.innerHTML = getAddTaskOverlay();

/**
 * Renders the Add Task overlay, then initializes Flatpickr for the due date input.
 * This ensures Flatpickr is always attached to the dynamically generated input field.
 */
function openAddTaskOverlay() {
    showAddTaskOverlay();
    renderAddTaskModal();
    flatpickr("#dueDate", {
        dateFormat: "d/m/Y",
        minDate: "today",
        locale: "en"
    });
    addAddTaskOverlayEventListeners();
    initAddTaskOverlayLogic();
}