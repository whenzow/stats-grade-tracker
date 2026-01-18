// Application State
let appState = {
    courses: {}, // Object to store multiple courses: { courseId: courseData }
    currentCourseId: null, // ID of currently active course
    nextCourseId: 1, // Counter for generating unique course IDs
    semesters: {}, // Object to store semesters: { semesterId: { name, courses: [courseIds], totalUnits } }
    nextSemesterId: 1, // Counter for generating unique semester IDs
    semesterOrder: [], // Array to store semester IDs in display order
    quickCourses: {} // Object to store quick courses (final grade only): { courseId: { name, units, finalGrade, collegeGrade } }
};

// Helper function to get current course data
function getCurrentCourse() {
    if (!appState.currentCourseId || !appState.courses[appState.currentCourseId]) {
        // Create default course if none exists
        if (Object.keys(appState.courses).length === 0) {
            createNewCourse('Course 1');
        }
    }
    return appState.courses[appState.currentCourseId];
}

// Helper function to set current course data
function setCurrentCourse(data) {
    if (appState.currentCourseId) {
        appState.courses[appState.currentCourseId] = data;
        saveToStorage();
    }
}

// Create a new course
function createNewCourse(name) {
    const courseId = `course_${appState.nextCourseId++}`;
    appState.courses[courseId] = {
        id: courseId,
        name: name,
        units: 3,
    criteria: [],
    gradeScale: [],
    componentScores: {},
    examScores: {},
    finalExam: { score: 0, total: 100, include: true },
    settings: {
        hasFinal: true,
        hasExemption: false,
        passingExamPercent: 60,
        minExamsPassed: 2,
        minPrefinalPercent: 72,
        finalWeight: 20
    },
    results: null
};
    appState.currentCourseId = courseId;
    return courseId;
}

// Delete a course
function deleteCourse(courseId) {
    if (Object.keys(appState.courses).length <= 1) {
        alert('Cannot delete the last course. Please create another course first.');
        return false;
    }
    
    delete appState.courses[courseId];
    
    // If deleted course was current, switch to first available
    if (appState.currentCourseId === courseId) {
        const remainingCourses = Object.keys(appState.courses);
        if (remainingCourses.length > 0) {
            appState.currentCourseId = remainingCourses[0];
        } else {
            appState.currentCourseId = null;
        }
    }
    
    return true;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    initializeTheme();
    initializeMobileMenu();
});

function initializeApp() {
    // Tab navigation
    setupTabNavigation();
    
    // Setup course management
    setupCourseManagement();
    
    // Initialize selected course for management
    window.selectedCourseForManagement = null;
    
    // Setup criteria handlers
    setupCriteriaHandlers();
    
    // Setup grade scale handlers
    setupGradeScaleHandlers();
    
    // Setup score entry handlers
    setupScoreEntryHandlers();
    
    // Setup calculate button
    document.getElementById('calculate-final').addEventListener('click', calculateFinalGrade);
    
    // Setup What If Calculator
    setupWhatIfCalculator();
    
    // Setup save/load handlers
    setupSaveLoadHandlers();
    
    // Load from localStorage if available
    loadFromStorage();
    
    // Initialize course selector and dashboard
    updateCourseSelector();
    updateDashboard();
}

// Course Management Setup
function setupCourseManagement() {
    // Course units change
    const unitsInput = document.getElementById('course-units');
    if (unitsInput) {
        unitsInput.addEventListener('change', function() {
            if (!appState.currentCourseId) return;
            const course = getCurrentCourse();
            let units = parseFloat(this.value);
            if (isNaN(units) || units <= 0) {
                // Revert to previous value or default
                units = course.units || 3;
                this.value = units;
                return;
            }
            course.units = units;
            setCurrentCourse(course);
            updateDashboard();
        });
    }
    
    // Course selector change (sync with dashboard)
    const sidebarSelector = document.getElementById('course-selector');
    if (sidebarSelector) {
        sidebarSelector.addEventListener('change', function() {
            const courseId = this.value;
            if (courseId && appState.courses[courseId]) {
                appState.currentCourseId = courseId;
                window.selectedCourseForManagement = courseId;
                
                // Update visual selection
                document.querySelectorAll('.course-card').forEach(card => {
                    card.classList.remove('selected-for-management');
                });
                const selectedCard = document.querySelector(`[data-course-id="${courseId}"]`);
                if (selectedCard) {
                    selectedCard.classList.add('selected-for-management');
                }
                
                updateAllDisplays();
                updateCourseManagementButtons();
            }
        });
    }
}

// Update course selector dropdown (sidebar)
function updateCourseSelector() {
    const sidebarSelector = document.getElementById('course-selector');
    
    const courseIds = Object.keys(appState.courses);
    const optionsHtml = courseIds.length === 0 
        ? '<option value="">No courses</option>'
        : courseIds.map(courseId => {
            const course = appState.courses[courseId];
            const selected = courseId === appState.currentCourseId ? 'selected' : '';
            return `<option value="${courseId}" ${selected}>${course.name}</option>`;
        }).join('');
    
    if (sidebarSelector) {
        sidebarSelector.innerHTML = optionsHtml;
    }
}

// Update all displays when switching courses
function updateAllDisplays() {
    const course = getCurrentCourse();
    
    // Update form inputs
    if (course && course.settings) {
        document.getElementById('has-final').checked = course.settings.hasFinal;
        document.getElementById('has-exemption').checked = course.settings.hasExemption;
        document.getElementById('passing-exam-percent').value = course.settings.passingExamPercent || 60;
        document.getElementById('min-exams-passed').value = course.settings.minExamsPassed || 2;
        document.getElementById('min-prefinal-percent').value = course.settings.minPrefinalPercent || 72;
        document.getElementById('final-weight').value = course.settings.finalWeight || 20;
        
        document.getElementById('has-exemption-label').style.display = course.settings.hasFinal ? 'block' : 'none';
        document.getElementById('exemption-settings').style.display = course.settings.hasExemption ? 'block' : 'none';

        const unitsInput = document.getElementById('course-units');
        if (unitsInput) {
            unitsInput.value = course.units || 3;
        }
    }
    
    updateCriteriaDisplay();
    updateGradeScaleDisplay();
    updateScoreInputs();
    if (course.results) {
        displayResults();
    }
    
    // Update What If Calculator if tab is active
    const whatIfTab = document.getElementById('whatif-tab');
    if (whatIfTab && whatIfTab.classList.contains('active')) {
        updateWhatIfCalculator();
    }
}

