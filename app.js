<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <meta name="description" content="Track and calculate your academic grades with ease">
    <title>Grade Tracker</title>
    <link rel="stylesheet" href="styles.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Cinzel:wght@600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <!-- Dark Mode Toggle -->
    <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode">
        <i class="fas fa-sun"></i>
        <i class="fas fa-moon"></i>
        <span class="theme-toggle-text">Dark Mode</span>
    </button>

    <!-- Mobile Menu Toggle -->
    <button class="mobile-menu-toggle" id="mobile-menu-toggle" aria-label="Toggle menu">
        <i class="fas fa-bars"></i>
    </button>

    <!-- Mobile Overlay -->
    <div class="mobile-overlay" id="mobile-overlay"></div>

    <div class="dashboard-container">
        <!-- Sidebar -->
        <aside class="sidebar" id="sidebar">
            <div class="logo">
                <h1>Grade Tracker</h1>
            </div>
            
            <!-- Course Management Section -->
            <div class="course-management">
                <div class="course-selector-container">
                    <label for="course-selector" style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--text-primary);">Current Course:</label>
                    <select id="course-selector" class="course-selector">
                        <option value="">No courses</option>
                    </select>
                </div>
                <div class="course-selector-container">
                    <label for="course-units" style="display: block; margin-bottom: 5px; font-weight: 500; color: var(--text-primary);">Course Units:</label>
                    <input type="number" id="course-units" class="course-units-input" min="0.5" step="0.5" value="3">
                </div>
                <div class="course-actions">
                    <button id="add-course-btn" class="btn btn-success btn-sm" style="width: 100%; margin-top: 10px;">
                        <i class="fas fa-plus"></i> Add Course
                    </button>
                    <button id="rename-course-btn" class="btn btn-info btn-sm" style="width: 100%; margin-top: 5px;">
                        <i class="fas fa-edit"></i> Rename Course
                    </button>
                    <button id="delete-course-btn" class="btn btn-danger btn-sm" style="width: 100%; margin-top: 5px;">
                        <i class="fas fa-trash"></i> Delete Course
                    </button>
                </div>
            </div>
            
            <nav class="sidebar-menu">
                <a href="#" class="menu-item active" data-tab="guide">
                    <i class="fas fa-book"></i> User Guide
                </a>
                <a href="#" class="menu-item" data-tab="dashboard">
                    <i class="fas fa-tachometer-alt"></i> Dashboard
                </a>
                <a href="#" class="menu-item" data-tab="setup">
                    <i class="fas fa-cog"></i> Setup Criteria
                </a>
                <a href="#" class="menu-item" data-tab="calculate">
                    <i class="fas fa-calculator"></i> Calculate Grades
                </a>
                <a href="#" class="menu-item" data-tab="results">
                    <i class="fas fa-chart-bar"></i> Results & Analysis
                </a>
            </nav>
            <hr>
            <div class="sidebar-footer">
                <div class="form-group">
                    <label for="save-title">File Title (for Save/Load):</label>
                    <input type="text" id="save-title" placeholder="Ex. MATH_28">
                </div>
                <button id="download-btn" class="btn btn-primary">
                    <i class="fas fa-download"></i> Save Criteria & Scores
                </button>
                <hr>
                <div class="form-group">
                    <label for="upload-file">Upload Saved File:</label>
                    <input type="file" id="upload-file" accept=".json">
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Dashboard Tab -->
            <div id="dashboard-tab" class="tab-content">
                <div class="box">
                    <div class="box-header">
                        <h2>Course Dashboard</h2>
                    </div>
                    <div class="box-body">
                        <div id="dashboard-content">
                            <p>Loading courses...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- User Guide Tab -->
            <div id="guide-tab" class="tab-content active">
                <div class="box">
                    <div class="box-header">
                        <h2>Welcome to Grade Tracker</h2>
                    </div>
                    <div class="box-body">
                        <div class="guide-content">
                            <h3><i class="fas fa-graduation-cap"></i> How to Use This Application</h3>
                            
                            <!-- Step 1 -->
                            <div class="guide-step">
                                <h4><span>1</span> Setup Your Grade Criteria</h4>
                                <p><strong>Normal Components:</strong> Add your coursework components like Exercises, Quizzes, Projects, etc.</p>
                                <ul>
                                    <li>Enter the component name (e.g., 'Quizzes')</li>
                                    <li>Set the weight percentage (e.g., 20%)</li>
                                    <li>Click 'Add Component'</li>
                                </ul>
                                <p><strong>Examinations:</strong> Add your exams like Midterm, Quiz Exam, etc.</p>
                                <ul>
                                    <li>Configure exam settings (Final Exam, Exemption conditions)</li>
                                    <li>Set passing percentage for exams</li>
                                    <li>Add each exam with its weight</li>
                                </ul>
                                <p class="warning"><strong>Important:</strong> Make sure the total weight equals 100%!</p>
                            </div>

                            <!-- Step 2 -->
                            <div class="guide-step">
                                <h4><span>2</span> Setup Grade Scale</h4>
                                <p>Define how percentages convert to college grades (e.g., 1.00, 1.25, etc.)</p>
                                <ul>
                                    <li>You can use the 'Set Default UP Grade Scale' button for quick setup</li>
                                    <li>Or manually add each grade range</li>
                                    <li>Define minimum and maximum percentages for each grade</li>
                                </ul>
                            </div>

                            <!-- Step 3 -->
                            <div class="guide-step">
                                <h4><span>3</span> Enter Your Scores</h4>
                                <p>Go to the 'Calculate Grades' tab and input your scores:</p>
                                <ul>
                                    <li><strong>Normal Components:</strong> Add multiple scores for each component (e.g., Quiz 1: 45/50, Quiz 2: 38/40)</li>
                                    <li><strong>Examinations:</strong> Add exam scores in the same way</li>
                                    <li>Use the 'Add Score' button to add each entry</li>
                                    <li>You can remove scores by selecting rows and clicking 'Remove Selected'</li>
                                    <li>Uncheck 'Include in calculation' to exclude a component temporarily</li>
                                </ul>
                                <p class="tip"><strong>Tip:</strong> You can add scores progressively as you complete requirements!</p>
                            </div>

                            <!-- Step 4 -->
                            <div class="guide-step">
                                <h4><span>4</span> Calculate & Analyze</h4>
                                <p>Click the 'Calculate Final Grade' button to see your results:</p>
                                <ul>
                                    <li>View your final percentage and college grade</li>
                                    <li>See detailed breakdown of all components</li>
                                    <li>Check exemption eligibility (if applicable)</li>
                                    <li>View grade projections for incomplete components</li>
                                    <li>Get personalized recommendations</li>
                                </ul>
                            </div>

                            <!-- Step 5 -->
                            <div class="guide-step">
                                <h4><span>5</span> Save & Load Your Work</h4>
                                <p><strong>Save:</strong> Enter a file title in the sidebar and click 'Save Criteria & Scores'</p>
                                <ul>
                                    <li>Saves all your criteria, scores, and grade scale</li>
                                    <li>Downloaded as a JSON file</li>
                                </ul>
                                <p><strong>Load:</strong> Use 'Upload Saved File' to restore your previous work</p>
                                <ul>
                                    <li>All your settings and scores will be restored</li>
                                    <li>Continue where you left off!</li>
                                </ul>
                            </div>

                            <!-- Features -->
                            <div class="guide-features">
                                <h4><i class="fas fa-star"></i> Key Features</h4>
                                <div class="features-grid">
                                    <ul>
                                        <li><i class="fas fa-check-circle"></i> Automatic grade calculations</li>
                                        <li><i class="fas fa-check-circle"></i> Flexible grade criteria setup</li>
                                        <li><i class="fas fa-check-circle"></i> Multiple scores per component</li>
                                    </ul>
                                    <ul>
                                        <li><i class="fas fa-check-circle"></i> Exemption eligibility checker</li>
                                        <li><i class="fas fa-check-circle"></i> Grade projections & predictions</li>
                                        <li><i class="fas fa-check-circle"></i> Save/Load functionality</li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Quick Start -->
                            <div class="guide-quickstart">
                                <h4><i class="fas fa-rocket"></i> Quick Start</h4>
                                <p><strong>New User?</strong> Follow these steps:</p>
                                <ol>
                                    <li>Go to 'Setup Criteria' tab</li>
                                    <li>Click 'Set Default UP Grade Scale' (or setup your own)</li>
                                    <li>Add your components and exams</li>
                                    <li>Go to 'Calculate Grades' tab</li>
                                    <li>Enter your scores and click 'Calculate Final Grade'</li>
                                    <li>View results in 'Results & Analysis' tab!</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Setup Criteria Tab -->
            <div id="setup-tab" class="tab-content">
                <div class="box">
                    <div class="box-header">
                        <h2>Grade Criteria Setup</h2>
                    </div>
                    <div class="box-body">
                        <!-- Normal Components -->
                        <h4>Normal Components (Exercises, Quizzes, Projects, etc.):</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="component-name">Component Name:</label>
                                <input type="text" id="component-name" placeholder="Ex. Exercises, Quizzes">
                            </div>
                            <div class="form-group">
                                <label for="component-weight">Weight (%):</label>
                                <input type="number" id="component-weight" min="0" max="100" value="0">
                            </div>
                            <div class="form-group">
                                <button id="add-component" class="btn btn-success">
                                    <i class="fas fa-plus"></i> Add Component
                                </button>
                            </div>
                        </div>
                        <div id="criteria-table-container"></div>
                        <div id="total-weight-display"></div>
                        <button id="clear-criteria" class="btn btn-warning">
                            <i class="fas fa-trash"></i> Clear All
                        </button>

                        <hr>

                        <!-- Examinations -->
                        <h4>Examinations:</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="has-final" checked>
                                    Does this course have a Final Exam?
                                </label>
                            </div>
                            <div class="form-group">
                                <label id="has-exemption-label" style="display: none;">
                                    <input type="checkbox" id="has-exemption">
                                    Are there exemption conditions for the Final Exam?
                                </label>
                            </div>
                            <div class="form-group">
                                <label for="passing-exam-percent">Passing Percentage for Exams (%):</label>
                                <input type="number" id="passing-exam-percent" min="0" max="100" value="60">
                            </div>
                        </div>

                        <div id="exemption-settings" style="display: none;">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="min-exams-passed">Minimum Exams to Pass:</label>
                                    <input type="number" id="min-exams-passed" min="1" value="2">
                                </div>
                                <div class="form-group">
                                    <label for="min-prefinal-percent">Minimum Prefinal Standing (%):</label>
                                    <input type="number" id="min-prefinal-percent" min="0" max="100" value="72">
                                </div>
                                <div class="form-group">
                                    <label for="final-weight">Final Exam Weight (%):</label>
                                    <input type="number" id="final-weight" min="0" max="100" value="20">
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="exam-name">Exam Name:</label>
                                <input type="text" id="exam-name" placeholder="Ex. Midterm, Prefinals">
                            </div>
                            <div class="form-group">
                                <label for="exam-weight">Exam Weight (%):</label>
                                <input type="number" id="exam-weight" min="0" max="100" value="0">
                            </div>
                            <div class="form-group">
                                <button id="add-exam" class="btn btn-success">
                                    <i class="fas fa-plus"></i> Add Exam
                                </button>
                            </div>
                        </div>
                        <div id="exam-table-container"></div>
                    </div>
                </div>

                <div class="box">
                    <div class="box-header">
                        <h2>College Grade Scale Setup</h2>
                    </div>
                    <div class="box-body">
                        <h4>Define your college grade scale:</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="grade-college">College Grade:</label>
                                <select id="grade-college">
                                    <option value="1.00">1.00</option>
                                    <option value="1.25">1.25</option>
                                    <option value="1.50">1.50</option>
                                    <option value="1.75">1.75</option>
                                    <option value="2.00">2.00</option>
                                    <option value="2.25">2.25</option>
                                    <option value="2.50">2.50</option>
                                    <option value="2.75">2.75</option>
                                    <option value="3.00">3.00</option>
                                    <option value="4.00">4.00</option>
                                    <option value="5.00">5.00</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="min-percent">Min %:</label>
                                <input type="number" id="min-percent" value="95">
                            </div>
                            <div class="form-group">
                                <label for="max-percent">Max %:</label>
                                <input type="number" id="max-percent" value="100">
                            </div>
                            <div class="form-group">
                                <button id="add-grade" class="btn btn-info">
                                    <i class="fas fa-plus"></i> Add Grade
                                </button>
                            </div>
                        </div>
                        <div id="grade-scale-table-container"></div>
                        <div class="button-group">
                            <button id="clear-grades" class="btn btn-warning">
                                <i class="fas fa-trash"></i> Clear Grade Scale
                            </button>
                            <button id="set-default-grades" class="btn btn-info">
                                <i class="fas fa-magic"></i> Set Default UP Grade Scale
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Calculate Grades Tab -->
            <div id="calculate-tab" class="tab-content">
                <div class="box">
                    <div class="box-header">
                        <h2>Enter Your Scores</h2>
                    </div>
                    <div class="box-body">
                        <div id="score-inputs-container">
                            <p>Please set up your grade criteria first in the Setup tab.</p>
                        </div>
                        <button id="calculate-final" class="btn btn-primary btn-lg">
                            <i class="fas fa-calculator"></i> Calculate Final Grade
                        </button>
                    </div>
                </div>
            </div>

            <!-- Results Tab -->
            <div id="results-tab" class="tab-content">
                <div class="value-boxes">
                    <div class="value-box" id="final-percentage-box">
                        <div class="value-box-icon">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="value-box-content">
                            <div class="value-box-value">0%</div>
                            <div class="value-box-subtitle">Final Percentage</div>
                        </div>
                    </div>
                    <div class="value-box" id="college-grade-box">
                        <div class="value-box-icon">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <div class="value-box-content">
                            <div class="value-box-value">No Grade</div>
                            <div class="value-box-subtitle">College Grade</div>
                        </div>
                    </div>
                    <div class="value-box" id="grade-status-box">
                        <div class="value-box-icon">
                            <i class="fas fa-flag"></i>
                        </div>
                        <div class="value-box-content">
                            <div class="value-box-value">No Status</div>
                            <div class="value-box-subtitle">Status</div>
                        </div>
                    </div>
                </div>

                <div class="results-grid">
                    <div class="box">
                        <div class="box-header">
                            <h2>Grade Breakdown</h2>
                        </div>
                        <div class="box-body">
                            <div id="breakdown-table-container"></div>
                        </div>
                    </div>
                    <div class="box">
                        <div class="box-header">
                            <h2>Grade Distribution</h2>
                        </div>
                        <div class="box-body">
                            <canvas id="grade-chart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="box">
                    <div class="box-header">
                        <h2>Performance Analysis & Projections</h2>
                    </div>
                    <div class="box-body">
                        <div id="performance-analysis-container"></div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script src="app.js"></script>
</body>
</html>

