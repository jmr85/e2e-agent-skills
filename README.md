# E2E Agent Skills

A collection of skills focused on end-to-end automation for AI agents.

Includes best practices, scalable structure, recommended patterns, and scaffolding commands for professional E2E projects.

---

## 📦 Installation

You can install the skill directly from GitHub using:

```bash
npx skills add jmr85/e2e-agent-skills
```
or

```bash
npx skills add https://github.com/jmr85/e2e-agent-skills --skill playwright-automation-expert
```

or install the BDD / Cucumber skill:

```bash
npx skills add https://github.com/jmr85/e2e-agent-skills --skill playwright-cucumber-expert
```

or install the Selenium + Cucumber + Java skill:

```bash
npx skills add https://github.com/jmr85/e2e-agent-skills --skill selenium-cucumber-expert
```

---

## 🛠 Requirements

- Node.js 18+
- npm or pnpm
- CLI compatible with `skills` (for example OpenCode, Claude Code, or other compatible agents)

---

## 🚀 Usage

Once installed, the agent will be able to:

**playwright-automation-expert**
- Generate professional Playwright project structures
- Apply the Page Object Model
- Create feature-based organized tests
- Implement anti-flaky best practices
- Apply naming conventions
- Generate scaffolding for new modules
- Suggest debugging strategies

**playwright-cucumber-expert**
- Set up `@cucumber/cucumber` + Playwright + TypeScript
- Write Gherkin `.feature` files (Scenario, Outline, Background, DataTable)
- Implement `Given`/`When`/`Then` step definitions
- Configure the `World` class for browser lifecycle management
- Write `Before`/`After` hooks with screenshot embedding on failure
- Configure `cucumber.js` with multi-profile execution (smoke, regression, CI)
- Integrate Cucumber into a GitHub Actions CI pipeline

**selenium-cucumber-expert**
- Set up Selenium WebDriver 4 + Cucumber 7+ in Java (Maven-first, Gradle alternative)
- Build maintainable frameworks with Page Object Model or Screenplay Pattern
- Implement clean Given/When/Then step definitions with DI (PicoContainer/Guice)
- Configure safe parallel execution with `ThreadLocal<WebDriver>`
- Generate reports with ExtentReports + Cucumber HTML/JSON/JUnit
- Integrate CI with GitHub Actions and Selenium Grid 4 / Docker

Example usage inside the agent:

```
Create a professional Playwright structure using the playwright-automation-expert skill
```

Or:

```
Generate an E2E test applying the Page Object Model and anti-flaky best practices
```

The skill will automatically load when you mention terms related to:

**playwright-automation-expert:**
- Playwright
- E2E test / end-to-end
- Browser testing / automation
- Page Object Model
- API testing / REST API
- Project structure / folder layout
- Visual testing

**playwright-cucumber-expert:**
- Cucumber, BDD, Gherkin
- Feature files, step definitions
- Given / When / Then
- Scenario, Scenario Outline, Background
- `@cucumber/cucumber`
- Behaviour-driven development

**selenium-cucumber-expert:**
- Selenium, Selenium 4, WebDriver, Java test automation
- Cucumber Java, Gherkin, Given/When/Then
- Page Object Model (POM), Screenplay Pattern
- Maven, Gradle, JUnit Platform, TestNG
- ThreadLocal WebDriver, parallel execution
- ExtentReports, Cucumber HTML/JSON/JUnit reports
- Selenium Grid, Docker, GitHub Actions

---

## 📂 Recommended Structure

```
e2e/
 ├── tests/
 │    ├── login/
 │    ├── checkout/
 │    └── profile/
 ├── pages/
 ├── fixtures/
 ├── utils/
 └── playwright.config.ts
```

---

## 🧠 What the Skills Include

### playwright-automation-expert
- Guides for debugging flaky tests
- Feature-based organization
- Naming conventions
- Proper use of locators and selectors
- Scalable Page Object Model
- Best practices for API testing with Playwright
- Common anti-patterns and how to avoid them

### playwright-cucumber-expert
- Cucumber + Playwright setup and installation guide
- Gherkin feature file patterns
- Step definition implementation with World typing
- Browser lifecycle management via hooks
- Multi-profile `cucumber.js` configuration
- HTML / JSON / JUnit reporting with screenshot embedding
- GitHub Actions CI integration

### selenium-cucumber-expert
- Selenium 4 + Cucumber 7+ setup for Java with Maven as primary build tool
- Four project complexity levels (Basic, Intermediate, Advanced, Enterprise)
- Guidance for both Page Object Model and Screenplay Pattern
- Hooks + dependency injection patterns for scalable step design
- Parallel execution with JUnit Platform and TestNG option
- ExtentReports plus Cucumber native HTML/JSON/JUnit reporting
- GitHub Actions + Selenium Grid 4 / Docker integration
- Scaffolding script (`scripts/scaffold-selenium-bdd.mjs`) and reusable assets

---

## ✅ Repository Notes

- `skills/selenium-cucumber-expert/evals/evals.json` is intentionally included for future skill benchmarking and regression checks.
- Evaluation run artifacts/workspaces are local development outputs and should not be versioned.

---

## 🔧 Scaffold Example

The skill can automatically generate:

- Base project structure
- Initial Playwright configuration
- Recommended npm scripts
- Page Object templates
- Test templates

---

## 📈 Promoted Best Practices

✔ Use of stable locators  
✔ Avoid `waitForTimeout`  
✔ Proper fixture usage  
✔ Clear separation between test and page logic  
✔ Strategic retries  
✔ Debugging with tracing and screenshots  

---

## 📝 License

MIT License - See [LICENSE](https://github.com/jmr85/e2e-agent-skills/blob/main/LICENSE) file for details.
