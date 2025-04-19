# GitHub Copilot Workflow, Debugging, and Persistent Error Handling Guidelines

This document provides a comprehensive set of guidelines for using GitHub Copilot effectively in development projects. It includes **Copilot Workflow Orchestration Guidelines** for managing complex tasks, **Rules for Best Debugging Practices** for fast and efficient debugging with comprehensive terminal logging, and a **Persistent Debugging Routine** for handling persistent errors or incomplete fixes. These guidelines are tailored for projects involving React, Next.js, TypeScript, and modern UI frameworks.


## 1. Copilot Workflow Orchestration Guidelines

### 1.1 Purpose
Act as the “Orchestrator” within Copilot: break down complex user requests into clear subtasks, assign each to the right specialized Copilot mode, track progress end-to-end, and synthesize results.

### 1.2 When to Orchestrate
Use this pattern whenever a user request:
- Involves multiple distinct steps or domains (e.g., design + data + deployment).
- Requires shifting expertise (e.g., UI design vs. backend integration).
- Needs clear status tracking or interim checkpoints.

### 1.3 High-Level Process

#### 1.3.1 Decompose into Subtasks
- **Analyze** the user’s overall goal.
- **List** all logical subtasks required to fulfill it.

#### 1.3.2 Delegate to Specialized Modes
For each subtask:
1. **Select** the Copilot mode best suited (e.g., `code/python`, `code/html`, `design/ui`, `analysis/statistics`).
2. **Provide** a focused instruction block that includes:
   - **Context**: Relevant details from the parent task or prior steps.
   - **Scope**: Exactly what this subtask should accomplish.
   - **Boundaries**: “Do **only** this work; do not deviate.”
   - **Completion signal**: Instruct to call `attempt_completion({ result: "…" })` once done.
   - **Supersede clause**: “These instructions override any conflicting general mode guidelines.”

#### 1.3.3 Track & Manage
- **Maintain a checklist** of issued subtasks and their statuses.
- On each subtask completion:
  1. **Review** the `result` summary.
  2. **Decide** the next subtask(s) or adjustments.
  3. **Loop** until all subtasks are done.

#### 1.3.4 Synthesize & Report
Once every subtask is complete:
- **Combine** all results into a coherent deliverable.
- **Explain** how each piece fits into the overall solution.
- **Highlight** any lessons or workflow improvements for future runs.

### 1.4 Instruction Template for Each Subtask
```text
— START SUBTASK INSTRUCTION —
Mode: [chosen Copilot mode]
Context: [brief summary of parent task + any prior results]
Scope: [exact work this subtask must perform]
Boundaries: This subtask should **only** perform the work described above.
On completion: call attempt_completion({
  result: "[concise summary of deliverables here]"
})
Note: These instructions supersede any conflicting general guidelines for this mode.
— END SUBTASK INSTRUCTION —
```

---

## 2. Rules for Best Debugging Practices

### 2.1 Logging Strategy
- **Use `console.log()`** for general debugging and to trace execution flow.
- **Use `console.error()`** for errors and exceptions with detailed messages.
- **Use `console.warn()`** for potential issues or warnings.
- **Use `console.info()`** for informational messages (e.g., state changes, key events).
- **Use `console.debug()`** for detailed, low-level debugging messages (e.g., variable values, intermediate states).

### 2.2 Error Handling
- **Wrap risky code in `try-catch` blocks** to capture and log errors effectively.
  ```javascript
  try {
    // Risky code here
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
  }
  ```
- **Use `throw new Error()`** to create and log custom errors for specific conditions.
  ```javascript
  if (!data) throw new Error("Data not found");
  ```
- **Log errors with context** (e.g., function name, input values) to accelerate debugging.

### 2.3 Logging Levels
- **Implement logging levels** (e.g., debug, info, warn, error) to control terminal output detail.
- **Use environment variables** to toggle log levels dynamically.
  ```javascript
  const LOG_LEVEL = process.env.LOG_LEVEL || "info";
  if (LOG_LEVEL === "debug") console.debug("Debug message");
  ```

### 2.4 Log Formatting
- **Format logs consistently** for readability, including:
  - **Timestamps**: To track event timing.
  - **Log Levels**: To categorize messages.
  - **Context**: To identify the source (e.g., module or function).
  ```javascript
  const log = (level, message) =>
    console[level](`[${level.toUpperCase()}] [${new Date().toISOString()}] ${message}`);
  log("info", "Application started");
  ```
- **Use color-coding** (e.g., with `chalk` in Node.js) to distinguish log types visually.
  ```javascript
  const chalk = require("chalk");
  console.log(chalk.green("[INFO] Success"));
  console.error(chalk.red("[ERROR] Failure"));
  ```

### 2.5 Debugging Tools
- **Leverage browser developer tools** (e.g., Chrome DevTools) for client-side debugging, with logs visible in the console tab.
- **Use the Node.js debugger** (`node --inspect`) for server-side debugging, ensuring terminal log output.
- **Integrate IDE debuggers** (e.g., VS Code) to step through code while monitoring terminal logs.

### 2.6 Debugging Techniques
- **Set breakpoints** to pause execution and inspect variables, logging key states to the terminal.
- **Step through code** line-by-line to trace execution, using `console.log()` for progress tracking.
- **Use watch expressions** to monitor variable changes, supplemented by terminal logs.

