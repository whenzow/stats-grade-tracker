# Grade Tracker

A web-based grade calculator and tracker application converted from R Shiny. Track your academic grades, calculate final scores, and analyze your performance.

## Features

- **Flexible Grade Criteria Setup**: Add normal components (exercises, quizzes, projects) and examinations with custom weights
- **Grade Scale Configuration**: Set up custom grade scales or use the default UP Grade Scale
- **Multiple Score Entry**: Add multiple scores for each component/exam
- **Automatic Calculations**: Automatic weighted grade calculations
- **Exemption Eligibility**: Check if you're eligible for final exam exemption
- **Grade Projections**: See what scores you need to achieve target grades
- **Visual Analytics**: Charts and breakdown tables for grade analysis
- **Save/Load Functionality**: Save your work and load it later (localStorage and file export)

## Getting Started

1. Open `index.html` in a modern web browser
2. Navigate through the tabs using the sidebar menu:
   - **User Guide**: Learn how to use the application
   - **Setup Criteria**: Configure your grade criteria and grade scale
   - **Calculate Grades**: Enter your scores
   - **Results & Analysis**: View your final grades and analysis

## Usage

### Step 1: Setup Grade Criteria

1. Go to the **Setup Criteria** tab
2. Add normal components (e.g., Exercises, Quizzes, Projects):
   - Enter component name
   - Enter weight percentage
   - Click "Add Component"
3. Configure exam settings:
   - Check if the course has a Final Exam
   - Set exemption conditions if applicable
   - Add individual exams with their weights
4. Ensure total weight equals 100%

### Step 2: Setup Grade Scale

1. In the same tab, scroll to "College Grade Scale Setup"
2. Either:
   - Click "Set Default UP Grade Scale" for quick setup, or
   - Manually add grade ranges (Grade, Min %, Max %)

### Step 3: Enter Scores

1. Go to the **Calculate Grades** tab
2. For each component/exam:
   - Enter individual scores (Score / Max Score)
   - Click "Add Score" to add each entry
   - Select rows and click "Remove Selected" to delete scores
   - Uncheck "Include in calculation" to temporarily exclude a component
3. Enter final exam score if applicable

### Step 4: Calculate and View Results

1. Click "Calculate Final Grade" button
2. Go to **Results & Analysis** tab to see:
   - Final percentage and college grade
   - Detailed breakdown of all components
   - Grade distribution chart
   - Exemption eligibility (if applicable)
   - Grade projections for incomplete components
   - Performance recommendations

### Save and Load

- **Save**: Enter a file title in the sidebar and click "Save Criteria & Scores"
  - Downloads a JSON file with all your data
- **Load**: Use "Upload Saved File" to restore your previous work
- **Auto-save**: The application automatically saves to browser localStorage every 5 seconds

## Technical Details

- **HTML5**: Structure and layout
- **CSS3**: Styling with custom fonts (Poppins, Cinzel) matching the original design
- **Vanilla JavaScript**: All functionality implemented without frameworks
- **Chart.js**: For grade distribution visualization
- **LocalStorage**: For automatic saving
- **File API**: For save/load functionality

## Browser Compatibility

Works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Notes

- The application uses localStorage for automatic saving
- Data is exported/imported as JSON files
- All calculations match the original R Shiny application logic
- The design closely matches the original application's theme (burgundy and green colors)