// Update Dashboard
function updateDashboard() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;
    
    const courseIds = Object.keys(appState.courses);
    const quickCourseIds = Object.keys(appState.quickCourses || {});
    
    // Initialize semesterOrder if it doesn't exist or is invalid
    if (!appState.semesterOrder || !Array.isArray(appState.semesterOrder)) {
        appState.semesterOrder = Object.keys(appState.semesters || {});
    }
    
    // Ensure all existing semesters are in the order array
    const allSemesterIds = Object.keys(appState.semesters || {});
    allSemesterIds.forEach(id => {
        if (!appState.semesterOrder.includes(id)) {
            appState.semesterOrder.push(id);
        }
    });
    
    // Remove any IDs from order that no longer exist
    appState.semesterOrder = appState.semesterOrder.filter(id => allSemesterIds.includes(id));
    
    // Use the ordered array for display
    const semesterIds = appState.semesterOrder;
    
    // Get all assigned course IDs
    const assignedCourseIds = new Set();
    Object.values(appState.semesters || {}).forEach(semester => {
        semester.courses.forEach(courseId => assignedCourseIds.add(courseId));
    });
    
    // Get unassigned courses
    const unassignedCourses = courseIds.filter(id => !assignedCourseIds.has(id));
    const unassignedQuickCourses = quickCourseIds.filter(id => !assignedCourseIds.has(id));
    
    let html = '<div class="dashboard-summary">';
    
    // Calculate overall GWA (will be completed after processing semesters and unassigned courses)
    // Initialize variables for overall GWA calculation
    let totalWeightedGrades = 0;
    let totalUnits = 0;
    
    // Semester Management Section (TOP)
    html += `
        <div class="box" style="margin-bottom: 20px;">
            <div class="box-header">
                <h3><i class="fas fa-calendar-alt"></i> Semester Management</h3>
            </div>
            <div class="box-body">
                <div class="form-row" style="margin-bottom: 15px;">
                    <div class="form-group">
                        <label for="semester-name">Semester Name:</label>
                        <input type="text" id="semester-name" placeholder="e.g., 1st Semester AY 2024-2025" class="form-control">
                    </div>
                    <div class="form-group" style="display: flex; align-items: flex-end;">
                        <button id="add-semester" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Add Semester
                        </button>
                    </div>
                </div>
                <div id="semesters-list" class="semesters-grid"></div>
            </div>
        </div>
    `;
    
    // Helper function to calculate course grade value (define early)
    function getCourseGradeValue(course, isQuick) {
        if (isQuick && course.collegeGrade) {
            return parseFloat(course.collegeGrade);
        } else if (!isQuick && course.results) {
            const percentage = course.results.finalGrade;
            if (course.gradeScale.length > 0) {
                const collegeGrade = getCollegeGradeForCourse(course, percentage);
                return parseFloat(collegeGrade);
            }
        }
        return null;
    }
    
    // Course Management Section (BELOW SEMESTERS) - Two Columns
    // Build unassigned courses HTML first
    let unassignedCoursesHtml = '';
    
    if (unassignedCourses.length > 0 || unassignedQuickCourses.length > 0) {
        unassignedCoursesHtml += `
            <div style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid var(--border-light);">
                <p style="margin-bottom: 15px; color: var(--text-secondary); font-size: 14px;">
                    Drag courses into semesters above, or click to select for editing.
                </p>
                <div class="courses-grid" id="unassigned-courses-grid">
        `;
        
        // Add unassigned regular courses
        unassignedCourses.forEach(courseId => {
            const course = appState.courses[courseId];
            const isActive = courseId === appState.currentCourseId;
            let percentage = null;
            let collegeGrade = null;
            
            if (course.results) {
                percentage = course.results.finalGrade;
                if (course.gradeScale.length > 0) {
                    collegeGrade = getCollegeGradeForCourse(course, percentage);
                }
            }
            
            unassignedCoursesHtml += `
                <div class="course-card draggable-course ${isActive ? 'active' : ''}" 
                     draggable="true" 
                     ondragstart="dragCourse(event, '${courseId}', false)"
                     ondragend="handleDragEnd(event)"
                     data-course-id="${courseId}"
                     onclick="event.stopPropagation(); selectCourseForManagement('${courseId}')">
                    <div class="course-card-header">
                        <div class="course-card-name">${course.name}</div>
                        ${isActive ? '<span style="color: var(--border-color);"><i class="fas fa-check-circle"></i></span>' : ''}
                    </div>
                    <div class="course-card-stats">
                        <div class="course-stat">
                            <div class="course-stat-label">Final Grade</div>
                            <div class="course-stat-value">${percentage !== null ? percentage.toFixed(2) + '%' : 'N/A'}</div>
                        </div>
                        <div class="course-stat">
                            <div class="course-stat-label">College Grade</div>
                            <div class="course-stat-value">${collegeGrade || 'N/A'}</div>
                        </div>
                        <div class="course-stat">
                            <div class="course-stat-label">Units</div>
                            <div class="course-stat-value">${typeof course.units === 'number' ? course.units : 'N/A'}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Add unassigned quick courses
        unassignedQuickCourses.forEach(quickCourseId => {
            const quickCourse = appState.quickCourses[quickCourseId];
            unassignedCoursesHtml += `
                <div class="course-card draggable-course quick-course" 
                     draggable="true" 
                     ondragstart="dragCourse(event, '${quickCourseId}', true)"
                     ondragend="handleDragEnd(event)"
                     data-course-id="${quickCourseId}">
                    <div class="course-card-header">
                        <div class="course-card-name">
                            ${quickCourse.name}
                            <span class="quick-badge">Quick</span>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteQuickCourse('${quickCourseId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="course-card-stats">
                        <div class="course-stat">
                            <div class="course-stat-label">College Grade</div>
                            <div class="course-stat-value">${quickCourse.collegeGrade || 'N/A'}</div>
                        </div>
                        <div class="course-stat">
                            <div class="course-stat-label">Units</div>
                            <div class="course-stat-value">${typeof quickCourse.units === 'number' ? quickCourse.units : 'N/A'}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (unassignedCourses.length === 0 && unassignedQuickCourses.length === 0) {
            unassignedCoursesHtml += '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">All courses are assigned to semesters.</p>';
        }
        
        unassignedCoursesHtml += `
                </div>
            </div>
        `;
    }
    
    html += `
        <div class="box" style="margin-bottom: 20px;">
            <div class="box-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3><i class="fas fa-book"></i> Course Management</h3>
                <div id="course-management-actions" style="display: flex; gap: 10px;">
                    <button id="rename-course-btn-dashboard" class="btn btn-info btn-sm" style="display: none;">
                        <i class="fas fa-edit"></i> Rename Selected
                    </button>
                    <button id="delete-course-btn-dashboard" class="btn btn-danger btn-sm" style="display: none;">
                        <i class="fas fa-trash"></i> Delete Selected
                    </button>
                </div>
            </div>
            <div class="box-body">
                ${unassignedCoursesHtml}
                <div class="course-management-grid">
                    <!-- Left Column: Manual Course Entry -->
                    <div class="course-entry-column">
                        <h4 style="margin-bottom: 15px; color: var(--text-primary);">
                            <i class="fas fa-edit"></i> Manual Course Entry
                        </h4>
                        <div class="form-row" style="margin-bottom: 15px;">
                            <div class="form-group" style="flex: 1;">
                                <label for="new-course-name">Course Name:</label>
                                <input type="text" id="new-course-name" placeholder="e.g., MATH 27" class="form-control">
                            </div>
                        </div>
                        <div class="form-row" style="margin-bottom: 15px;">
                            <div class="form-group" style="flex: 1;">
                                <label for="new-course-units">Units:</label>
                                <input type="number" id="new-course-units" min="1" value="3" class="form-control">
                            </div>
                        </div>
                        <div class="form-row" style="margin-bottom: 15px;">
                            <button id="add-course-btn-dashboard" class="btn btn-success" style="width: 100%;">
                                <i class="fas fa-plus"></i> Add Course
                            </button>
                        </div>
                    </div>
                    
                    <!-- Right Column: Quick Course Entry -->
                    <div class="course-entry-column">
                        <h4 style="margin-bottom: 15px; color: var(--text-primary);">
                            <i class="fas fa-bolt"></i> Quick Course Entry
                        </h4>
                        <p style="margin-bottom: 15px; color: var(--text-secondary); font-size: 14px;">
                            Add a course with just its final grade (non-editable) for quick GWA calculation.
                        </p>
                        <div class="form-row" style="margin-bottom: 15px;">
                            <div class="form-group" style="flex: 1;">
                                <label for="quick-course-name">Course Name:</label>
                                <input type="text" id="quick-course-name" placeholder="e.g., Math 101" class="form-control">
                            </div>
                        </div>
                        <div class="form-row" style="margin-bottom: 15px;">
                            <div class="form-group" style="flex: 1;">
                                <label for="quick-course-units">Units:</label>
                                <input type="number" id="quick-course-units" min="1" value="3" class="form-control">
                            </div>
                        </div>
                        <div class="form-row" style="margin-bottom: 15px;">
                            <div class="form-group" style="flex: 1;">
                                <label for="quick-course-grade">Final College Grade:</label>
                                <input type="text" id="quick-course-grade" placeholder="e.g., 1.25" class="form-control">
                            </div>
                        </div>
                        <div class="form-row">
                            <button id="add-quick-course" class="btn btn-success" style="width: 100%;">
                                <i class="fas fa-plus"></i> Add Quick Course
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Store semester HTML to insert into semester management section
    let semestersHtml = '';
    
    // Display semesters with drag-and-drop
    if (semesterIds.length > 0) {
        semesterIds.forEach(semesterId => {
            const semester = appState.semesters[semesterId];
            let semesterWeightedGrades = 0;
            let semesterUnits = 0;
            
            // Calculate semester GWA
            semester.courses.forEach(courseId => {
                let course = appState.courses[courseId];
                let isQuick = false;
                
                if (!course) {
                    course = appState.quickCourses[courseId];
                    isQuick = true;
                }
                
                if (course) {
                    const units = typeof course.units === 'number' && course.units > 0 ? course.units : 0;
                    const gradeValue = getCourseGradeValue(course, isQuick);
                    
                    if (!isNaN(gradeValue) && gradeValue <= 5.0 && units > 0) {
                        semesterWeightedGrades += gradeValue * units;
                        semesterUnits += units;
                        totalWeightedGrades += gradeValue * units;
                        totalUnits += units;
                    }
                }
            });
            
            const semesterGWA = semesterUnits > 0 ? (semesterWeightedGrades / semesterUnits).toFixed(2) : null;
            
            semestersHtml += `
                <div class="semester-card draggable-semester" 
                     data-semester-id="${semesterId}"
                     draggable="true"
                     ondragstart="dragSemester(event, '${semesterId}')"
                     ondragend="handleSemesterDragEnd(event)"
                     ondrop="dropSemester(event)"
                     ondragover="allowSemesterDrop(event)"
                     ondragenter="handleSemesterDragEnter(event)"
                     ondragleave="handleSemesterDragLeave(event)">
                    <button class="semester-delete-x" onclick="event.stopPropagation(); deleteSemester('${semesterId}')" title="Delete Semester">
                        <i class="fas fa-times"></i>
                    </button>
                    <div class="semester-card-header">
                        <h4 style="flex: 1; display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-grip-vertical semester-drag-handle" style="font-size: 14px; color: var(--text-secondary); cursor: grab;"></i>
                            <span onclick="toggleSemesterDetails('${semesterId}')" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex: 1;">
                                <i class="fas fa-chevron-right semester-toggle-icon" id="toggle-icon-${semesterId}"></i>
                                ${semester.name}
                            </span>
                        </h4>
                    </div>
                    <div class="semester-card-body">
                        <div class="semester-stat">
                            <span class="semester-stat-label">GWA:</span>
                            <span class="semester-stat-value">${semesterGWA || 'N/A'}</span>
                        </div>
                        <div class="semester-stat">
                            <span class="semester-stat-label">Units:</span>
                            <span class="semester-stat-value">${semesterUnits}</span>
                        </div>
                        <div class="semester-stat">
                            <span class="semester-stat-label">Courses:</span>
                            <span class="semester-stat-value">${semester.courses.length}</span>
                        </div>
                    </div>
                    <div class="semester-drop-zone" 
                         data-semester-id="${semesterId}" 
                         ondrop="dropCourse(event, '${semesterId}')" 
                         ondragover="allowDrop(event)"
                         ondragenter="handleDragEnter(event)"
                         ondragleave="handleDragLeave(event)"
                         onclick="event.stopPropagation();">
                        <p class="drop-zone-text">Drop courses here</p>
                        <div class="semester-courses-list" id="semester-courses-${semesterId}"></div>
                    </div>
                </div>
            `;
        });
    }
    
    // Insert semesters into the semester management section
    html = html.replace('<div id="semesters-list" class="semesters-grid"></div>', 
        `<div id="semesters-list" class="semesters-grid" 
              ondrop="dropSemester(event)" 
              ondragover="allowSemesterDrop(event)"
              ondragenter="handleSemesterDragEnter(event)"
              ondragleave="handleSemesterDragLeave(event)">${semestersHtml}</div>`);
    
    // Calculate overall GWA (including unassigned courses)
    courseIds.forEach(courseId => {
        if (!assignedCourseIds.has(courseId)) {
            const course = appState.courses[courseId];
            const units = typeof course.units === 'number' && course.units > 0 ? course.units : 0;
            const gradeValue = getCourseGradeValue(course, false);
            
            if (!isNaN(gradeValue) && gradeValue <= 5.0 && units > 0) {
                totalWeightedGrades += gradeValue * units;
                totalUnits += units;
            }
        }
    });
    
    quickCourseIds.forEach(quickCourseId => {
        if (!assignedCourseIds.has(quickCourseId)) {
            const quickCourse = appState.quickCourses[quickCourseId];
            const units = typeof quickCourse.units === 'number' && quickCourse.units > 0 ? quickCourse.units : 0;
            const gradeValue = parseFloat(quickCourse.collegeGrade);
            
            if (!isNaN(gradeValue) && gradeValue <= 5.0 && units > 0) {
                totalWeightedGrades += gradeValue * units;
                totalUnits += units;
            }
        }
    });
    
    const overallGWA = totalUnits > 0 ? (totalWeightedGrades / totalUnits).toFixed(2) : null;
    
    // Display overall GWA at the top
    let overallGWAHtml = '';
    if (overallGWA !== null) {
        overallGWAHtml = `
            <div class="semester-summary-box" style="margin-bottom: 20px;">
                <h3><i class="fas fa-graduation-cap"></i> Overall GWA</h3>
                <div class="semester-gpa-value">${overallGWA}</div>
                <p>Based on total of ${totalUnits} unit${totalUnits !== 1 ? 's' : ''} (${courseIds.length} regular course${courseIds.length !== 1 ? 's' : ''}, ${quickCourseIds.length} quick course${quickCourseIds.length !== 1 ? 's' : ''})</p>
            </div>
        `;
    }
    
    // Insert Overall GWA at the top of the dashboard
    html = html.replace('<div class="dashboard-summary">', `<div class="dashboard-summary">${overallGWAHtml}`);
    
    html += '</div>';
    container.innerHTML = html;
    
    
    // Populate semester course lists
    semesterIds.forEach(semesterId => {
        const semester = appState.semesters[semesterId];
        const semesterCoursesContainer = document.getElementById(`semester-courses-${semesterId}`);
        if (semesterCoursesContainer) {
            semesterCoursesContainer.innerHTML = '';
            semester.courses.forEach(courseId => {
                let course = appState.courses[courseId];
                let isQuick = false;
                
                if (!course) {
                    course = appState.quickCourses[courseId];
                    isQuick = true;
                }
                
                if (course) {
                    const courseElement = document.createElement('div');
                    courseElement.className = 'semester-course-item';
                    courseElement.innerHTML = `
                        <span>${course.name}${isQuick ? ' <span class="quick-badge">Quick</span>' : ''}</span>
                        <button class="btn btn-sm btn-danger" onclick="removeCourseFromSemester('${semesterId}', '${courseId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    semesterCoursesContainer.appendChild(courseElement);
                }
            });
        }
    });
    
    // Setup event listeners
    setupDashboardHandlers();
}

// Switch to a course
function switchToCourse(courseId) {
    if (appState.courses[courseId]) {
        appState.currentCourseId = courseId;
        const sidebarSelector = document.getElementById('course-selector');
        if (sidebarSelector) sidebarSelector.value = courseId;
        updateAllDisplays();
        updateDashboard();
        // Switch to setup tab
        document.querySelector('.menu-item[data-tab="setup"]').click();
    }
}

// Setup Dashboard Handlers
function setupDashboardHandlers() {
    // Add course from dashboard
    const addCourseBtn = document.getElementById('add-course-btn-dashboard');
    if (addCourseBtn) {
        addCourseBtn.addEventListener('click', function() {
            const name = document.getElementById('new-course-name').value.trim();
            const units = parseFloat(document.getElementById('new-course-units').value);
            
            if (!name) {
                alert('Please enter a course name');
                return;
            }
            
            if (!units || units <= 0) {
                alert('Please enter a valid number of units');
                return;
            }
            
            const courseId = createNewCourse(name);
            const course = appState.courses[courseId];
            course.units = units;
            setCurrentCourse(course);
            
            // Clear inputs
            document.getElementById('new-course-name').value = '';
            document.getElementById('new-course-units').value = '3';
            
            updateCourseSelector();
            updateDashboard();
            updateAllDisplays();
            
            // Select the newly created course
            window.selectedCourseForManagement = courseId;
            updateCourseManagementButtons();
        });
    }
    
    // Rename course from dashboard
    const renameCourseBtn = document.getElementById('rename-course-btn-dashboard');
    if (renameCourseBtn) {
        renameCourseBtn.addEventListener('click', function() {
            const selectedCourseId = window.selectedCourseForManagement;
            if (!selectedCourseId || !appState.courses[selectedCourseId]) {
                alert('Please select a course first');
                return;
            }
            
            const course = appState.courses[selectedCourseId];
            const newName = prompt('Enter new course name:', course.name);
            if (newName && newName.trim() && newName.trim() !== course.name) {
                course.name = newName.trim();
                setCurrentCourse(course);
                updateCourseSelector();
                updateDashboard();
                updateAllDisplays();
                updateCourseManagementButtons();
            }
        });
    }
    
    // Delete course from dashboard
    const deleteCourseBtn = document.getElementById('delete-course-btn-dashboard');
    if (deleteCourseBtn) {
        deleteCourseBtn.addEventListener('click', function() {
            const selectedCourseId = window.selectedCourseForManagement;
            if (!selectedCourseId || !appState.courses[selectedCourseId]) {
                alert('Please select a course first');
                return;
            }
            
            const course = appState.courses[selectedCourseId];
            if (confirm(`Are you sure you want to delete "${course.name}"?`)) {
                // Remove from semesters first
                Object.values(appState.semesters || {}).forEach(semester => {
                    const index = semester.courses.indexOf(selectedCourseId);
                    if (index !== -1) {
                        semester.courses.splice(index, 1);
                    }
                });
                
                if (deleteCourse(selectedCourseId)) {
                    window.selectedCourseForManagement = null;
                    updateCourseManagementButtons();
                    updateCourseSelector();
                    updateDashboard();
                    updateAllDisplays();
                }
            }
        });
    }
    
    // Quick course entry
    const addQuickCourseBtn = document.getElementById('add-quick-course');
    if (addQuickCourseBtn) {
        addQuickCourseBtn.addEventListener('click', function() {
            const name = document.getElementById('quick-course-name').value.trim();
            const units = parseFloat(document.getElementById('quick-course-units').value);
            const grade = document.getElementById('quick-course-grade').value.trim();
            
            if (!name) {
                alert('Please enter a course name');
                return;
            }
            
            if (!units || units <= 0) {
                alert('Please enter a valid number of units');
                return;
            }
            
            if (!grade) {
                alert('Please enter a final college grade');
                return;
            }
            
            const gradeValue = parseFloat(grade);
            if (isNaN(gradeValue) || gradeValue < 1.0 || gradeValue > 5.0) {
                alert('Please enter a valid college grade (1.00 to 5.00)');
                return;
            }
            
            const quickCourseId = `quick_${Date.now()}`;
            if (!appState.quickCourses) {
                appState.quickCourses = {};
            }
            
            appState.quickCourses[quickCourseId] = {
                id: quickCourseId,
                name: name,
                units: units,
                collegeGrade: grade,
                isQuick: true
            };
            
            saveToStorage();
            
            // Clear inputs
            document.getElementById('quick-course-name').value = '';
            document.getElementById('quick-course-units').value = '3';
            document.getElementById('quick-course-grade').value = '';
            
            updateDashboard();
        });
    }
    
    // Add semester
    const addSemesterBtn = document.getElementById('add-semester');
    if (addSemesterBtn) {
        addSemesterBtn.addEventListener('click', function() {
            const name = document.getElementById('semester-name').value.trim();
            
            if (!name) {
                alert('Please enter a semester name');
                return;
            }
            
            const semesterId = `semester_${appState.nextSemesterId++}`;
            if (!appState.semesters) {
                appState.semesters = {};
            }
            
            appState.semesters[semesterId] = {
                id: semesterId,
                name: name,
                courses: [],
                totalUnits: 0
            };
            
            // Add to semester order
            if (!appState.semesterOrder) {
                appState.semesterOrder = [];
            }
            appState.semesterOrder.push(semesterId);
            
            saveToStorage();
            
            // Clear input
            document.getElementById('semester-name').value = '';
            
            updateDashboard();
        });
    }
}

