// Application State
let appState = {
    courses: {}, // Object to store multiple courses: { courseId: courseData }
    currentCourseId: null, // ID of currently active course
    nextCourseId: 1 // Counter for generating unique course IDs
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
    
    // Setup criteria handlers
    setupCriteriaHandlers();
    
    // Setup grade scale handlers
    setupGradeScaleHandlers();
    
    // Setup score entry handlers
    setupScoreEntryHandlers();
    
    // Setup calculate button
    document.getElementById('calculate-final').addEventListener('click', calculateFinalGrade);
    
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
    // Add course button
    document.getElementById('add-course-btn').addEventListener('click', function() {
        const courseName = prompt('Enter course name:', `Course ${Object.keys(appState.courses).length + 1}`);
        if (courseName && courseName.trim()) {
            createNewCourse(courseName.trim());
            updateCourseSelector();
            updateDashboard();
            updateAllDisplays();
        }
    });

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
    
    // Rename course button
    document.getElementById('rename-course-btn').addEventListener('click', function() {
        if (!appState.currentCourseId) return;
        
        const currentCourse = getCurrentCourse();
        const newName = prompt('Enter new course name:', currentCourse.name);
        if (newName && newName.trim() && newName.trim() !== currentCourse.name) {
            currentCourse.name = newName.trim();
            setCurrentCourse(currentCourse);
            updateCourseSelector();
            updateDashboard();
        }
    });
    
    // Delete course button
    document.getElementById('delete-course-btn').addEventListener('click', function() {
        if (!appState.currentCourseId) return;
        
        const currentCourse = getCurrentCourse();
        if (confirm(`Are you sure you want to delete "${currentCourse.name}"?`)) {
            if (deleteCourse(appState.currentCourseId)) {
                updateCourseSelector();
                updateDashboard();
                updateAllDisplays();
            }
        }
    });
    
    // Course selector change
    document.getElementById('course-selector').addEventListener('change', function() {
        const courseId = this.value;
        if (courseId && appState.courses[courseId]) {
            appState.currentCourseId = courseId;
            updateAllDisplays();
        }
    });
}

// Update course selector dropdown
function updateCourseSelector() {
    const selector = document.getElementById('course-selector');
    selector.innerHTML = '';
    
    const courseIds = Object.keys(appState.courses);
    if (courseIds.length === 0) {
        selector.innerHTML = '<option value="">No courses</option>';
        return;
    }
    
    courseIds.forEach(courseId => {
        const course = appState.courses[courseId];
        const option = document.createElement('option');
        option.value = courseId;
        option.textContent = course.name;
        if (courseId === appState.currentCourseId) {
            option.selected = true;
        }
        selector.appendChild(option);
    });
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
}

