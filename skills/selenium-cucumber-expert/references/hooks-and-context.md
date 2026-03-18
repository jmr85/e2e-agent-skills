# Hooks & Dependency Injection — Cucumber Java

Cucumber hooks let you run code before and after each scenario (or the entire suite). Combined with PicoContainer for dependency injection, they are the backbone of a clean, parallel-safe test framework.

---

## Dependency Injection with PicoContainer

PicoContainer is the simplest DI option for Cucumber Java. It creates a fresh instance of each shared class per scenario and injects it via constructors automatically — no annotations needed.

**How it works:**
1. Add `cucumber-picocontainer` to your `pom.xml`
2. Declare a shared class (e.g., `TestContext`) that holds scenario-scoped state
3. Any step class or hook class that declares `TestContext` in its constructor receives the same instance within that scenario

```java
// TestContext.java — one instance per scenario, shared across all step classes
package com.mycompany.tests.support;

import org.openqa.selenium.WebDriver;

public class TestContext {
    private WebDriver driver;
    private String currentUser;

    public WebDriver getDriver() { return driver; }
    public void setDriver(WebDriver driver) { this.driver = driver; }

    public String getCurrentUser() { return currentUser; }
    public void setCurrentUser(String user) { this.currentUser = user; }
}
```

---

## Hooks class

```java
package com.mycompany.tests.support;

import io.cucumber.java.After;
import io.cucumber.java.AfterAll;
import io.cucumber.java.Before;
import io.cucumber.java.BeforeAll;
import io.cucumber.java.Scenario;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

public class Hooks {

    private final TestContext context;

    // PicoContainer injects TestContext
    public Hooks(TestContext context) {
        this.context = context;
    }

    @Before(order = 1)   // order controls execution when multiple @Before exist; lower = first
    public void setUp(Scenario scenario) {
        String browser = ConfigReader.get("browser", "chrome");
        WebDriver driver = DriverManager.createDriver(browser);
        context.setDriver(driver);
    }

    @After(order = 1)   // higher order = runs first in teardown
    public void tearDown(Scenario scenario) {
        WebDriver driver = context.getDriver();

        // Attach screenshot on failure — automatic, no need to add to every step
        if (scenario.isFailed() && driver != null) {
            byte[] screenshot = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
            scenario.attach(screenshot, "image/png", "Screenshot on failure");
        }

        if (driver != null) {
            driver.quit();
        }
    }

    // @BeforeAll / @AfterAll run once for the entire suite (not per scenario)
    // Use for: starting/stopping a proxy, seeding a database, configuring logging
    @BeforeAll
    public static void globalSetUp() {
        // Example: configure logging or start test infrastructure
    }

    @AfterAll
    public static void globalTearDown() {
        // Example: generate aggregate reports
    }
}
```

> **Why `order` matters:** When you have multiple `@Before` hooks (e.g., one in `Hooks`, one in `AuthHooks`), the `order` value determines which runs first. `@Before(order = 0)` runs before `@Before(order = 1)`. For `@After`, the opposite: higher order runs first (so you can take a screenshot before the driver is quit).

---

## DriverManager — ThreadLocal for parallel safety

`ThreadLocal<WebDriver>` ensures each test thread gets its own WebDriver instance. Without it, parallel scenarios share a single browser window and collide:

```java
package com.mycompany.tests.support;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;

public class DriverManager {

    // One WebDriver per thread — parallel-safe
    private static final ThreadLocal<WebDriver> driverThread = new ThreadLocal<>();

    public static WebDriver createDriver(String browser) {
        WebDriver driver;
        switch (browser.toLowerCase()) {
            case "firefox":
                WebDriverManager.firefoxdriver().setup();
                driver = new FirefoxDriver();
                break;
            case "chrome":
            default:
                WebDriverManager.chromedriver().setup();
                ChromeOptions options = new ChromeOptions();
                if (Boolean.parseBoolean(ConfigReader.get("headless", "false"))) {
                    options.addArguments("--headless=new");
                }
                options.addArguments("--window-size=1920,1080");
                driver = new ChromeDriver(options);
                break;
        }
        driverThread.set(driver);
        return driver;
    }

    public static WebDriver getDriver() {
        return driverThread.get();
    }

    public static void quitDriver() {
        WebDriver driver = driverThread.get();
        if (driver != null) {
            driver.quit();
            driverThread.remove();   // prevents memory leaks in thread pools
        }
    }
}
```

---

## Tag-scoped hooks

Run a hook only for scenarios with a specific tag:

```java
// Only runs before scenarios tagged @authenticated
@Before(value = "@authenticated", order = 2)
public void loginBeforeAuthenticatedScenarios(Scenario scenario) {
    loginPage.loginAs(
        ConfigReader.get("test.user.email"),
        ConfigReader.get("test.user.password")
    );
    // Optionally save cookies to context for reuse
}
```

---

## ConfigReader

A simple utility to read configuration from `config.properties`:

```java
package com.mycompany.tests.utils;

import java.io.InputStream;
import java.util.Properties;

public class ConfigReader {

    private static final Properties props = new Properties();

    static {
        try (InputStream in = ConfigReader.class
                .getClassLoader()
                .getResourceAsStream("config/config.properties")) {
            if (in != null) props.load(in);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load config.properties", e);
        }
    }

    public static String get(String key) {
        // System properties override config file — useful for CI
        return System.getProperty(key, props.getProperty(key));
    }

    public static String get(String key, String defaultValue) {
        String value = get(key);
        return (value != null && !value.isEmpty()) ? value : defaultValue;
    }
}
```

Example `config.properties`:
```properties
base.url=https://staging.example.com
browser=chrome
headless=false
implicit.wait=0
explicit.wait=10
test.user.email=testuser@example.com
test.user.password=TestPass123!
```

Override at runtime:
```bash
mvn verify -Dbase.url=https://prod.example.com -Dheadless=true
```

---

## Hook execution order (summary)

```
@BeforeAll (suite level, static)
  └── Scenario 1:
        @Before (order 0)
        @Before (order 1)
        ...steps...
        @After (order 1 — highest runs first)
        @After (order 0)
  └── Scenario 2: (same)
@AfterAll (suite level, static)
```