// Drag and Drop Functions
function allowDrop(ev) {
    ev.preventDefault();
}

function handleDragEnter(ev) {
    ev.preventDefault();
    ev.currentTarget.classList.add('drag-over');
}

function handleDragLeave(ev) {
    ev.currentTarget.classList.remove('drag-over');
}

function handleDragEnd(ev) {
    ev.currentTarget.classList.remove('dragging');
    // Remove drag-over from all drop zones
    document.querySelectorAll('.semester-drop-zone').forEach(zone => {
        zone.classList.remove('drag-over');
    });
}

function dragCourse(ev, courseId, isQuick) {
    ev.dataTransfer.setData('courseId', courseId);
    ev.dataTransfer.setData('isQuick', isQuick);
    ev.currentTarget.classList.add('dragging');
}

function dropCourse(ev, semesterId) {
    ev.preventDefault();
    ev.currentTarget.classList.remove('drag-over');
    
    const courseId = ev.dataTransfer.getData('courseId');
    const isQuick = ev.dataTransfer.getData('isQuick') === 'true';
    
    // Remove dragging class from all cards
    document.querySelectorAll('.draggable-course').forEach(card => {
        card.classList.remove('dragging');
    });
    
    if (!appState.semesters[semesterId]) return;
    
    // Check if course already in this semester
    if (appState.semesters[semesterId].courses.indexOf(courseId) === -1) {
        // Remove from other semesters
        Object.values(appState.semesters).forEach(semester => {
            const index = semester.courses.indexOf(courseId);
            if (index !== -1) {
                semester.courses.splice(index, 1);
            }
        });
        
        // Add to this semester
        appState.semesters[semesterId].courses.push(courseId);
        saveToStorage();
        updateDashboard();
    }
}

function removeCourseFromSemester(semesterId, courseId) {
    if (!appState.semesters[semesterId]) return;
    
    const index = appState.semesters[semesterId].courses.indexOf(courseId);
    if (index !== -1) {
        appState.semesters[semesterId].courses.splice(index, 1);
        saveToStorage();
        updateDashboard();
    }
}

function selectCourseForManagement(courseId) {
    if (!appState.courses[courseId]) return;
    
    // Set as selected and switch to this course
    window.selectedCourseForManagement = courseId;
    appState.currentCourseId = courseId;
    
    // Sync sidebar selector
    const sidebarSelector = document.getElementById('course-selector');
    if (sidebarSelector) sidebarSelector.value = courseId;
    
    // Update visual selection
    document.querySelectorAll('.course-card').forEach(card => {
        card.classList.remove('selected-for-management');
    });
    
    const selectedCard = document.querySelector(`[data-course-id="${courseId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected-for-management');
    }
    
    updateCourseManagementButtons();
    updateAllDisplays();
}

function updateCourseManagementButtons() {
    const renameBtn = document.getElementById('rename-course-btn-dashboard');
    const deleteBtn = document.getElementById('delete-course-btn-dashboard');
    
    if (window.selectedCourseForManagement) {
        if (renameBtn) renameBtn.style.display = 'inline-block';
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
    } else {
        if (renameBtn) renameBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
}

function toggleSemesterDetails(semesterId) {
    const semester = appState.semesters[semesterId];
    if (!semester) return;
    
    const toggleIcon = document.getElementById(`toggle-icon-${semesterId}`);
    const existingModal = document.getElementById(`semester-modal-${semesterId}`);
    
    if (existingModal) {
        // Close modal
        existingModal.remove();
        if (toggleIcon) toggleIcon.classList.remove('rotated');
    } else {
        // Open modal
        if (toggleIcon) toggleIcon.classList.add('rotated');
        showSemesterModal(semesterId);
    }
}

function showSemesterModal(semesterId) {
    const semester = appState.semesters[semesterId];
    if (!semester) return;
    
    // Remove any existing modals (close any other open semester modals)
    document.querySelectorAll('.semester-view-modal').forEach(modal => {
        const modalId = modal.id;
        if (modalId) {
            const modalSemesterId = modalId.replace('semester-modal-', '');
            const toggleIcon = document.getElementById(`toggle-icon-${modalSemesterId}`);
            if (toggleIcon) toggleIcon.classList.remove('rotated');
        }
        modal.remove();
    });
    
    let coursesHtml = '';
    
    semester.courses.forEach(courseId => {
        let course = appState.courses[courseId];
        let isQuick = false;
        
        if (!course) {
            course = appState.quickCourses[courseId];
            isQuick = true;
        }
        
        if (course) {
            let percentage = null;
            let collegeGrade = null;
            
            if (isQuick) {
                collegeGrade = course.collegeGrade;
            } else if (course.results) {
                percentage = course.results.finalGrade;
                if (course.gradeScale.length > 0) {
                    collegeGrade = getCollegeGradeForCourse(course, percentage);
                }
            }
            
            coursesHtml += `
                <div class="course-card ${isQuick ? 'quick-course' : ''}" 
                     ${!isQuick ? `onclick="switchToCourse('${courseId}')" style="cursor: pointer;"` : ''}>
                    <div class="course-card-header">
                        <div class="course-card-name">
                            ${course.name}
                            ${isQuick ? '<span class="quick-badge">Quick</span>' : ''}
                        </div>
                        <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); removeCourseFromSemester('${semesterId}', '${courseId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="course-card-stats">
                        ${percentage !== null ? `
                            <div class="course-stat">
                                <div class="course-stat-label">Final Grade</div>
                                <div class="course-stat-value">${percentage.toFixed(2)}%</div>
                            </div>
                        ` : ''}
                        <div class="course-stat">
                            <div class="course-stat-label">College Grade</div>
                            <div class="course-stat-value">${collegeGrade || 'N/A'}</div>
                        </div>
                        <div class="course-stat">
                            <div class="course-stat-label">Units</div>
                            <div class="course-stat-value">${typeof course.units === 'number' ? course.units : 'N/A'}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    if (coursesHtml === '') {
        coursesHtml = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">No courses in this semester yet.</p>';
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'semester-view-modal';
    modal.id = `semester-modal-${semesterId}`;
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${semester.name}</h3>
                <button class="btn btn-sm modal-close-btn" onclick="toggleSemesterDetails('${semesterId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="semester-courses-details-grid">
                    ${coursesHtml}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            toggleSemesterDetails(semesterId);
        }
    });
}


// Export functions
window.allowDrop = allowDrop;
window.handleDragEnter = handleDragEnter;
window.handleDragLeave = handleDragLeave;
window.handleDragEnd = handleDragEnd;
window.dragCourse = dragCourse;
window.dropCourse = dropCourse;
window.removeCourseFromSemester = removeCourseFromSemester;
window.selectCourseForManagement = selectCourseForManagement;
window.toggleSemesterDetails = toggleSemesterDetails;

// Semester Drag and Drop Functions
function dragSemester(ev, semesterId) {
    ev.dataTransfer.setData('text/plain', semesterId);
    ev.dataTransfer.effectAllowed = 'move';
    ev.currentTarget.classList.add('dragging-semester');
}

function allowSemesterDrop(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
}

function handleSemesterDragEnter(ev) {
    ev.preventDefault();
    const target = ev.currentTarget;
    if (target.classList.contains('semesters-grid')) {
        target.classList.add('drag-over-semesters');
    } else if (target.classList.contains('semester-card') && !target.classList.contains('dragging-semester')) {
        target.classList.add('semester-drag-over');
    }
}

function handleSemesterDragLeave(ev) {
    const target = ev.currentTarget;
    if (target.classList.contains('semesters-grid')) {
        target.classList.remove('drag-over-semesters');
    } else if (target.classList.contains('semester-card')) {
        target.classList.remove('semester-drag-over');
    }
}

function handleSemesterDragEnd(ev) {
    ev.currentTarget.classList.remove('dragging-semester');
    // Clean up all drag-over classes
    document.querySelectorAll('.semester-card').forEach(card => {
        card.classList.remove('semester-drag-over');
    });
    document.querySelectorAll('.semesters-grid').forEach(grid => {
        grid.classList.remove('drag-over-semesters');
    });
}

function dropSemester(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    
    const draggedSemesterId = ev.dataTransfer.getData('text/plain');
    if (!draggedSemesterId) return;
    
    // Find the target semester card (could be the card itself or a child element)
    let targetCard = ev.target.closest('.semester-card');
    
    // If dropped on the grid container itself (not on a card), append to end
    if (!targetCard || targetCard.dataset.semesterId === draggedSemesterId) {
        // Dropped on container or same card - no change needed
        return;
    }
    
    const targetSemesterId = targetCard.dataset.semesterId;
    if (!targetSemesterId || !appState.semesterOrder) return;
    
    // Reorder semesters
    const draggedIndex = appState.semesterOrder.indexOf(draggedSemesterId);
    const targetIndex = appState.semesterOrder.indexOf(targetSemesterId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Remove from old position
    appState.semesterOrder.splice(draggedIndex, 1);
    
    // Calculate new index (if dragged from before target, target index is now one less)
    const newIndex = draggedIndex < targetIndex ? targetIndex : targetIndex;
    
    // Insert at new position
    appState.semesterOrder.splice(newIndex, 0, draggedSemesterId);
    
    saveToStorage();
    updateDashboard();
}

// Export semester drag functions
window.dragSemester = dragSemester;
window.allowSemesterDrop = allowSemesterDrop;
window.handleSemesterDragEnter = handleSemesterDragEnter;
window.handleSemesterDragLeave = handleSemesterDragLeave;
window.handleSemesterDragEnd = handleSemesterDragEnd;
window.dropSemester = dropSemester;

// Delete Quick Course
function deleteQuickCourse(quickCourseId) {
    if (confirm('Are you sure you want to delete this quick course?')) {
        if (appState.quickCourses && appState.quickCourses[quickCourseId]) {
            delete appState.quickCourses[quickCourseId];
            
            // Remove from semesters
            if (appState.semesters) {
                Object.keys(appState.semesters).forEach(semesterId => {
                    const semester = appState.semesters[semesterId];
                    const index = semester.courses.indexOf(quickCourseId);
                    if (index !== -1) {
                        semester.courses.splice(index, 1);
                    }
                });
            }
            
            saveToStorage();
            updateDashboard();
        }
    }
}

// Delete Semester
function deleteSemester(semesterId) {
    if (confirm('Are you sure you want to delete this semester? This will not delete the courses.')) {
        if (appState.semesters && appState.semesters[semesterId]) {
            delete appState.semesters[semesterId];
            // Remove from order array
            if (appState.semesterOrder) {
                const index = appState.semesterOrder.indexOf(semesterId);
                if (index !== -1) {
                    appState.semesterOrder.splice(index, 1);
                }
            }
            saveToStorage();
            updateDashboard();
        }
    }
}

// Export functions for onclick handlers
window.deleteQuickCourse = deleteQuickCourse;
window.deleteSemester = deleteSemester;

// Export for onclick handler
window.switchToCourse = switchToCourse;

// Helper to get college grade for a specific course
function getCollegeGradeForCourse(course, finalPct) {
    if (!course.gradeScale || course.gradeScale.length === 0) return 'No Scale Set';
    
    // Optionally round percentage (e.g., 94.55 -> 95)
    let pctForScale = finalPct;
    if (course.settings && course.settings.roundingEnabled) {
        pctForScale = Math.round(finalPct);
    }

    const sortedScale = [...course.gradeScale].sort((a, b) => b.min - a.min);

    for (let i = 0; i < sortedScale.length; i++) {
        const gs = sortedScale[i];
        if (pctForScale >= gs.min) {
            return gs.grade;
        }
    }

    // Default to 5.00 if nothing matched
    return '5.00';
}

// Tab Navigation
function setupTabNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            
            // Update active menu item
            menuItems.forEach(mi => mi.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding tab
            tabContents.forEach(tab => tab.classList.remove('active'));
            const targetTab = document.getElementById(`${tabName}-tab`);
            if (targetTab) {
                targetTab.classList.add('active');
            }
            
            // Update dashboard when switching to dashboard tab
            if (tabName === 'dashboard') {
                updateDashboard();
            }
            
            // Update What If Calculator when switching to whatif tab
            if (tabName === 'whatif') {
                updateWhatIfCalculator();
            }
        });
    });
}

