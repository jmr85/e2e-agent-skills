# Parallel Execution — Selenium + Cucumber Java

Running scenarios in parallel dramatically reduces suite execution time, but requires careful setup to avoid shared-state bugs. The key insight: **each thread must have its own WebDriver instance** — that's what `ThreadLocal<WebDriver>` and PicoContainer's per-scenario scoping give you.

---

## How Cucumber parallelism works

Cucumber Java uses the JUnit Platform to distribute scenarios across threads. You configure the number of threads and the parallelization strategy (by scenario or by feature file).

---

## Option 1 — JUnit Platform (recommended for Cucumber 7+)

### Step 1: `cucumber.properties`

```properties
cucumber.execution.parallel.enabled=true
cucumber.execution.parallel.config.strategy=dynamic
# dynamic = uses available CPU cores * multiplier (good default)
# fixed = fixed thread count (set cucumber.execution.parallel.config.fixed.parallelism=N)
cucumber.execution.parallel.config.dynamic.factor=1
cucumber.publish.quiet=true
```

For fixed thread count:
```properties
cucumber.execution.parallel.enabled=true
cucumber.execution.parallel.config.strategy=fixed
cucumber.execution.parallel.config.fixed.parallelism=4
```

### Step 2: Maven Failsafe plugin

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-failsafe-plugin</artifactId>
    <version>3.2.5</version>
    <configuration>
        <includes>
            <include>**/*Runner.java</include>
        </includes>
        <!-- Pass system properties to test JVM -->
        <systemPropertyVariables>
            <browser>${browser}</browser>
            <headless>${headless}</headless>
        </systemPropertyVariables>
    </configuration>
    <executions>
        <execution>
            <goals>
                <goal>integration-test</goal>
                <goal>verify</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

Run:
```bash
mvn clean verify -Dbrowser=chrome -Dheadless=true
```

---

## Option 2 — TestNG runner

If your team prefers TestNG, use the `cucumber-testng` dependency and a `TestNG.xml` suite file:

```xml
<!-- pom.xml dependency -->
<dependency>
    <groupId>io.cucumber</groupId>
    <artifactId>cucumber-testng</artifactId>
    <version>${cucumber.version}</version>
    <scope>test</scope>
</dependency>
```

```java
// AbstractTestNGCucumberTests automatically parallelizes by scenario
import io.cucumber.testng.AbstractTestNGCucumberTests;
import io.cucumber.testng.CucumberOptions;
import org.testng.annotations.DataProvider;

@CucumberOptions(
    features = "src/test/resources/features",
    glue = "com.mycompany.tests",
    plugin = {
        "pretty",
        "html:target/cucumber-reports/cucumber.html",
        "json:target/cucumber-reports/cucumber.json"
    },
    tags = "not @wip"
)
public class ParallelTestRunner extends AbstractTestNGCucumberTests {

    @Override
    @DataProvider(parallel = true)   // this enables parallel execution
    public Object[][] scenarios() {
        return super.scenarios();
    }
}
```

`testng.xml` for controlling thread count:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE suite SYSTEM "https://testng.org/testng-1.0.dtd">
<suite name="Selenium BDD Suite" parallel="methods" thread-count="4">
    <test name="All Tests">
        <classes>
            <class name="com.mycompany.tests.runners.ParallelTestRunner"/>
        </classes>
    </test>
</suite>
```

---

## ThreadLocal WebDriver — the essential safety net

Without `ThreadLocal`, parallel scenarios share one browser window and fail randomly. With it, each thread gets its own:

```java
// DriverManager.java (see full version in references/hooks-and-context.md)
private static final ThreadLocal<WebDriver> driverThread = new ThreadLocal<>();

public static WebDriver createDriver(String browser) {
    // ... create driver ...
    driverThread.set(driver);
    return driver;
}

public static void quitDriver() {
    WebDriver driver = driverThread.get();
    if (driver != null) {
        driver.quit();
        driverThread.remove();  // critical: prevents memory leaks
    }
}
```

**PicoContainer already handles per-scenario scoping** — `TestContext` is created fresh for each scenario, so `context.getDriver()` always returns the driver for the current scenario's thread.

---

## Parallel-safe patterns

| Pattern | Safe? | Notes |
|---|---|---|
| `ThreadLocal<WebDriver>` | Yes | One driver per thread |
| Static `WebDriver` field | No | Shared across all threads |
| Instance `WebDriver` in step class | Yes (with PicoContainer) | PicoContainer creates new instances per scenario |
| Reading from `config.properties` | Yes | Read-only, no mutation |
| Writing to a shared file during test | No | Use separate file per scenario or aggregate at end |
| Static `ExtentTest` | No | Use `ThreadLocal<ExtentTest>` — see `references/reporting.md` |

---

## Scenario ordering — `@NotThreadSafe`

If some scenarios must not run in parallel (e.g., they modify shared test data), annotate the runner or test class:

```java
import org.junit.platform.commons.annotation.Testable;

// This runner will run serially even if parallel is enabled globally
@NotThreadSafe
public class DataSetupRunner { ... }
```

Alternatively, use a `@serial` tag and a separate runner with parallelism disabled:
```properties
# In a serial-runner-specific cucumber.properties:
cucumber.execution.parallel.enabled=false
```

---

## Quick checklist for parallel execution

- [ ] `ThreadLocal<WebDriver>` in `DriverManager`
- [ ] `ThreadLocal<ExtentTest>` in `ExtentReportManager`
- [ ] No static mutable state in step or page classes
- [ ] `driverThread.remove()` called in `@After` hook (prevents memory leaks)
- [ ] `cucumber.execution.parallel.enabled=true` in `cucumber.properties`
- [ ] Headless mode enabled in CI (`-Dheadless=true`)
- [ ] Test data is isolated per scenario (no scenario modifies data that another reads)
