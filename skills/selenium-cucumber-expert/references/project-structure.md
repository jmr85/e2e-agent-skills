# Project Structure — Selenium + Cucumber + Java

Choose the complexity level that matches your project size and team. Start simple and evolve — it's much easier to add layers than to untangle a prematurely complex structure.

---

## Level 1 — Basic

For: solo projects, PoCs, learning, or projects with fewer than 10 scenarios.

```
my-project/
├── pom.xml
└── src/
    └── test/
        ├── java/
        │   └── com/mycompany/tests/
        │       ├── pages/
        │       │   └── LoginPage.java
        │       ├── steps/
        │       │   └── LoginSteps.java
        │       ├── support/
        │       │   ├── DriverManager.java
        │       │   └── Hooks.java
        │       └── runners/
        │           └── TestRunner.java
        └── resources/
            ├── features/
            │   └── login.feature
            └── cucumber.properties
```

---

## Level 2 — Intermediate (recommended default)

For: team projects, 10–50 scenarios, multiple features grouped by domain.

```
my-project/
├── pom.xml
└── src/
    └── test/
        ├── java/
        │   └── com/mycompany/tests/
        │       ├── pages/
        │       │   ├── BasePage.java
        │       │   ├── LoginPage.java
        │       │   ├── HomePage.java
        │       │   └── checkout/
        │       │       └── CheckoutPage.java
        │       ├── steps/
        │       │   ├── LoginSteps.java
        │       │   ├── HomeSteps.java
        │       │   └── CheckoutSteps.java
        │       ├── support/
        │       │   ├── DriverManager.java
        │       │   ├── Hooks.java
        │       │   ├── TestContext.java        ← shared state object injected via DI
        │       │   └── ExtentReportManager.java
        │       ├── runners/
        │       │   ├── TestRunner.java         ← runs all tests
        │       │   └── SmokeTestRunner.java    ← runs @smoke tag only
        │       └── utils/
        │           ├── ConfigReader.java
        │           └── WaitHelper.java
        └── resources/
            ├── features/
            │   ├── auth/
            │   │   └── login.feature
            │   └── checkout/
            │       └── purchase_flow.feature
            ├── config/
            │   ├── config.properties           ← base URL, timeouts, browser
            │   └── config-staging.properties
            └── cucumber.properties
```

---

## Level 3 — Advanced

For: 50+ scenarios, multiple environments, Screenplay pattern, CI/CD integration.

```
my-project/
├── pom.xml
└── src/
    └── test/
        ├── java/
        │   └── com/mycompany/tests/
        │       ├── pages/                          ← POM layer
        │       │   ├── BasePage.java
        │       │   └── [domain pages]
        │       ├── screenplay/                     ← Screenplay layer
        │       │   ├── abilities/
        │       │   │   └── BrowseTheWeb.java
        │       │   ├── tasks/
        │       │   │   ├── Login.java
        │       │   │   └── AddToCart.java
        │       │   ├── questions/
        │       │   │   ├── CurrentUrl.java
        │       │   │   └── PageTitle.java
        │       │   └── interactions/
        │       │       └── Enter.java
        │       ├── steps/
        │       ├── support/
        │       │   ├── DriverManager.java
        │       │   ├── Hooks.java
        │       │   ├── TestContext.java
        │       │   └── ExtentReportManager.java
        │       ├── runners/
        │       │   ├── TestRunner.java
        │       │   ├── SmokeTestRunner.java
        │       │   └── RegressionTestRunner.java
        │       └── utils/
        │           ├── ConfigReader.java
        │           ├── WaitHelper.java
        │           └── ScreenshotHelper.java
        └── resources/
            ├── features/
            │   └── [organized by domain]
            ├── config/
            │   ├── config.properties
            │   ├── config-staging.properties
            │   └── config-prod.properties
            ├── testdata/
            │   └── users.json
            └── cucumber.properties
```

---

## Level 4 — Enterprise

For: very large suites (100+ scenarios), multiple teams, multi-module Maven, Docker/Grid integration.

```
my-project/                                     ← parent Maven project
├── pom.xml                                     ← parent POM with dependency management
├── core/                                       ← shared module (drivers, utils, base pages)
│   ├── pom.xml
│   └── src/main/java/com/mycompany/core/
│       ├── driver/
│       │   └── DriverManager.java
│       ├── config/
│       │   └── ConfigReader.java
│       └── utils/
│           ├── WaitHelper.java
│           └── ScreenshotHelper.java
├── web-tests/                                  ← web automation module
│   ├── pom.xml
│   └── src/test/
│       ├── java/com/mycompany/web/
│       │   ├── pages/
│       │   ├── screenplay/
│       │   ├── steps/
│       │   ├── support/
│       │   └── runners/
│       └── resources/
│           ├── features/
│           └── config/
├── api-tests/                                  ← API testing module (optional)
│   └── ...
├── docker/
│   ├── docker-compose.yml                      ← Selenium Grid setup
│   └── selenium-grid.yml
└── .github/
    └── workflows/
        ├── ci.yml
        └── regression.yml
```

---

## Decision Guide

| Question | Answer → Level |
|---|---|
| Is this a proof of concept or learning exercise? | Level 1 |
| Single team, single application, clear feature boundaries? | Level 2 |
| Multiple environments, need Screenplay for complex flows? | Level 3 |
| Multiple teams, shared infrastructure, Grid execution? | Level 4 |

> Start at Level 2 for most real projects. You can always extract a `core/` module later when the need arises.

---

## Key files at any level

| File | Purpose |
|---|---|
| `DriverManager.java` | Creates/destroys `WebDriver`, uses `ThreadLocal` for parallel safety |
| `TestContext.java` | Shared state bag injected into step classes via PicoContainer |
| `Hooks.java` | Cucumber `@Before`/`@After` hooks for setup/teardown and screenshots |
| `TestRunner.java` | `@Suite` class that points to feature files and glue code |
| `ConfigReader.java` | Reads `config.properties` (base URL, browser, timeout) |
| `cucumber.properties` | Cucumber engine config (parallel mode, plugin output, tags) |