// Criteria Setup Handlers
function setupCriteriaHandlers() {
    // Add component
    document.getElementById('add-component').addEventListener('click', function() {
        const course = getCurrentCourse();
        const name = document.getElementById('component-name').value.trim();
        const weight = parseFloat(document.getElementById('component-weight').value);
        
        if (!name || weight <= 0) {
            alert('Please enter valid component name and weight');
            return;
        }
        
        // Check for duplicates
        if (course.criteria.some(c => c.component === name && c.type === 'Normal')) {
            alert('Component name already exists');
            return;
        }
        
        course.criteria.push({
            component: name,
            weight: weight,
            type: 'Normal'
        });
        setCurrentCourse(course);
        
        document.getElementById('component-name').value = '';
        document.getElementById('component-weight').value = '0';
        updateCriteriaDisplay();
        updateScoreInputs();
        
        // Update What If Calculator if tab is active
        const whatIfTab = document.getElementById('whatif-tab');
        if (whatIfTab && whatIfTab.classList.contains('active')) {
            updateWhatIfCalculator();
        }
    });
    
    // Add exam
    document.getElementById('add-exam').addEventListener('click', function() {
        const course = getCurrentCourse();
        const name = document.getElementById('exam-name').value.trim();
        const weight = parseFloat(document.getElementById('exam-weight').value);
        
        if (!name || weight <= 0) {
            alert('Please enter valid exam name and weight');
            return;
        }
        
        course.criteria.push({
            component: name,
            weight: weight,
            type: 'Exam'
        });
        setCurrentCourse(course);
        
        document.getElementById('exam-name').value = '';
        document.getElementById('exam-weight').value = '0';
        updateCriteriaDisplay();
        updateScoreInputs();
        
        // Update What If Calculator if tab is active
        const whatIfTab = document.getElementById('whatif-tab');
        if (whatIfTab && whatIfTab.classList.contains('active')) {
            updateWhatIfCalculator();
        }
    });
    
    // Remove selected criteria
    document.getElementById('clear-criteria').addEventListener('click', function() {
        removeSelectedCriteria();
    });
    
    // Final exam checkbox
    document.getElementById('has-final').addEventListener('change', function() {
        const course = getCurrentCourse();
        course.settings.hasFinal = this.checked;
        setCurrentCourse(course);
        document.getElementById('has-exemption-label').style.display = this.checked ? 'block' : 'none';
        if (!this.checked) {
            course.settings.hasExemption = false;
            document.getElementById('has-exemption').checked = false;
            document.getElementById('exemption-settings').style.display = 'none';
            setCurrentCourse(course);
        }
        updateScoreInputs();
    });
    
    // Exemption checkbox
    document.getElementById('has-exemption').addEventListener('change', function() {
        const course = getCurrentCourse();
        course.settings.hasExemption = this.checked;
        setCurrentCourse(course);
        document.getElementById('exemption-settings').style.display = this.checked ? 'block' : 'none';
    });
    
    // Settings inputs
    document.getElementById('passing-exam-percent').addEventListener('change', function() {
        const course = getCurrentCourse();
        course.settings.passingExamPercent = parseFloat(this.value);
        setCurrentCourse(course);
    });
    
    document.getElementById('min-exams-passed').addEventListener('change', function() {
        const course = getCurrentCourse();
        course.settings.minExamsPassed = parseInt(this.value);
        setCurrentCourse(course);
    });
    
    document.getElementById('min-prefinal-percent').addEventListener('change', function() {
        const course = getCurrentCourse();
        course.settings.minPrefinalPercent = parseFloat(this.value);
        setCurrentCourse(course);
    });
    
    document.getElementById('final-weight').addEventListener('change', function() {
        const course = getCurrentCourse();
        course.settings.finalWeight = parseFloat(this.value);
        setCurrentCourse(course);
        updateScoreInputs();
    });
}

// Update Criteria Display
function updateCriteriaDisplay() {
    const course = getCurrentCourse();
    
    let normalRows = '';
    let examRows = '';
    
    course.criteria.forEach((c, index) => {
        const row = `
            <tr>
                <td><input type="checkbox" class="criteria-select" data-index="${index}" data-type="${c.type}"></td>
                <td>${c.component}</td>
                <td>${c.weight}%</td>
            </tr>
        `;
        if (c.type === 'Normal') {
            normalRows += row;
        } else if (c.type === 'Exam') {
            examRows += row;
        }
    });
    
    // Display normal components
    if (normalRows) {
        const normalHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Select</th>
                        <th>Component</th>
                        <th>Weight (%)</th>
                    </tr>
                </thead>
                <tbody>
                    ${normalRows}
                </tbody>
            </table>
        `;
        document.getElementById('criteria-table-container').innerHTML = normalHtml;
    } else {
        document.getElementById('criteria-table-container').innerHTML =
            '<p style="padding: 8px;">No normal components added yet.</p>';
    }
    
    // Display exams
    if (examRows) {
        const examHtml = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Select</th>
                        <th>Exam</th>
                        <th>Weight (%)</th>
                    </tr>
                </thead>
                <tbody>
                    ${examRows}
                </tbody>
            </table>
        `;
        document.getElementById('exam-table-container').innerHTML = examHtml;
    } else {
        document.getElementById('exam-table-container').innerHTML =
            '<p style="padding: 8px;">No exams added yet.</p>';
    }
    
    // Update total weight
    let totalWeight = course.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (course.settings.hasFinal) {
        totalWeight += course.settings.finalWeight;
    }
    
    const isPerfect = Math.abs(totalWeight - 100) < 0.01;
    const warningText = isPerfect ? ' (Perfect!)' : ' (Warning: Should equal 100%)';
    const finalText = course.settings.hasFinal ? ` + Final Exam: ${course.settings.finalWeight}% = ${totalWeight}%` : '';
    const totalWeightDisplay = document.getElementById('total-weight-display');
    
    // Add green color class when total equals 100%
    if (isPerfect) {
        totalWeightDisplay.classList.add('weight-perfect');
    } else {
        totalWeightDisplay.classList.remove('weight-perfect');
    }
    
    totalWeightDisplay.innerHTML = 
        `<h4>Total Weight: ${totalWeight - (course.settings.hasFinal ? course.settings.finalWeight : 0)}%${finalText}${warningText}</h4>`;
}

// Remove selected criteria (normal and exams)
function removeSelectedCriteria() {
    const course = getCurrentCourse();
    const selected = document.querySelectorAll('.criteria-select:checked');
    
    if (!selected.length) {
        if (!course.criteria.length) {
            alert('There are no components or exams to remove.');
        } else {
            alert('Please select at least one component or exam to remove.');
        }
            return;
        }
        
    const indicesToRemove = new Set(
        Array.from(selected).map(cb => parseInt(cb.getAttribute('data-index'), 10))
    );
    
    course.criteria = course.criteria.filter((_, index) => !indicesToRemove.has(index));
    
    // Reset scores because indices no longer match criteria order
    course.componentScores = {};
    course.examScores = {};
    
    setCurrentCourse(course);
    updateCriteriaDisplay();
    updateScoreInputs();
    
    // Update What If Calculator if tab is active
    const whatIfTab = document.getElementById('whatif-tab');
    if (whatIfTab && whatIfTab.classList.contains('active')) {
        updateWhatIfCalculator();
    }
}

// Grade Scale Setup Handlers
function setupGradeScaleHandlers() {
    // Clear grades
    document.getElementById('clear-grades').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear the grade scale?')) {
            const course = getCurrentCourse();
            course.gradeScale = [];
            setCurrentCourse(course);
            updateGradeScaleDisplay();
        }
    });
    
    // Set default UP grade scale
    document.getElementById('set-default-grades').addEventListener('click', function() {
        const course = getCurrentCourse();
        course.gradeScale = [
            { grade: '1.00', min: 95 },
            { grade: '1.25', min: 90 },
            { grade: '1.50', min: 85 },
            { grade: '1.75', min: 80 },
            { grade: '2.00', min: 76 },
            { grade: '2.25', min: 72 },
            { grade: '2.50', min: 68 },
            { grade: '2.75', min: 64 },
            { grade: '3.00', min: 60 },
            { grade: '4.00', min: 55 },
            { grade: '5.00', min: 0 }
        ];
        setCurrentCourse(course);
        updateGradeScaleDisplay();
    });

    // Rounding toggle
    const roundingCheckbox = document.getElementById('grade-rounding');
    if (roundingCheckbox) {
        roundingCheckbox.addEventListener('change', function() {
            const course = getCurrentCourse();
            if (!course.settings) course.settings = {};
            course.settings.roundingEnabled = this.checked;
            setCurrentCourse(course);
        });
    }
}

// Update Grade Scale Display
function updateGradeScaleDisplay() {
    const course = getCurrentCourse();
    const container = document.getElementById('grade-scale-editor-container');
    if (!container) return;

    const gradeOrder = [
        '1.00', '1.25', '1.50', '1.75',
        '2.00', '2.25', '2.50', '2.75',
        '3.00', '4.00', '5.00'
    ];

    let html = `
        <div class="grade-scale-container">
            <table class="data-table grade-scale-table">
                <thead>
                    <tr>
                        <th style="text-align: center; width: 200px;">College Grade</th>
                        <th style="text-align: center;">Minimum % (inclusive)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    gradeOrder.forEach(grade => {
        const existing = course.gradeScale.find(gs => gs.grade === grade);
        const min = existing ? existing.min : '';
        html += `
            <tr>
                <td class="grade-label-cell" style="text-align: center;">
                    <span class="grade-badge">${grade}</span>
                </td>
                <td style="text-align: center;">
                    <div class="grade-input-wrapper" style="justify-content: center; margin: 0 auto;">
                        <input
                            type="number"
                            class="grade-min-input"
                            data-grade="${grade}"
                            min="0"
                            max="100"
                            step="0.01"
                            value="${min !== '' ? min : ''}"
                            placeholder="Enter min %"
                        >
                        <span class="input-suffix">%</span>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;

    // Wire inputs to course.gradeScale
    gradeOrder.forEach(grade => {
        const input = container.querySelector(`.grade-min-input[data-grade="${grade}"]`);
        if (!input) return;
        input.addEventListener('change', function() {
            const value = parseFloat(this.value);
            const idx = course.gradeScale.findIndex(gs => gs.grade === grade);

            if (isNaN(value)) {
                if (idx !== -1) {
                    course.gradeScale.splice(idx, 1);
                }
            } else {
                if (idx === -1) {
                    course.gradeScale.push({ grade, min: value });
                } else {
                    course.gradeScale[idx].min = value;
                }
            }
            setCurrentCourse(course);
        });
    });

    // Sync rounding checkbox
    const roundingCheckbox = document.getElementById('grade-rounding');
    if (roundingCheckbox) {
        roundingCheckbox.checked = !!(course.settings && course.settings.roundingEnabled);
    }
}

// Score Entry Handlers
function setupScoreEntryHandlers() {
    updateScoreInputs();
}

