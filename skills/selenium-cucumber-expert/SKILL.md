---
name: selenium-cucumber-expert
description: Use when writing E2E tests with Selenium WebDriver and Cucumber BDD in Java, setting up BDD
  test infrastructure with Maven or Gradle, writing Gherkin feature files, implementing step definitions
  in Java, configuring Page Object Model or Screenplay Pattern, setting up parallel execution, generating
  ExtentReports or Cucumber native reports, or integrating tests with GitHub Actions and Docker/Selenium Grid.
  Invoke for Cucumber Java, Selenium 4, Gherkin, Given When Then, Page Object, Screenplay, TestNG, JUnit,
  WebDriverManager, PicoContainer, behavior driven development in Java, BDD Java, selenium grid, docker
  selenium, parallel testing Java, or any automation framework setup involving Java + browser testing.
  Make sure to use this skill whenever the user asks about Selenium, Cucumber, or Java-based browser
  automation, even if they just say "pruebas automatizadas en Java" or "test E2E con Java".
license: MIT
metadata:
  author: https://github.com/jmr85
  version: "1.0.0"
  domain: quality
  triggers: Selenium, Cucumber, Java, BDD, Gherkin, feature file, step definitions, Given When Then,
    Page Object Model, POM, Screenplay, WebDriver, WebDriverManager, TestNG, JUnit, PicoContainer,
    ExtentReports, Allure, Maven, Gradle, parallel execution, Selenium Grid, Docker, GitHub Actions,
    pruebas automatizadas, test E2E, automatizacion web
  role: specialist
  scope: testing
  output-format: code
  related-skills: playwright-cucumber-expert, playwright-automation-expert
---

**Role:** Senior BDD automation engineer specializing in Selenium WebDriver 4 + Cucumber 7+ with Java. You design maintainable, scalable test frameworks that follow clean architecture principles and industry best practices.

---

## When to Use Each Pattern

Choose the pattern based on project complexity and team size:

| Project size | Pattern | Why |
|---|---|---|
| Small / solo | **Page Object Model** | Simple, well-known, low ceremony |
| Medium / team | **POM + Screenplay** hybrid | POM for pages, Screenplay for complex flows |
| Large / enterprise | **Screenplay Pattern** | Actor-centric, highly composable, testable |

> When in doubt, start with POM. Screenplay shines when scenarios involve multiple users, complex state machines, or when you need to reuse business-level tasks across many scenarios.

---

## Core Workflow

Follow this sequence when building or extending a Selenium+Cucumber+Java project:

1. **Understand the scope** — clarify which browsers, environments, and user flows need coverage before writing anything
2. **Set up the Maven project** — see `references/maven-setup.md` for the correct dependency stack (Selenium 4, Cucumber 7, WebDriverManager, DI framework)
3. **Define project structure** — choose a complexity level from `references/project-structure.md` and scaffold it (use `scripts/scaffold-selenium-bdd.mjs`)
4. **Write feature files** — craft expressive Gherkin scenarios following the guidelines in `references/feature-files.md`
5. **Implement Page Objects or Screenplay** — use `references/page-object-model.md` for POM or `references/screenplay-pattern.md` for Screenplay
6. **Wire up step definitions and hooks** — see `references/step-definitions.md` and `references/hooks-and-context.md` for dependency injection patterns
7. **Configure reporting and CI/CD** — set up ExtentReports + Cucumber native reporters (`references/reporting.md`), parallel execution (`references/parallel-execution.md`), and GitHub Actions / Docker Grid (`references/ci-cd.md`)

---

## Reference Guide

Load the relevant reference file when the user's question falls into that topic. Don't load all references at once — read only what you need.

| Topic | Reference File | Load When |
|---|---|---|
| Maven/Gradle setup | `references/maven-setup.md` | Adding dependencies, configuring plugins, version conflicts |
| Project structure | `references/project-structure.md` | Folder layout by complexity level (Basic → Enterprise) |
| Feature files | `references/feature-files.md` | Writing Gherkin: Scenario, Outline, Background, DataTable, DocString |
| Step definitions | `references/step-definitions.md` | Implementing Given/When/Then in Java, parameter types, state sharing |
| Page Object Model | `references/page-object-model.md` | POM classes, BasePage, Fluent API, explicit waits |
| Screenplay Pattern | `references/screenplay-pattern.md` | Actors, Abilities, Tasks, Questions, Interactions |
| Hooks & DI | `references/hooks-and-context.md` | Cucumber hooks, PicoContainer/Guice for WebDriver injection |
| Reporting | `references/reporting.md` | ExtentReports, Cucumber HTML/JSON/JUnit, screenshots on failure |
| Parallel execution | `references/parallel-execution.md` | TestNG/JUnit Platform, ThreadLocal WebDriver, Maven Surefire/Failsafe |
| CI/CD | `references/ci-cd.md` | GitHub Actions workflows, Docker Compose, Selenium Grid 4 |
| Anti-patterns | `references/anti-patterns.md` | Common mistakes and how to fix them |

---

## Key Principles

These constraints exist because Selenium tests are notoriously brittle — these practices are the difference between a suite that works for years versus one that collapses in weeks:

- **Use `ThreadLocal<WebDriver>`** for parallel execution. Sharing a single WebDriver instance across threads causes race conditions and intermittent failures.
- **Never use `Thread.sleep()`**. Use `WebDriverWait` with `ExpectedConditions` — it's faster, more reliable, and communicates intent clearly.
- **Inject WebDriver via DI (PicoContainer or Guice)**. Don't use static WebDriver or singletons — this couples your steps and makes parallel execution impossible.
- **Put all locators in Page Objects, never in step definitions**. When a UI changes, you fix it in one place.
- **Use `By` locators as constants** in your Page Objects. String-based locators scattered through steps make maintenance nightmarish.
- **Assertions belong in `Then` steps only**. `Given` sets state, `When` performs actions — mixing assertions into them breaks the BDD contract and makes failures hard to diagnose.
- **One scenario per business behavior**. Don't cram multiple unrelated flows into one scenario — it makes failures ambiguous and steps impossible to reuse.
- **Screenshots on failure** should be automatic, via the `After` hook — not manually added to every step.

---

## Quick-Start Templates

For common requests, use the assets in `assets/` as starting points:

| Need | Asset |
|---|---|
| Base `pom.xml` | `assets/pom-base/pom.xml` |
| Sample feature file | `assets/features/sample.feature` |
| Step definitions class | `assets/steps/SampleSteps.java` |
| Page Object example | `assets/pages/LoginPage.java` |
| Cucumber runner | `assets/runners/TestRunner.java` |
| WebDriver manager | `assets/support/DriverManager.java` |
| Hooks class | `assets/support/Hooks.java` |

For full project scaffolding, run:
```bash
node scripts/scaffold-selenium-bdd.mjs --level 2 --name my-project
```
Levels: `1` = Basic, `2` = Intermediate, `3` = Advanced, `4` = Enterprise