// Update Dashboard
function updateDashboard() {
    const container = document.getElementById('dashboard-content');
    if (!container) return;
    
    const courseIds = Object.keys(appState.courses);
    
    if (courseIds.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px;">No courses yet. Click "Add Course" to get started!</p>';
        return;
    }
    
    let html = '<div class="dashboard-summary">';
    
    // Calculate semester GWA (units-weighted average of college grades)
    let totalWeightedGrades = 0;
    let totalUnits = 0;
    const courseCards = [];
    
    courseIds.forEach(courseId => {
        const course = appState.courses[courseId];
        const isActive = courseId === appState.currentCourseId;
        
        let finalGrade = null;
        let collegeGrade = null;
        let percentage = null;
        
        if (course.results) {
            percentage = course.results.finalGrade;
            if (course.gradeScale.length > 0) {
                collegeGrade = getCollegeGradeForCourse(course, percentage);
            }
        }
        
        courseCards.push({
            courseId,
            course,
            isActive,
            percentage,
            collegeGrade
        });
        
        const units = typeof course.units === 'number' && course.units > 0 ? course.units : 0;

        if (collegeGrade && units > 0 && !isNaN(parseFloat(collegeGrade)) && parseFloat(collegeGrade) <= 5.0) {
            const gradeValue = parseFloat(collegeGrade);
            totalWeightedGrades += gradeValue * units;
            totalUnits += units;
        }
    });
    
    const semesterGWA = totalUnits > 0 ? (totalWeightedGrades / totalUnits).toFixed(2) : null;
    
    // Display semester summary
    if (semesterGWA !== null) {
        html += `
            <div class="semester-summary-box">
                <h3><i class="fas fa-graduation-cap"></i> Semester GWA</h3>
                <div class="semester-gpa-value">${semesterGWA}</div>
                <p>Based on total of ${totalUnits} unit${totalUnits !== 1 ? 's' : ''}</p>
            </div>
        `;
    }
    
    html += '<h3 style="margin-top: 20px; margin-bottom: 15px;"><i class="fas fa-book"></i> Your Courses</h3>';
    html += '<div class="courses-grid">';
    
    courseCards.forEach(({ courseId, course, isActive, percentage, collegeGrade }) => {
        html += `
            <div class="course-card ${isActive ? 'active' : ''}" data-course-id="${courseId}" onclick="switchToCourse('${courseId}')">
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
    
    html += '</div></div>';
    container.innerHTML = html;
}

// Switch to a course
function switchToCourse(courseId) {
    if (appState.courses[courseId]) {
        appState.currentCourseId = courseId;
        document.getElementById('course-selector').value = courseId;
        updateAllDisplays();
        updateDashboard();
        // Switch to setup tab
        document.querySelector('.menu-item[data-tab="setup"]').click();
    }
}

// Export for onclick handler
window.switchToCourse = switchToCourse;

// Helper to get college grade for a specific course
function getCollegeGradeForCourse(course, finalPct) {
    if (!course.gradeScale || course.gradeScale.length === 0) return 'No Scale Set';
    
    const finalPctFloored = Math.floor(finalPct * 100) / 100;
    const sortedScale = [...course.gradeScale].sort((a, b) => b.min - a.min);
    
    for (let i = 0; i < sortedScale.length; i++) {
        const gs = sortedScale[i];
        
        if (gs.grade === '4.00') {
            return '4.00';
        } else if (gs.grade === '5.00') {
            if (finalPctFloored <= gs.max) return '5.00';
        } else {
            if (finalPctFloored >= gs.min && (gs.max === 0 || finalPctFloored <= gs.max)) {
                return gs.grade;
            }
        }
    }
    
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
    });
    
    // Clear criteria
    document.getElementById('clear-criteria').addEventListener('click', function() {
        if (confirm('Are you sure you want to clear all criteria?')) {
            const course = getCurrentCourse();
            course.criteria = [];
            course.componentScores = {};
            course.examScores = {};
            setCurrentCourse(course);
            updateCriteriaDisplay();
            updateScoreInputs();
        }
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
    const normalCriteria = course.criteria.filter(c => c.type === 'Normal');
    const examCriteria = course.criteria.filter(c => c.type === 'Exam');
    
    // Display normal components
    let html = '<table class="data-table"><thead><tr><th>Component</th><th>Weight (%)</th></tr></thead><tbody>';
    normalCriteria.forEach((c, index) => {
        html += `<tr><td>${c.component}</td><td>${c.weight}%</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('criteria-table-container').innerHTML = html;
    
    // Display exams
    html = '<table class="data-table"><thead><tr><th>Exam</th><th>Weight (%)</th></tr></thead><tbody>';
    examCriteria.forEach(c => {
        html += `<tr><td>${c.component}</td><td>${c.weight}%</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('exam-table-container').innerHTML = html;
    
    // Update total weight
    let totalWeight = course.criteria.reduce((sum, c) => sum + c.weight, 0);
    if (course.settings.hasFinal) {
        totalWeight += course.settings.finalWeight;
    }
    
    const warningText = Math.abs(totalWeight - 100) < 0.01 ? ' (Perfect!)' : ' (Warning: Should equal 100%)';
    const finalText = course.settings.hasFinal ? ` + Final Exam: ${course.settings.finalWeight}% = ${totalWeight}%` : '';
    document.getElementById('total-weight-display').innerHTML = 
        `<h4>Total Weight: ${totalWeight - (course.settings.hasFinal ? course.settings.finalWeight : 0)}%${finalText}${warningText}</h4>`;
}

// Grade Scale Setup Handlers
function setupGradeScaleHandlers() {
    // Add grade
    document.getElementById('add-grade').addEventListener('click', function() {
        const course = getCurrentCourse();
        const grade = document.getElementById('grade-college').value;
        const min = parseFloat(document.getElementById('min-percent').value);
        const max = parseFloat(document.getElementById('max-percent').value);
        
        if (min < 0 || max < min) {
            alert('Please enter valid min and max percentages');
            return;
        }
        
        course.gradeScale.push({ grade, min, max });
        setCurrentCourse(course);
        updateGradeScaleDisplay();
    });
    
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
            { grade: '1.00', min: 95, max: 100 },
            { grade: '1.25', min: 90, max: 94.9999 },
            { grade: '1.50', min: 85, max: 89.9999 },
            { grade: '1.75', min: 80, max: 84.9999 },
            { grade: '2.00', min: 76, max: 79.9999 },
            { grade: '2.25', min: 72, max: 75.9999 },
            { grade: '2.50', min: 68, max: 71.9999 },
            { grade: '2.75', min: 64, max: 67.9999 },
            { grade: '3.00', min: 60, max: 63.9999 },
            { grade: '4.00', min: 55, max: 59.9999 },
            { grade: '5.00', min: 0, max: 54.9999 }
        ];
        setCurrentCourse(course);
        updateGradeScaleDisplay();
    });
}

// Update Grade Scale Display
function updateGradeScaleDisplay() {
    const course = getCurrentCourse();
    let html = '<table class="data-table"><thead><tr><th>Grade</th><th>Min (%)</th><th>Max (%)</th></tr></thead><tbody>';
    course.gradeScale.forEach(gs => {
        html += `<tr><td>${gs.grade}</td><td>${gs.min}</td><td>${gs.max}</td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('grade-scale-table-container').innerHTML = html;
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
    
    updateScoreTable(key, type);
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
    document.querySelector('.menu-item[data-tab="results"]').click();
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
    
    // Exemption Analysis
    if (appState.settings.hasFinal && appState.settings.hasExemption) {
        const exemptionColor = results.exemptEligible ? '#006400' : '#600015';
        const exemptionIcon = results.exemptEligible ? 'check-circle' : 'times-circle';
        const exemptionBg = results.exemptEligible ? '#d4edda' : '#f8d7da';
        
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
            nextCourseId: appState.nextCourseId
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
            } else if (data.criteria || data.gradeScale) {
                // Old format - migrate to new format
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
            
            // Ensure at least one course exists
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
            // No stored data - create default course
            createNewCourse('Course 1');
            updateCourseSelector();
        }
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        // Create default course on error
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
        sidebar.classList.toggle('mobile-open');
        mobileOverlay.classList.toggle('active');
    });
    
    // Close menu when overlay is clicked
    mobileOverlay.addEventListener('click', function() {
        sidebar.classList.remove('mobile-open');
        mobileOverlay.classList.remove('active');
    });
    
    // Close menu when clicking a menu item (on mobile)
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('mobile-open');
                mobileOverlay.classList.remove('active');
            }
        });
    });
    
    // Close menu on window resize to desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('mobile-open');
            mobileOverlay.classList.remove('active');
        }
    });
}

// Export functions for onclick handlers
window.addScore = addScore;
window.removeSelectedScores = removeSelectedScores;