function updateScoreInputs() {
    const container = document.getElementById('score-inputs-container');
    const course = getCurrentCourse();
    
    if (course.criteria.length === 0) {
        container.innerHTML = '<p>Please set up your grade criteria first in the Setup tab.</p>';
        return;
    }
    
    let html = '';
    
    // Normal Components
    const normalCriteria = course.criteria.filter(c => c.type === 'Normal');
    if (normalCriteria.length > 0) {
        html += '<h4>Normal Components:</h4>';
        normalCriteria.forEach((criteria, index) => {
            const key = `comp_${index}`;
            if (!course.componentScores[key]) {
                course.componentScores[key] = [];
            }
            
            html += `
                <div class="score-section" data-key="${key}">
                    <div class="score-section-header">
                        <div class="score-section-title">${criteria.component} (${criteria.weight}%)</div>
                        <label>
                            <input type="checkbox" class="include-checkbox" ${getIncludeStatus(key, 'component') ? 'checked' : ''} data-key="${key}" data-type="component">
                            Include in calculation
                        </label>
                    </div>
                    <div class="score-table-container" id="score-table-${key}"></div>
                    <div class="score-input-row">
                        <input type="number" id="score-${key}" placeholder="Score" min="0" value="0">
                        <input type="number" id="total-${key}" placeholder="Max Score" min="1" value="100">
                        <button class="btn btn-success btn-sm" onclick="addScore('${key}', 'component')">
                            <i class="fas fa-plus"></i> Add Score
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="removeSelectedScores('${key}', 'component')">
                            <i class="fas fa-trash"></i> Remove Selected
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    // Examinations
    const examCriteria = course.criteria.filter(c => c.type === 'Exam');
    if (examCriteria.length > 0) {
        html += '<h4>Examinations:</h4>';
        examCriteria.forEach((criteria, index) => {
            const key = `exam_${index}`;
            if (!course.examScores[key]) {
                course.examScores[key] = [];
            }
            
            html += `
                <div class="score-section" data-key="${key}">
                    <div class="score-section-header">
                        <div class="score-section-title">${criteria.component} (${criteria.weight}%)</div>
                        <label>
                            <input type="checkbox" class="include-checkbox" ${getIncludeStatus(key, 'exam') ? 'checked' : ''} data-key="${key}" data-type="exam">
                            Include in calculation
                        </label>
                    </div>
                    <div class="score-table-container" id="score-table-${key}"></div>
                    <div class="score-input-row">
                        <input type="number" id="score-${key}" placeholder="Score" min="0" value="0">
                        <input type="number" id="total-${key}" placeholder="Max Score" min="1" value="100">
                        <button class="btn btn-success btn-sm" onclick="addScore('${key}', 'exam')">
                            <i class="fas fa-plus"></i> Add Score
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="removeSelectedScores('${key}', 'exam')">
                            <i class="fas fa-trash"></i> Remove Selected
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    // Final Exam
    if (course.settings.hasFinal) {
        html += '<h4>Final Exam:</h4>';
        html += `
            <div class="score-section">
                <div class="score-section-header">
                    <div class="score-section-title">Final Exam (${course.settings.finalWeight}%)</div>
                    <label>
                        <input type="checkbox" id="include-final" ${course.finalExam.include ? 'checked' : ''}>
                        Include in calculation
                    </label>
                </div>
                <div class="score-input-row">
                    <input type="number" id="final-score" placeholder="Score" min="0" value="${course.finalExam.score}">
                    <input type="number" id="final-total" placeholder="Max Score" min="1" value="${course.finalExam.total}">
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Setup final exam handlers after innerHTML is set
    if (course.settings.hasFinal) {
        const includeFinal = document.getElementById('include-final');
        const finalScore = document.getElementById('final-score');
        const finalTotal = document.getElementById('final-total');
        
        if (includeFinal) {
            includeFinal.addEventListener('change', function() {
                const course = getCurrentCourse();
                course.finalExam.include = this.checked;
                setCurrentCourse(course);
            });
        }
        
        if (finalScore) {
            finalScore.addEventListener('change', function() {
                const course = getCurrentCourse();
                course.finalExam.score = parseFloat(this.value) || 0;
                setCurrentCourse(course);
            });
        }
        
        if (finalTotal) {
            finalTotal.addEventListener('change', function() {
                const course = getCurrentCourse();
                course.finalExam.total = parseFloat(this.value) || 100;
                setCurrentCourse(course);
            });
        }
    }
    
    // Update all score tables
    normalCriteria.forEach((criteria, index) => {
        updateScoreTable(`comp_${index}`, 'component');
    });
    examCriteria.forEach((criteria, index) => {
        updateScoreTable(`exam_${index}`, 'exam');
    });
    
    // Setup include checkboxes
    document.querySelectorAll('.include-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            const key = this.getAttribute('data-key');
            const type = this.getAttribute('data-type');
            setIncludeStatus(key, type, this.checked);
        });
    });
    
    // Wire up input listeners to check for unadded scores
    document.querySelectorAll('input[id^="score-"]').forEach(input => {
        input.addEventListener('input', checkUnaddedScores);
        input.addEventListener('blur', checkUnaddedScores);
    });
    
    document.querySelectorAll('input[id^="total-"]').forEach(input => {
        input.addEventListener('input', checkUnaddedScores);
        input.addEventListener('blur', checkUnaddedScores);
    });
    
    // Initial check
    setTimeout(checkUnaddedScores, 100);
}

function getIncludeStatus(key, type) {
    const course = getCurrentCourse();
    const storageKey = `include_${course.id}_${key}_${type}`;
    const stored = localStorage.getItem(storageKey);
    return stored !== null ? stored === 'true' : true;
}

function setIncludeStatus(key, type, value) {
    const course = getCurrentCourse();
    const storageKey = `include_${course.id}_${key}_${type}`;
    localStorage.setItem(storageKey, value);
}

function addScore(key, type) {
    const course = getCurrentCourse();
    const scoreInput = document.getElementById(`score-${key}`);
    const totalInput = document.getElementById(`total-${key}`);
    
    const score = parseFloat(scoreInput.value) || 0;
    const total = parseFloat(totalInput.value) || 100;
    
    if (total <= 0) {
        alert('Max score must be greater than 0');
        return;
    }
    
    const scores = type === 'component' ? course.componentScores : course.examScores;
    if (!scores[key]) {
        scores[key] = [];
    }
    
    scores[key].push({ score, maxScore: total });
    setCurrentCourse(course);
    
    scoreInput.value = '0';
    totalInput.value = '100';
    
    // Clear any warnings for this input
    clearScoreWarning(key);
    
    updateScoreTable(key, type);
    checkUnaddedScores();
}

// Check for unadded scores and show warnings
function checkUnaddedScores() {
    const course = getCurrentCourse();
    const container = document.getElementById('score-inputs-container');
    if (!container) return;
    
    let hasUnadded = false;
    const unaddedList = [];
    
    // Check normal components
    const normalCriteria = course.criteria.filter(c => c.type === 'Normal');
    normalCriteria.forEach((criteria, index) => {
        const key = `comp_${index}`;
        const scoreInput = document.getElementById(`score-${key}`);
        const totalInput = document.getElementById(`total-${key}`);
        
        if (scoreInput && totalInput) {
            const score = parseFloat(scoreInput.value) || 0;
            const total = parseFloat(totalInput.value) || 100;
            
            // Check if there's a meaningful value that hasn't been added
            if (score > 0 || (scoreInput.value && scoreInput.value.trim() !== '' && scoreInput.value !== '0')) {
                hasUnadded = true;
                unaddedList.push(criteria.component);
                showScoreWarning(key, criteria.component);
            } else {
                clearScoreWarning(key);
            }
        }
    });
    
    // Check exams
    const examCriteria = course.criteria.filter(c => c.type === 'Exam');
    examCriteria.forEach((criteria, index) => {
        const key = `exam_${index}`;
        const scoreInput = document.getElementById(`score-${key}`);
        const totalInput = document.getElementById(`total-${key}`);
        
        if (scoreInput && totalInput) {
            const score = parseFloat(scoreInput.value) || 0;
            const total = parseFloat(totalInput.value) || 100;
            
            if (score > 0 || (scoreInput.value && scoreInput.value.trim() !== '' && scoreInput.value !== '0')) {
                hasUnadded = true;
                unaddedList.push(criteria.component);
                showScoreWarning(key, criteria.component);
            } else {
                clearScoreWarning(key);
            }
        }
    });
    
    // Show/hide global warning
    let warningDiv = document.getElementById('unadded-scores-warning');
    if (hasUnadded && unaddedList.length > 0) {
        if (!warningDiv) {
            warningDiv = document.createElement('div');
            warningDiv.id = 'unadded-scores-warning';
            warningDiv.className = 'unadded-scores-warning';
            const calculateBtn = document.getElementById('calculate-final');
            if (calculateBtn && calculateBtn.parentNode) {
                calculateBtn.parentNode.insertBefore(warningDiv, calculateBtn);
            }
        }
        warningDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <strong>Warning:</strong> You have entered scores that haven't been added yet. 
            Please click "Add Score" for: ${unaddedList.join(', ')}
        `;
        warningDiv.style.display = 'block';
    } else if (warningDiv) {
        warningDiv.style.display = 'none';
    }
}

// Show warning for a specific score input
function showScoreWarning(key, componentName) {
    const scoreInput = document.getElementById(`score-${key}`);
    if (scoreInput) {
        scoreInput.classList.add('has-unadded-score');
        scoreInput.title = `Don't forget to click "Add Score" for ${componentName}!`;
    }
}

// Clear warning for a specific score input
function clearScoreWarning(key) {
    const scoreInput = document.getElementById(`score-${key}`);
    if (scoreInput) {
        scoreInput.classList.remove('has-unadded-score');
        scoreInput.title = '';
    }
}

function removeSelectedScores(key, type) {
    const course = getCurrentCourse();
    const table = document.querySelector(`#score-table-${key} table`);
    if (!table) return;
    
    const checkboxes = table.querySelectorAll('tbody input[type="checkbox"]:checked');
    const indices = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (indices.length === 0) {
        alert('Please select scores to remove');
        return;
    }
    
    const scores = type === 'component' ? course.componentScores : course.examScores;
    scores[key] = scores[key].filter((_, index) => !indices.includes(index));
    setCurrentCourse(course);
    
    updateScoreTable(key, type);
}

function updateScoreTable(key, type) {
    const course = getCurrentCourse();
    const container = document.getElementById(`score-table-${key}`);
    const scores = type === 'component' ? course.componentScores[key] : course.examScores[key];
    
    if (!scores || scores.length === 0) {
        container.innerHTML = '<p>No scores entered yet.</p>';
        return;
    }
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Select</th>
                    <th>Score</th>
                    <th>Max Score</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    scores.forEach((s, index) => {
        const percentage = ((s.score / s.maxScore) * 100).toFixed(2);
        html += `
            <tr>
                <td><input type="checkbox" value="${index}"></td>
                <td>${s.score}</td>
                <td>${s.maxScore}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Calculate Final Grade
function calculateFinalGrade() {
    const course = getCurrentCourse();
    
    if (course.criteria.length === 0) {
        alert('Please set up your grade criteria first');
        return;
    }
    
    if (course.gradeScale.length === 0) {
        alert('Please set up your grade scale first');
        return;
    }
    
    // Check for unadded scores before calculating
    checkUnaddedScores();
    const warningDiv = document.getElementById('unadded-scores-warning');
    if (warningDiv && warningDiv.style.display !== 'none') {
        const proceed = confirm('You have scores entered that haven\'t been added yet. These will not be included in the calculation. Do you want to proceed anyway?');
        if (!proceed) {
            return;
        }
    }
    
    let totalWeightedScore = 0;
    let totalWeightUsed = 0;
    const normalScores = [];
    const examScores = [];
    let examsPassed = 0;
    
    // Calculate normal components
    const normalCriteria = course.criteria.filter(c => c.type === 'Normal');
    normalCriteria.forEach((criteria, index) => {
        const key = `comp_${index}`;
        if (!getIncludeStatus(key, 'component')) return;
        
        const scores = course.componentScores[key];
        if (!scores || scores.length === 0) return;
        
        const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
        const totalPossible = scores.reduce((sum, s) => sum + s.maxScore, 0);
        const percentage = (totalScore / totalPossible) * 100;
        const weightedScore = percentage * (criteria.weight / 100);
        
        normalScores.push({
            component: criteria.component,
            percentage,
            weight: criteria.weight,
            weightedScore
        });
        
        totalWeightedScore += weightedScore;
        totalWeightUsed += criteria.weight;
    });
    
    // Calculate exam scores
    const examCriteria = course.criteria.filter(c => c.type === 'Exam');
    examCriteria.forEach((criteria, index) => {
        const key = `exam_${index}`;
        if (!getIncludeStatus(key, 'exam')) return;
        
        const scores = course.examScores[key];
        if (!scores || scores.length === 0) return;
        
        const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
        const totalPossible = scores.reduce((sum, s) => sum + s.maxScore, 0);
        const percentage = (totalScore / totalPossible) * 100;
        const weightedScore = percentage * (criteria.weight / 100);
        
        if (percentage >= course.settings.passingExamPercent) {
            examsPassed++;
        }
        
        examScores.push({
            component: criteria.component,
            percentage,
            weight: criteria.weight,
            weightedScore
        });
        
        totalWeightedScore += weightedScore;
        totalWeightUsed += criteria.weight;
    });
    
    // Calculate prefinal standing
    const prefinalPercentage = totalWeightUsed > 0 ? (totalWeightedScore / totalWeightUsed) * 100 : 0;
    
    // Check exemption eligibility
    let exemptEligible = false;
    if (course.settings.hasFinal && course.settings.hasExemption) {
        if (examsPassed >= course.settings.minExamsPassed && 
            prefinalPercentage >= course.settings.minPrefinalPercent) {
            exemptEligible = true;
        }
    }
    
    // Calculate final exam
    let finalScoreCalc = null;
    if (course.settings.hasFinal && course.finalExam.include) {
        if (course.finalExam.total > 0 && course.finalExam.score >= 0) {
            const finalPercentage = (course.finalExam.score / course.finalExam.total) * 100;
            const finalWeightedScore = finalPercentage * (course.settings.finalWeight / 100);
            
            finalScoreCalc = {
                component: 'Final Exam',
                percentage: finalPercentage,
                weight: course.settings.finalWeight,
                weightedScore: finalWeightedScore
            };
            
            totalWeightedScore += finalWeightedScore;
            totalWeightUsed += course.settings.finalWeight;
        }
    }
    
    // Final grade calculation
    const finalGrade = totalWeightUsed > 0 ? (totalWeightedScore / totalWeightUsed) * 100 : 0;
    
    // Store results
    course.results = {
        normalScores,
        examScores,
        finalScore: finalScoreCalc,
        prefinalPercentage,
        finalGrade,
        exemptEligible,
        examsPassed,
        totalWeightUsed
    };
    setCurrentCourse(course);
    
    // Display results
    displayResults();
    
    // Update dashboard
    updateDashboard();
    
    // Switch to results tab
    const resultsMenuItem = document.querySelector('.menu-item[data-tab="results"]');
    if (resultsMenuItem) {
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(mi => mi.classList.remove('active'));
        resultsMenuItem.classList.add('active');
        
        // Show results tab
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        const resultsTab = document.getElementById('results-tab');
        if (resultsTab) {
            resultsTab.classList.add('active');
        }
    }
}

// Display Results
function displayResults() {
    const course = getCurrentCourse();
    if (!course.results) return;
    
    const results = course.results;
    const finalPct = results.finalGrade;
    const collegeGrade = getCollegeGrade(finalPct);
    
    // Update value boxes
    const finalPctBox = document.getElementById('final-percentage-box');
    finalPctBox.querySelector('.value-box-value').textContent = `${finalPct.toFixed(2)}%`;
    finalPctBox.className = 'value-box ' + (finalPct >= 75 ? 'green' : finalPct >= 65 ? 'yellow' : 'red');
    
    const collegeGradeBox = document.getElementById('college-grade-box');
    collegeGradeBox.querySelector('.value-box-value').textContent = collegeGrade;
    const gradeNum = parseFloat(collegeGrade);
    collegeGradeBox.className = 'value-box ' + 
        (!isNaN(gradeNum) && gradeNum <= 3.00 ? 'green' : collegeGrade === '4.00' ? 'yellow' : 'red');
    
    const statusBox = document.getElementById('grade-status-box');
    let status = collegeGrade === '4.00' ? 'Incomplete' : collegeGrade === '5.00' ? 'Failed' : 'Passed';
    if (results.exemptEligible) {
        status += ' (Exempt Eligible)';
    }
    statusBox.querySelector('.value-box-value').textContent = status;
    statusBox.className = 'value-box ' + 
        (status.includes('Failed') ? 'red' : status.includes('Incomplete') ? 'yellow' : 'green');
    
    // Breakdown table
    let html = '<table class="data-table"><thead><tr><th>Component</th><th>Weight</th><th>Score</th><th>Weighted Score</th></tr></thead><tbody>';
    
    results.normalScores.forEach(s => {
        html += `<tr><td>${s.component}</td><td>${s.weight}%</td><td>${s.percentage.toFixed(2)}%</td><td>${s.weightedScore.toFixed(2)}</td></tr>`;
    });
    
    results.examScores.forEach(s => {
        html += `<tr><td>${s.component}</td><td>${s.weight}%</td><td>${s.percentage.toFixed(2)}%</td><td>${s.weightedScore.toFixed(2)}</td></tr>`;
    });
    
    if (results.finalScore) {
        html += `<tr><td>${results.finalScore.component}</td><td>${results.finalScore.weight}%</td><td>${results.finalScore.percentage.toFixed(2)}%</td><td>${results.finalScore.weightedScore.toFixed(2)}</td></tr>`;
    }
    
    html += '</tbody></table>';
    document.getElementById('breakdown-table-container').innerHTML = html;
    
    // Chart
    updateChart();
    
    // Performance analysis
    displayPerformanceAnalysis();
}

// Get College Grade
function getCollegeGrade(finalPct) {
    const course = getCurrentCourse();
    return getCollegeGradeForCourse(course, finalPct);
}

// Update Chart
let gradeChart = null;

function updateChart() {
    const course = getCurrentCourse();
    const ctx = document.getElementById('grade-chart').getContext('2d');
    
    // Prepare chart data
    const chartData = {
        labels: [],
        achieved: [],
        lost: []
    };
    
    const normalCriteria = course.criteria.filter(c => c.type === 'Normal');
    normalCriteria.forEach((criteria, index) => {
        const key = `comp_${index}`;
        const scores = course.componentScores[key];
        const label = `${criteria.component}\n(${criteria.weight}%)`;
        
        if (scores && scores.length > 0) {
            const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
            const totalPossible = scores.reduce((sum, s) => sum + s.maxScore, 0);
            const percentage = (totalScore / totalPossible) * 100;
            const achieved = percentage * (criteria.weight / 100);
            const lost = criteria.weight - achieved;
            
            chartData.labels.push(label);
            chartData.achieved.push(achieved);
            chartData.lost.push(lost);
        } else {
            chartData.labels.push(label);
            chartData.achieved.push(0);
            chartData.lost.push(criteria.weight);
        }
    });
    
    const examCriteria = course.criteria.filter(c => c.type === 'Exam');
    examCriteria.forEach((criteria, index) => {
        const key = `exam_${index}`;
        const scores = course.examScores[key];
        const label = `${criteria.component}\n(${criteria.weight}%)`;
        
        if (scores && scores.length > 0) {
            const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
            const totalPossible = scores.reduce((sum, s) => sum + s.maxScore, 0);
            const percentage = (totalScore / totalPossible) * 100;
            const achieved = percentage * (criteria.weight / 100);
            const lost = criteria.weight - achieved;
            
            chartData.labels.push(label);
            chartData.achieved.push(achieved);
            chartData.lost.push(lost);
        } else {
            chartData.labels.push(label);
            chartData.achieved.push(0);
            chartData.lost.push(criteria.weight);
        }
    });
    
    if (course.settings.hasFinal) {
        const label = `Final Exam\n(${course.settings.finalWeight}%)`;
        if (course.finalExam.total > 0 && course.finalExam.score > 0) {
            const percentage = (course.finalExam.score / course.finalExam.total) * 100;
            const achieved = percentage * (course.settings.finalWeight / 100);
            const lost = course.settings.finalWeight - achieved;
            chartData.labels.push(label);
            chartData.achieved.push(achieved);
            chartData.lost.push(lost);
        } else {
            chartData.labels.push(label);
            chartData.achieved.push(0);
            chartData.lost.push(course.settings.finalWeight);
        }
    }
    
    if (gradeChart) {
        gradeChart.destroy();
    }
    
    // Get theme colors
    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#e0e0e0' : '#000000';
    const gridColor = isDark ? '#404040' : '#f0f0f0';
    const titleColor = isDark ? '#a0002a' : '#800020';
    
    gradeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Points Achieved',
                data: chartData.achieved,
                backgroundColor: '#228b22'
            }, {
                label: 'Points Lost',
                data: chartData.lost,
                backgroundColor: '#d9534f'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Weight (%)',
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Grade Distribution: Points Achieved vs Lost',
                    font: {
                        family: 'Poppins',
                        size: 18
                    },
                    color: titleColor
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

// Display Performance Analysis
function displayPerformanceAnalysis() {
    const course = getCurrentCourse();
    const container = document.getElementById('performance-analysis-container');
    
    if (!course.results || course.gradeScale.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">Please calculate your grades first and ensure grade scale is set up.</p>';
        return;
    }
    
    const results = course.results;
    const currentGrade = getCollegeGrade(results.finalGrade);
    const currentPercentage = results.finalGrade;
    
    let html = '';
    
    // Current Status Section
    const statusColor = currentGrade === '5.00' ? '#600015' : currentGrade === '4.00' ? '#c4941d' : '#228b22';
    const statusIcon = currentGrade === '5.00' ? 'times-circle' : currentGrade === '4.00' ? 'exclamation-triangle' : 'check-circle';
    
    html += `
        <div class="performance-section">
            <h4><i class="fas fa-chart-line"></i> CURRENT STATUS</h4>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
                <div class="status-box" style="border-color: ${statusColor};">
                    <h3 style="color: ${statusColor};">${currentPercentage.toFixed(2)}%</h3>
                    <p>Final Grade</p>
                </div>
                <div class="status-box" style="border-color: ${statusColor};">
                    <h3 style="color: ${statusColor};">${currentGrade}</h3>
                    <p>College Grade</p>
                </div>
                <div class="status-box" style="border-color: ${statusColor};">
                    <h3 style="color: ${statusColor};"><i class="fas fa-${statusIcon}"></i> ${currentGrade === '5.00' ? 'FAILING' : currentGrade === '4.00' ? 'INCOMPLETE' : 'PASSING'}</h3>
                    <p>Status</p>
                </div>
            </div>
        </div>
    `;
    
    // Grade Projections Section
    html += generateGradeProjections(course, results);
    
    // Exemption Analysis
    if (course.settings.hasFinal && course.settings.hasExemption) {
        const exemptionColor = results.exemptEligible ? '#006400' : '#600015';
        const exemptionIcon = results.exemptEligible ? 'check-circle' : 'times-circle';
        
        html += `
            <div class="exemption-box">
                <h4><i class="fas fa-graduation-cap"></i> EXEMPTION ANALYSIS</h4>
                <div class="exemption-content ${results.exemptEligible ? 'eligible' : 'not-eligible'}">
                    <h5 style="color: ${exemptionColor};"><i class="fas fa-${exemptionIcon}"></i> ${results.exemptEligible ? 'ELIGIBLE for Final Exam Exemption!' : 'NOT ELIGIBLE for Final Exam Exemption'}</h5>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 10px;">
                        <p><strong>Exams Passed:</strong> ${results.examsPassed} / ${course.settings.minExamsPassed} required</p>
                        <p><strong>Prefinal Standing:</strong> ${results.prefinalPercentage.toFixed(2)}% (${course.settings.minPrefinalPercent}% required)</p>
                    </div>
                    ${results.exemptEligible ? '<p style="margin-top: 10px; color: #856404; font-style: italic;"><i class="fas fa-lightbulb"></i> You may choose to skip the final exam and keep your current grade.</p>' : ''}
                </div>
            </div>
        `;
    }
    
    // Recommendations
    const recommendations = [];
    if (currentGrade === '5.00') {
        recommendations.push({
            type: 'critical',
            icon: 'exclamation-triangle',
            title: 'Critical:',
            text: 'You are currently failing. Focus on upcoming assessments to pass.'
        });
    } else if (!isNaN(parseFloat(currentGrade)) && parseFloat(currentGrade) >= 2.5) {
        recommendations.push({
            type: 'improvement',
            icon: 'lightbulb',
            title: 'Improvement:',
            text: 'You have room for improvement. Consider aiming for a higher grade.'
        });
    } else {
        recommendations.push({
            type: 'excellent',
            icon: 'trophy',
            title: 'Excellent:',
            text: 'Great performance! Keep up the good work.'
        });
    }
    
    if (results.exemptEligible && course.settings.hasFinal) {
        recommendations.push({
            type: 'decision',
            icon: 'question-circle',
            title: 'Decision:',
            text: 'Consider whether taking the final exam could improve or risk your current grade.'
        });
    }
    
    if (recommendations.length > 0) {
        html += '<div class="recommendation-box"><h4><i class="fas fa-compass"></i> RECOMMENDATIONS</h4>';
        recommendations.forEach(rec => {
            html += `
                <div class="recommendation-item ${rec.type}">
                    <p><i class="fas fa-${rec.icon}"></i> <strong>${rec.title}</strong> ${rec.text}</p>
                </div>
            `;
        });
        html += '</div>';
    }
    
    container.innerHTML = html;
}

// Generate Grade Projections
function generateGradeProjections(course, results) {
    let html = '<div class="projection-box"><h4><i class="fas fa-crystal-ball"></i> GRADE PROJECTIONS</h4>';
    
    // Find incomplete components (components without scores or with include=false)
    const incompleteComponents = [];
    
    // Check normal components
    const normalCriteria = course.criteria.filter(c => c.type === 'Normal');
    normalCriteria.forEach((criteria, index) => {
        const key = `comp_${index}`;
        const scores = course.componentScores[key] || [];
        const included = getIncludeStatus(key, 'component');
        
        if (scores.length === 0 || !included) {
            incompleteComponents.push({
                name: criteria.component,
                weight: criteria.weight,
                type: 'component',
                key: key
            });
        }
    });
    
    // Check exams
    const examCriteria = course.criteria.filter(c => c.type === 'Exam');
    examCriteria.forEach((criteria, index) => {
        const key = `exam_${index}`;
        const scores = course.examScores[key] || [];
        const included = getIncludeStatus(key, 'exam');
        
        if (scores.length === 0 || !included) {
            incompleteComponents.push({
                name: criteria.component,
                weight: criteria.weight,
                type: 'exam',
                key: key
            });
        }
    });
    
    // Check final exam
    if (course.settings.hasFinal && (!course.finalExam.include || course.finalExam.score === 0)) {
        incompleteComponents.push({
            name: 'Final Exam',
            weight: course.settings.finalWeight,
            type: 'final',
            key: 'final'
        });
    }
    
    if (incompleteComponents.length === 0) {
        html += '<p style="text-align: center; color: var(--text-secondary); padding: 15px;">All components have been completed!</p>';
    } else {
        // Calculate current weighted score and remaining weight
        const currentWeightedScore = results.normalScores.reduce((sum, s) => sum + s.weightedScore, 0) +
                                    results.examScores.reduce((sum, s) => sum + s.weightedScore, 0) +
                                    (results.finalScore ? results.finalScore.weightedScore : 0);
        const remainingWeight = incompleteComponents.reduce((sum, c) => sum + c.weight, 0);
        
        html += '<p style="margin-bottom: 15px; color: var(--text-secondary);">To achieve the following college grades, you need these scores on remaining assessments:</p>';
        
        // Get unique grade scales to project
        const targetGrades = ['1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00'];
        
        html += '<div style="overflow-x: auto;"><table class="data-table" style="margin-top: 10px;"><thead><tr>';
        html += '<th>Target Grade</th>';
        html += '<th>Min %</th>';
        incompleteComponents.forEach(comp => {
            html += `<th>${comp.name}<br>(${comp.weight}%)</th>`;
        });
        html += '</tr></thead><tbody>';
        
        targetGrades.forEach(targetGrade => {
            // Find minimum percentage for this grade
            const gradeEntry = course.gradeScale.find(gs => gs.grade === targetGrade);
            if (!gradeEntry) return;
            
            const targetPercentage = gradeEntry.min;
            const requiredTotalWeighted = targetPercentage * (results.totalWeightUsed + remainingWeight) / 100;
            const requiredRemainingWeighted = requiredTotalWeighted - currentWeightedScore;
            const requiredAveragePercentage = (requiredRemainingWeighted / remainingWeight) * 100;
            
            // Only show achievable grades
            if (requiredAveragePercentage > 100 || requiredAveragePercentage < 0) return;
            
            const rowClass = requiredAveragePercentage >= 90 ? 'projection-row-green' : 
               requiredAveragePercentage >= 60 ? 'projection-row-yellow' : 'projection-row-red';

            html += `<tr class="${rowClass}">`;
            html += `<td style="font-weight: bold;">${targetGrade}</td>`;
            html += `<td>${targetPercentage}%</td>`;
            
            incompleteComponents.forEach(comp => {
                const requiredScore = requiredAveragePercentage.toFixed(2);
                const scoreClass = requiredScore >= 90 ? 'text-success' : requiredScore >= 75 ? 'text-warning' : 'text-danger';
                html += `<td class="${scoreClass}" style="font-weight: bold;">${requiredScore}%</td>`;
            });
            
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
        
        // Add interpretation guide
        html += `
            <div style="margin-top: 15px; padding: 12px; background: var(--bg-secondary); border-radius: 6px; font-size: 13px;">
                <p style="margin-bottom: 8px;"><strong><i class="fas fa-info-circle"></i> How to read this table:</strong></p>
                <ul style="margin-left: 20px; margin-top: 8px;">
                    <li style="margin-bottom: 5px;"><span style="color: #228b22;">●</span> <strong>Green rows:</strong> Require 90% or higher </li>
                    <li style="margin-bottom: 5px;"><span style="color: #c4941d;">●</span> <strong>Yellow rows:</strong> Require 60-89% </li>
                    <li style="margin-bottom: 5px;"><span style="color: #d9534f;">●</span> <strong>Red rows:</strong> Require below 60% </li>
                </ul>
                <p style="margin-top: 12px; font-style: italic; color: var(--text-secondary);">
                    <i class="fas fa-lightbulb"></i> Percentages shown are the <strong>average scores</strong> you need across all remaining assessments.
                </p>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// Save/Load Handlers
function setupSaveLoadHandlers() {
    document.getElementById('download-btn').addEventListener('click', function() {
        const title = document.getElementById('save-title').value.trim() || 'GradeTracker';
        const filename = title.replace(/[^A-Za-z0-9_]/g, '_') + '.json';
        
        // Ensure each course has units before saving
        const coursesToSave = {};
        Object.keys(appState.courses).forEach(id => {
            const c = appState.courses[id];
            coursesToSave[id] = {
                ...c,
                units: typeof c.units === 'number' && c.units > 0 ? c.units : 3
            };
        });
        
        const dataToSave = {
            courses: coursesToSave,
            currentCourseId: appState.currentCourseId,
            nextCourseId: appState.nextCourseId,
            semesters: appState.semesters || {},
            nextSemesterId: appState.nextSemesterId || 1,
            semesterOrder: appState.semesterOrder || [],
            quickCourses: appState.quickCourses || {}
        };
        
        const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    });
    
    document.getElementById('upload-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Support both old format (single course) and new format (multiple courses)
                if (data.courses) {
                    // New format with multiple courses
                    appState.courses = data.courses || {};
                    // Ensure units on each course
                    Object.keys(appState.courses).forEach(id => {
                        const c = appState.courses[id];
                        if (typeof c.units !== 'number' || c.units <= 0) {
                            c.units = 3;
                        }
                    });
                    appState.currentCourseId = data.currentCourseId || Object.keys(appState.courses)[0] || null;
                    appState.nextCourseId = data.nextCourseId || appState.nextCourseId;
                    appState.semesters = data.semesters || {};
                    appState.nextSemesterId = data.nextSemesterId || appState.nextSemesterId || 1;
                    appState.semesterOrder = data.semesterOrder || Object.keys(data.semesters || {});
                    appState.quickCourses = data.quickCourses || {};
                } else {
                    // Old format - migrate to new format
                    const courseId = createNewCourse('Imported Course');
                    const course = appState.courses[courseId];
                    course.criteria = data.criteria || [];
                    course.gradeScale = data.gradeScale || [];
                    course.componentScores = data.componentScores || {};
                    course.examScores = data.examScores || {};
                    course.finalExam = data.finalExam || { score: 0, total: 100, include: true };
                    course.settings = data.settings || course.settings;
                    if (typeof course.units !== 'number' || course.units <= 0) {
                        course.units = 3;
                    }
                    setCurrentCourse(course);
                }
                
                // Update UI
                updateCourseSelector();
                updateCriteriaDisplay();
                updateGradeScaleDisplay();
                updateScoreInputs();
                updateDashboard();
                
                // Update form inputs
                const course = getCurrentCourse();
                if (course) {
                    document.getElementById('has-final').checked = course.settings.hasFinal;
                    document.getElementById('has-exemption').checked = course.settings.hasExemption;
                    document.getElementById('passing-exam-percent').value = course.settings.passingExamPercent;
                    document.getElementById('min-exams-passed').value = course.settings.minExamsPassed;
                    document.getElementById('min-prefinal-percent').value = course.settings.minPrefinalPercent;
                    document.getElementById('final-weight').value = course.settings.finalWeight;
                
                    if (course.settings.hasFinal) {
                    document.getElementById('has-exemption-label').style.display = 'block';
                }
                    if (course.settings.hasExemption) {
                    document.getElementById('exemption-settings').style.display = 'block';
                    }
                }
                
                alert('File loaded successfully!');
            } catch (error) {
                alert('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
    });
}

// Auto-save to localStorage
function saveToStorage() {
    try {
        localStorage.setItem('gradeTrackerData', JSON.stringify(appState));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

function loadFromStorage() {
    try {
        const stored = localStorage.getItem('gradeTrackerData');
        if (stored) {
            const data = JSON.parse(stored);
            
            // Support both old format (single course) and new format (multiple courses)
            if (data.courses) {
                // New format with multiple courses
                appState.courses = data.courses || {};
                // Ensure units on each course
                Object.keys(appState.courses).forEach(id => {
                    const c = appState.courses[id];
                    if (typeof c.units !== 'number' || c.units <= 0) {
                        c.units = 3;
                    }
                });
                appState.currentCourseId = data.currentCourseId || Object.keys(appState.courses)[0] || null;
                appState.nextCourseId = data.nextCourseId || appState.nextCourseId;
                appState.semesters = data.semesters || {};
                appState.nextSemesterId = data.nextSemesterId || appState.nextSemesterId || 1;
                appState.semesterOrder = data.semesterOrder || Object.keys(data.semesters || {});
                appState.quickCourses = data.quickCourses || {};
            } else if (data.criteria || data.gradeScale) {
                // Old format - migrate to new format (only if we don't already have courses)
                if (Object.keys(appState.courses).length === 0) {
                    const courseId = createNewCourse('Course 1');
                    const course = appState.courses[courseId];
                    course.criteria = data.criteria || [];
                    course.gradeScale = data.gradeScale || [];
                    course.componentScores = data.componentScores || {};
                    course.examScores = data.examScores || {};
                    course.finalExam = data.finalExam || { score: 0, total: 100, include: true };
                    course.settings = data.settings || course.settings;
                    if (typeof course.units !== 'number' || course.units <= 0) {
                        course.units = 3;
                    }
                    setCurrentCourse(course);
                }
            }
            
            // Ensure at least one course exists (without duplicating if already created)
            if (Object.keys(appState.courses).length === 0) {
                createNewCourse('Course 1');
            }
            
            updateCourseSelector();
            updateCriteriaDisplay();
            updateGradeScaleDisplay();
            updateScoreInputs();
            updateDashboard();
            
            // Update form inputs
            const course = getCurrentCourse();
            if (course && course.settings) {
                document.getElementById('has-final').checked = course.settings.hasFinal;
                document.getElementById('has-exemption').checked = course.settings.hasExemption;
                document.getElementById('passing-exam-percent').value = course.settings.passingExamPercent || 60;
                document.getElementById('min-exams-passed').value = course.settings.minExamsPassed || 2;
                document.getElementById('min-prefinal-percent').value = course.settings.minPrefinalPercent || 72;
                document.getElementById('final-weight').value = course.settings.finalWeight || 20;
                
                if (course.settings.hasFinal) {
                    document.getElementById('has-exemption-label').style.display = 'block';
                }
                if (course.settings.hasExemption) {
                    document.getElementById('exemption-settings').style.display = 'block';
                }
            }
        } else {
            // No stored data - create default course (only if none exists yet)
            if (Object.keys(appState.courses).length === 0) {
                createNewCourse('Course 1');
            }
            updateCourseSelector();
        }
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        // Create default course on error (only if none exists yet)
        if (Object.keys(appState.courses).length === 0) {
            createNewCourse('Course 1');
            updateCourseSelector();
        }
    }
}

// Auto-save on changes
setInterval(saveToStorage, 5000); // Save every 5 seconds

// Theme Management
function initializeTheme() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
    }
    
    updateThemeToggle();
    
    // Theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeToggle();
    
    // Update Chart.js colors if chart exists
    if (gradeChart) {
        updateChart();
    }
}

function updateThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const isDark = document.body.classList.contains('dark-mode');
    const text = themeToggle.querySelector('.theme-toggle-text');
    if (text) {
        text.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    }
}

// Mobile Menu Management
function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobile-overlay');
    
    if (!mobileMenuToggle || !sidebar || !mobileOverlay) return;
    
    // Toggle menu
    mobileMenuToggle.addEventListener('click', function() {
        const willOpen = !sidebar.classList.contains('mobile-open');
        sidebar.classList.toggle('mobile-open');
        mobileOverlay.classList.toggle('active');
        // Hide the toggle button while the sidebar is open so it doesn't cover the title
        mobileMenuToggle.classList.toggle('menu-open', willOpen);
    });
    
    // Close menu when overlay is clicked
    mobileOverlay.addEventListener('click', function() {
        sidebar.classList.remove('mobile-open');
        mobileOverlay.classList.remove('active');
        mobileMenuToggle.classList.remove('menu-open');
    });
    
    // Close menu when clicking a menu item (on mobile)
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('mobile-open');
                mobileOverlay.classList.remove('active');
                mobileMenuToggle.classList.remove('menu-open');
            }
        });
    });
    
    // Close menu on window resize to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('mobile-open');
            mobileOverlay.classList.remove('active');
            mobileMenuToggle.classList.remove('menu-open');
        }
    });
}