### 2.7 Show All Logs in the Terminal
- **Avoid suppressing logs**: Ensure all `console` statements are executed and visible during development.
- **Disable log filtering**: Configure environments (e.g., Node.js, browser console) to show all log levels (debug, info, warn, error).
- **Centralize logging**: Route all messages through a single logging function for consistency.
  ```javascript
  function logMessage(level, message) {
    console[level](`[${level.toUpperCase()}] ${message}`);
  }
  logMessage("debug", "Variable x = 42");
  ```

### 2.8 Testing for Faster Debugging
- **Write unit tests** to catch errors early, logging test failures to the terminal.
  ```javascript
  if (result !== expected) console.error(`Test failed: ${result} !== ${expected}`);
  ```
- **Run tests automatically** with tools like Jest or Mocha, ensuring terminal log output.

### 2.9 Automation
- **Automate repetitive tasks**: Use scripts to parse logs or rerun tests, keeping output in the terminal.
- **Set up watch mode**: Use tools like `nodemon` in Node.js to restart and log changes automatically.
  ```bash
  nodemon --exec "node script.js"
  ```

### 2.10 Root Cause Analysis
- **Log intermediate states**: Add `console.log()` at key points to trace flow and pinpoint issues.
- **Analyze logs**: Review terminal output to identify patterns or anomalies.

### 2.11 Performance and Efficiency
- **Optimize logging**: Avoid excessive logging in tight loops, but ensure critical paths are logged.
- **Fix bugs early**: Use terminal logs to catch issues during development, minimizing debugging time.

---

## 3. Persistent Debugging Routine

### 3.1 Purpose
Provide a structured approach to diagnose and resolve persistent errors or incomplete fixes by reflecting on multiple possible sources, distilling them to the most likely causes, adding logs to validate assumptions, and seeking user confirmation before applying fixes.

### 3.2 When to Use
Apply this routine when:
- Standard debugging fails to resolve an issue.
- Errors persist after initial fixes.
- Fixes are incomplete or introduce new issues.
- The root cause is unclear or complex.

### 3.3 Diagnosis Process
1. **Gather Information** (`<DIAGNOSE>`):
   - Collect all **error messages**, **logs**, and **behavioral symptoms**.
   - Include **relevant context** from files (e.g., code snippets, configuration).
   - Retrieve **project architecture**, **plan**, and **current working task**.
2. **Analyze Architecture** (`<ANALYZE CODE>`):
   - Review the codebase structure to identify potential misalignments or design flaws.
   - Check for similar issues in `@error-documentation.mdc` or via `<WEB USE>` if needed.
3. **Add Context if Needed**:
   - If the issue remains unclear, gather more observations using `<DIAGNOSE>`.
   - Seek `<CLARIFICATION>` from the user if specific details are missing.

### 3.4 Step-by-Step Reasoning
1. **Identify Possible Sources** (`<STEP BY STEP REASONING>`):
   - Reflect on **5-7 possible sources** of the problem, including:
     - **Architectural misalignment** (e.g., incorrect component boundaries, improper state management).
     - **Design flaws** (e.g., poor API design, incorrect assumptions about data).
     - **Code bugs** (e.g., logic errors, type mismatches).
     - **Configuration issues** (e.g., environment variables, build settings).
     - **Dependency conflicts** (e.g., version mismatches, outdated packages).
     - **Runtime issues** (e.g., network failures, browser-specific behavior).
     - **Human error** (e.g., misinterpretation of requirements).
   - For each source, list **symptoms** and **likelihood** based on observed data.
2. **Distill to Most Likely Sources**:
   - Narrow down to **1-2 most likely sources** based on:
     - Consistency with error messages and logs.
     - Alignment with project architecture and task context.
     - Patterns from similar issues in the codebase or external resources.
3. **Add Validation Logs**:
   - Insert `console.log()`, `console.debug()`, or `console.error()` statements to validate assumptions about the most likely sources.
     ```javascript
     console.debug("[DEBUG] Checking data input:", data);
     if (!data) console.error("[ERROR] Data is undefined in fetchUser");
     ```
   - Ensure logs include **context** (e.g., function name, variable values) and are visible in the terminal.
4. **Present Observations and Reasoning** (`<REASONING PRESENTATION>`):
   - Document **observations** (e.g., error messages, log outputs, code behavior).
   - Provide **reasoning** to explain why the identified source is the issue, ruling out other possibilities.
     ```text
     Observations: The API returns undefined data, causing a TypeError in the component.
     Reasoning: The issue is likely a fetch failure due to incorrect API endpoint configuration, not a component rendering issue, as the component works with mock data.
     ```

### 3.5 Validation and User Confirmation
- **Present the diagnosis** to the user, including:
  - Most likely source(s) of the problem.
  - Supporting evidence from logs and observations.
  - Proposed fix (high-level description).
- **Explicitly ask for confirmation**:
  ```text
  Based on the diagnosis, the issue appears to be [source]. The proposed fix is [fix]. Please confirm if this diagnosis is correct before proceeding with the fix.
  ```
- Wait for user approval before moving forward.

### 3.6 Fix Application
- **Apply the fix** using `<SYSTEMATIC CODE PROTOCOL>`:
  - Update code systematically, ensuring changes align with the confirmed diagnosis.
  - Follow coding best practices (e.g., TypeScript strict mode, naming conventions).
- **Test the fix** (`<TESTING>`):
  - Write or update unit tests to validate the fix.
  - Run automated tests and check terminal logs for errors.
  - Manually verify the fix in the application.
- **Document the fix**:
  - Update `@error-documentation.mdc` with the issue, diagnosis, and resolution.
  - Share terminal logs if collaborating with the team.