// What If Calculator Setup
function setupWhatIfCalculator() {
    // Mode selector
    document.querySelectorAll('input[name="whatif-mode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const targetSection = document.getElementById('target-grade-section');
            if (this.value === 'target') {
                targetSection.style.display = 'block';
            } else {
                targetSection.style.display = 'none';
            }
            updateWhatIfCalculator();
        });
    });
    
    // Target grade calculate button
    const targetBtn = document.getElementById('calculate-target');
    if (targetBtn) {
        targetBtn.addEventListener('click', calculateTargetGrade);
    }
}

// Update What If Calculator UI
function updateWhatIfCalculator() {
    const course = getCurrentCourse();
    const container = document.getElementById('whatif-inputs-container');
    
    if (!course.criteria || course.criteria.length === 0) {
        container.innerHTML = '<p>Please set up your grade criteria first in the Setup tab.</p>';
        updateWhatIfDisplay(null, null);
        return;
    }
    
    let html = '';
    const normalCriteria = course.criteria.filter(c => c.type === 'Normal');
    const examCriteria = course.criteria.filter(c => c.type === 'Exam');
    
    // Normal Components
    if (normalCriteria.length > 0) {
        html += '<h4 style="margin-top: 20px; margin-bottom: 15px;">Normal Components:</h4>';
        normalCriteria.forEach((criteria, index) => {
            const key = `whatif_comp_${index}`;
            html += `
                <div class="score-section" data-key="${key}">
                    <div class="score-section-header">
                        <div class="score-section-title">${criteria.component} (${criteria.weight}%)</div>
                    </div>
                    <div class="score-table-container" id="whatif-score-table-${key}"></div>
                    <div class="score-input-row">
                        <input type="number" id="whatif-score-${key}" placeholder="Score" min="0" value="0">
                        <input type="number" id="whatif-total-${key}" placeholder="Max Score" min="1" value="100">
                        <button class="btn btn-success btn-sm" onclick="addWhatIfScore('${key}', 'component')">
                            <i class="fas fa-plus"></i> Add Score
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="removeWhatIfScores('${key}', 'component')">
                            <i class="fas fa-trash"></i> Remove Selected
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    // Examinations
    if (examCriteria.length > 0) {
        html += '<h4 style="margin-top: 20px; margin-bottom: 15px;">Examinations:</h4>';
        examCriteria.forEach((criteria, index) => {
            const key = `whatif_exam_${index}`;
            html += `
                <div class="score-section" data-key="${key}">
                    <div class="score-section-header">
                        <div class="score-section-title">${criteria.component} (${criteria.weight}%)</div>
                    </div>
                    <div class="score-table-container" id="whatif-score-table-${key}"></div>
                    <div class="score-input-row">
                        <input type="number" id="whatif-score-${key}" placeholder="Score" min="0" value="0">
                        <input type="number" id="whatif-total-${key}" placeholder="Max Score" min="1" value="100">
                        <button class="btn btn-success btn-sm" onclick="addWhatIfScore('${key}', 'exam')">
                            <i class="fas fa-plus"></i> Add Score
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="removeWhatIfScores('${key}', 'exam')">
                            <i class="fas fa-trash"></i> Remove Selected
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    // Final Exam
    if (course.settings.hasFinal) {
        html += '<h4 style="margin-top: 20px; margin-bottom: 15px;">Final Exam:</h4>';
        html += `
            <div class="score-section">
                <div class="score-section-header">
                    <div class="score-section-title">Final Exam (${course.settings.finalWeight}%)</div>
                </div>
                <div class="score-input-row">
                    <input type="number" id="whatif-final-score" placeholder="Score" min="0" value="${course.finalExam.score}">
                    <input type="number" id="whatif-final-total" placeholder="Max Score" min="1" value="${course.finalExam.total}">
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Initialize with current scores (copy from actual scores)
    initializeWhatIfScores();
    
    // Setup final exam handler
    if (course.settings.hasFinal) {
        const finalScore = document.getElementById('whatif-final-score');
        const finalTotal = document.getElementById('whatif-final-total');
        
        if (finalScore) {
            finalScore.addEventListener('input', calculateWhatIfScenario);
        }
        if (finalTotal) {
            finalTotal.addEventListener('input', calculateWhatIfScenario);
        }
    }
    
    // Calculate initial scenario
    calculateWhatIfScenario();
}

// Initialize What If scores from current course scores
function initializeWhatIfScores() {
    const course = getCurrentCourse();
    
    // Initialize whatIfScores object
    if (!window.whatIfScores) {
        window.whatIfScores = {};
    }
    
    const normalCriteria = course.criteria.filter(c => c.type === 'Normal');
    const examCriteria = course.criteria.filter(c => c.type === 'Exam');
    
    // Copy normal component scores
    normalCriteria.forEach((criteria, index) => {
        const key = `whatif_comp_${index}`;
        const originalKey = `comp_${index}`;
        const scores = course.componentScores[originalKey] || [];
        // Deep copy scores array
        window.whatIfScores[key] = scores.map(s => ({ score: s.score, maxScore: s.maxScore }));
        updateWhatIfScoreTable(key, window.whatIfScores[key]);
    });
    
    // Copy exam scores
    examCriteria.forEach((criteria, index) => {
        const key = `whatif_exam_${index}`;
        const originalKey = `exam_${index}`;
        const scores = course.examScores[originalKey] || [];
        // Deep copy scores array
        window.whatIfScores[key] = scores.map(s => ({ score: s.score, maxScore: s.maxScore }));
        updateWhatIfScoreTable(key, window.whatIfScores[key]);
    });
}

// Add score to What If Calculator
function addWhatIfScore(key, type) {
    const scoreInput = document.getElementById(`whatif-score-${key}`);
    const totalInput = document.getElementById(`whatif-total-${key}`);
    
    const score = parseFloat(scoreInput.value) || 0;
    const total = parseFloat(totalInput.value) || 100;
    
    if (total <= 0) {
        alert('Max score must be greater than 0');
        return;
    }
    
    // Store in temporary state (not in course data)
    if (!window.whatIfScores) {
        window.whatIfScores = {};
    }
    if (!window.whatIfScores[key]) {
        window.whatIfScores[key] = [];
    }
    
    window.whatIfScores[key].push({ score, maxScore: total });
    
    scoreInput.value = '0';
    totalInput.value = '100';
    
    updateWhatIfScoreTable(key, window.whatIfScores[key]);
    calculateWhatIfScenario();
}

// Remove selected scores from What If Calculator
function removeWhatIfScores(key, type) {
    if (!window.whatIfScores || !window.whatIfScores[key]) return;
    
    const table = document.querySelector(`#whatif-score-table-${key} table`);
    if (!table) return;
    
    const checkboxes = table.querySelectorAll('tbody input[type="checkbox"]:checked');
    const indices = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (indices.length === 0) {
        alert('Please select scores to remove');
        return;
    }
    
    window.whatIfScores[key] = window.whatIfScores[key].filter((_, index) => !indices.includes(index));
    
    updateWhatIfScoreTable(key, window.whatIfScores[key]);
    calculateWhatIfScenario();
}

// Update What If score table
function updateWhatIfScoreTable(key, scores) {
    const container = document.getElementById(`whatif-score-table-${key}`);
    if (!container) return;
    
    if (!scores || scores.length === 0) {
        container.innerHTML = '<p style="padding: 8px; color: var(--text-secondary);">No scores entered yet.</p>';
        return;
    }
    
    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Select</th>
                    <th>Score</th>
                    <th>Max Score</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    scores.forEach((s, index) => {
        const percentage = ((s.score / s.maxScore) * 100).toFixed(2);
        html += `
            <tr>
                <td><input type="checkbox" value="${index}"></td>
                <td>${s.score}</td>
                <td>${s.maxScore}</td>
                <td>${percentage}%</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// Calculate What If Scenario
function calculateWhatIfScenario() {
    const course = getCurrentCourse();
    
    if (!course.criteria || course.criteria.length === 0) {
        return;
    }
    
    // Calculate current grade
    let currentGrade = course.results ? course.results.finalGrade : null;
    if (currentGrade === null) {
        let currentWeightedScore = 0;
        let currentWeightUsed = 0;
        
        const normalCriteria = course.criteria.filter(c => c.type === 'Normal');
        normalCriteria.forEach((criteria, index) => {
            const key = `comp_${index}`;
            const scores = course.componentScores[key] || [];
            if (scores.length > 0 && getIncludeStatus(key, 'component')) {
                const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
                const totalPossible = scores.reduce((sum, s) => sum + s.maxScore, 0);
                const percentage = (totalScore / totalPossible) * 100;
                currentWeightedScore += percentage * (criteria.weight / 100);
                currentWeightUsed += criteria.weight;
            }
        });
        
        const examCriteria = course.criteria.filter(c => c.type === 'Exam');
        examCriteria.forEach((criteria, index) => {
            const key = `exam_${index}`;
            const scores = course.examScores[key] || [];
            if (scores.length > 0 && getIncludeStatus(key, 'exam')) {
                const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
                const totalPossible = scores.reduce((sum, s) => sum + s.maxScore, 0);
                const percentage = (totalScore / totalPossible) * 100;
                currentWeightedScore += percentage * (criteria.weight / 100);
                currentWeightUsed += criteria.weight;
            }
        });
        
        if (course.settings.hasFinal && course.finalExam.include && course.finalExam.total > 0) {
            const percentage = (course.finalExam.score / course.finalExam.total) * 100;
            currentWeightedScore += percentage * (course.settings.finalWeight / 100);
            currentWeightUsed += course.settings.finalWeight;
        }
        
        currentGrade = currentWeightUsed > 0 ? (currentWeightedScore / currentWeightUsed) * 100 : 0;
    }
    
    // Calculate scenario grade from What If inputs
    let totalWeightedScore = 0;
    let totalWeightUsed = 0;
    
    const normalCriteria = course.criteria.filter(c => c.type === 'Normal');
    normalCriteria.forEach((criteria, index) => {
        const key = `whatif_comp_${index}`;
        const scores = (window.whatIfScores && window.whatIfScores[key]) || [];
        if (scores.length > 0) {
            const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
            const totalPossible = scores.reduce((sum, s) => sum + s.maxScore, 0);
            const percentage = (totalScore / totalPossible) * 100;
            totalWeightedScore += percentage * (criteria.weight / 100);
            totalWeightUsed += criteria.weight;
        }
    });
    
    const examCriteria = course.criteria.filter(c => c.type === 'Exam');
    examCriteria.forEach((criteria, index) => {
        const key = `whatif_exam_${index}`;
        const scores = (window.whatIfScores && window.whatIfScores[key]) || [];
        if (scores.length > 0) {
            const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
            const totalPossible = scores.reduce((sum, s) => sum + s.maxScore, 0);
            const percentage = (totalScore / totalPossible) * 100;
            totalWeightedScore += percentage * (criteria.weight / 100);
            totalWeightUsed += criteria.weight;
        }
    });
    
    // Final Exam
    if (course.settings.hasFinal) {
        const finalScoreInput = document.getElementById('whatif-final-score');
        const finalTotalInput = document.getElementById('whatif-final-total');
        if (finalScoreInput && finalTotalInput) {
            const finalScore = parseFloat(finalScoreInput.value) || 0;
            const finalTotal = parseFloat(finalTotalInput.value) || 100;
            if (finalTotal > 0) {
                const percentage = (finalScore / finalTotal) * 100;
                totalWeightedScore += percentage * (course.settings.finalWeight / 100);
                totalWeightUsed += course.settings.finalWeight;
            }
        }
    }
    
    const scenarioGrade = totalWeightUsed > 0 ? (totalWeightedScore / totalWeightUsed) * 100 : 0;
    
    updateWhatIfDisplay(currentGrade, scenarioGrade);
}

// Calculate Target Grade (Reverse Calculator)
function calculateTargetGrade() {
    const course = getCurrentCourse();
    const targetInput = document.getElementById('target-grade-input');
    
    if (!targetInput) return;
    
    const targetGrade = parseFloat(targetInput.value);
    if (isNaN(targetGrade) || targetGrade < 0 || targetGrade > 100) {
        alert('Please enter a valid target grade between 0 and 100');
        return;
    }
    
    // Calculate current weighted score from components that already have scores
    let fixedWeightedScore = 0;
    let fixedWeight = 0;
    let variableComponents = [];
    
    const normalCriteria = course.criteria.filter(c => c.type === 'Normal');
    normalCriteria.forEach((criteria, index) => {
        const key = `whatif_comp_${index}`;
        const scores = (window.whatIfScores && window.whatIfScores[key]) || [];
        if (scores.length > 0) {
            // Already has scores - this is fixed
            const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
            const totalPossible = scores.reduce((sum, s) => sum + s.maxScore, 0);
            const pct = (totalScore / totalPossible) * 100;
            fixedWeightedScore += pct * (criteria.weight / 100);
            fixedWeight += criteria.weight;
        } else {
            // No scores yet - this is variable
            variableComponents.push({ key, weight: criteria.weight, type: 'component', index });
        }
    });
    
    const examCriteria = course.criteria.filter(c => c.type === 'Exam');
    examCriteria.forEach((criteria, index) => {
        const key = `whatif_exam_${index}`;
        const scores = (window.whatIfScores && window.whatIfScores[key]) || [];
        if (scores.length > 0) {
            const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
            const totalPossible = scores.reduce((sum, s) => sum + s.maxScore, 0);
            const pct = (totalScore / totalPossible) * 100;
            fixedWeightedScore += pct * (criteria.weight / 100);
            fixedWeight += criteria.weight;
        } else {
            variableComponents.push({ key, weight: criteria.weight, type: 'exam', index });
        }
    });
    
    // Final Exam
    const finalScoreInput = document.getElementById('whatif-final-score');
    const finalTotalInput = document.getElementById('whatif-final-total');
    let finalVariable = false;
    if (course.settings.hasFinal) {
        if (finalScoreInput && finalTotalInput) {
            const finalScore = parseFloat(finalScoreInput.value) || 0;
            const finalTotal = parseFloat(finalTotalInput.value) || 100;
            if (finalScore > 0 && finalTotal > 0) {
                const pct = (finalScore / finalTotal) * 100;
                fixedWeightedScore += pct * (course.settings.finalWeight / 100);
                fixedWeight += course.settings.finalWeight;
            } else {
                finalVariable = true;
                variableComponents.push({ key: 'final', weight: course.settings.finalWeight, type: 'final' });
            }
        } else {
            finalVariable = true;
            variableComponents.push({ key: 'final', weight: course.settings.finalWeight, type: 'final' });
        }
    }
    
    const totalWeight = fixedWeight + variableComponents.reduce((sum, v) => sum + v.weight, 0);
    const requiredWeightedScore = targetGrade * (totalWeight / 100);
    const remainingWeightedScore = requiredWeightedScore - fixedWeightedScore;
    const variableWeight = variableComponents.reduce((sum, v) => sum + v.weight, 0);
    
    if (variableWeight === 0) {
        alert('All components already have scores. Adjust existing scores using Scenario Mode.');
        return;
    }
    
    const requiredAveragePct = (remainingWeightedScore / variableWeight) * 100;
    
    // Show required scores as suggestions
    let suggestionsHtml = '<div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;"><h5 style="margin-bottom: 10px; color: #856404;">Required Scores to Achieve Target:</h5>';
    
    variableComponents.forEach(comp => {
        if (comp.type === 'final') {
            suggestionsHtml += `<p style="margin: 5px 0; color: #856404;"><strong>Final Exam:</strong> You need approximately ${requiredAveragePct.toFixed(2)}% (or ${(requiredAveragePct * course.finalExam.total / 100).toFixed(0)}/${course.finalExam.total} points)</p>`;
        } else {
            const compName = comp.type === 'component' 
                ? course.criteria.filter(c => c.type === 'Normal')[comp.index].component
                : course.criteria.filter(c => c.type === 'Exam')[comp.index].component;
            suggestionsHtml += `<p style="margin: 5px 0; color: #856404;"><strong>${compName}:</strong> You need approximately ${requiredAveragePct.toFixed(2)}% average</p>`;
        }
    });
    
    suggestionsHtml += '</div>';
    
    const container = document.getElementById('whatif-inputs-container');
    if (container) {
        const existingSuggestions = container.querySelector('.target-suggestions');
        if (existingSuggestions) {
            existingSuggestions.remove();
        }
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'target-suggestions';
        suggestionsDiv.innerHTML = suggestionsHtml;
        container.appendChild(suggestionsDiv);
    }
    
    calculateWhatIfScenario();
}

// Update What If Display
function updateWhatIfDisplay(currentGrade, scenarioGrade) {
    const course = getCurrentCourse();
    
    // Current grade display
    const currentDisplay = document.getElementById('current-grade-display');
    if (currentDisplay) {
        const currentValue = currentGrade !== null ? currentGrade.toFixed(2) : '--';
        const currentCollege = currentGrade !== null ? getCollegeGradeForCourse(course, currentGrade) : '--';
        
        currentDisplay.innerHTML = `
            <div class="grade-value">${currentValue}${currentGrade !== null ? '%' : ''}</div>
            <div class="grade-label">Final Percentage</div>
            <div class="grade-college">${currentCollege}</div>
            <div class="grade-label">College Grade</div>
        `;
    }
    
    // Scenario grade display
    const scenarioDisplay = document.getElementById('scenario-grade-display');
    if (scenarioDisplay && scenarioGrade !== null) {
        const scenarioCollege = getCollegeGradeForCourse(course, scenarioGrade);
        const diff = currentGrade !== null ? (scenarioGrade - currentGrade) : 0;
        
        scenarioDisplay.innerHTML = `
            <div class="grade-value">${scenarioGrade.toFixed(2)}%</div>
            <div class="grade-label">Final Percentage</div>
            <div class="grade-college">${scenarioCollege}</div>
            <div class="grade-label">College Grade</div>
            ${currentGrade !== null ? `<div style="margin-top: 10px; font-size: 14px; color: ${diff > 0 ? '#228b22' : diff < 0 ? '#d9534f' : '#666'};">
                ${diff > 0 ? '+' : ''}${diff.toFixed(2)}% ${diff > 0 ? 'improvement' : diff < 0 ? 'decrease' : 'no change'}
            </div>` : ''}
        `;
    }
}

// Export functions for onclick handlers
window.addScore = addScore;
window.removeSelectedScores = removeSelectedScores;
window.addWhatIfScore = addWhatIfScore;
window.removeWhatIfScores = removeWhatIfScores;

