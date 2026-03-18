# Reporting — ExtentReports + Cucumber Native Reports

Good reports are what turn a failing test run from "something broke" into "here's exactly what broke, when, and what the page looked like at the time." Set up reporting once and it pays dividends every time the suite runs.

---

## Cucumber native reporters

Configure native formatters in `TestRunner.java` (or `cucumber.properties`):

```java
@Suite
@IncludeEngines("cucumber")
@SelectClasspathResource("features")
@ConfigurationParameter(key = GLUE_PROPERTY_NAME, value = "com.mycompany.tests")
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME, value =
    "pretty," +
    "html:target/cucumber-reports/cucumber.html," +
    "json:target/cucumber-reports/cucumber.json," +
    "junit:target/cucumber-reports/cucumber.xml"
)
public class TestRunner {}
```

Or in `cucumber.properties`:
```properties
cucumber.plugin=pretty, html:target/cucumber-reports/cucumber.html, json:target/cucumber-reports/cucumber.json
cucumber.publish.quiet=true
```

| Plugin | Output | Use case |
|---|---|---|
| `pretty` | Console | Readable output during local development |
| `html:path` | HTML file | Human-readable report, shareable |
| `json:path` | JSON file | Input for ExtentReports or other tools |
| `junit:path` | XML file | CI/CD test result parsing (Jenkins, GitHub Actions) |

---

## ExtentReports integration

ExtentReports produces rich HTML reports with scenario status, step details, tags, screenshots, and charts.

### ExtentReportManager.java

```java
package com.mycompany.tests.support;

import com.aventstack.extentreports.ExtentReports;
import com.aventstack.extentreports.ExtentTest;
import com.aventstack.extentreports.reporter.ExtentSparkReporter;
import com.aventstack.extentreports.reporter.configuration.Theme;

public class ExtentReportManager {

    private static ExtentReports extent;
    private static final ThreadLocal<ExtentTest> testThread = new ThreadLocal<>();

    public static ExtentReports getInstance() {
        if (extent == null) {
            ExtentSparkReporter reporter = new ExtentSparkReporter("target/extent-reports/report.html");
            reporter.config().setTheme(Theme.DARK);
            reporter.config().setDocumentTitle("Automation Test Report");
            reporter.config().setReportName("Selenium + Cucumber Tests");

            extent = new ExtentReports();
            extent.attachReporter(reporter);
            extent.setSystemInfo("OS", System.getProperty("os.name"));
            extent.setSystemInfo("Java", System.getProperty("java.version"));
            extent.setSystemInfo("Browser", ConfigReader.get("browser", "chrome"));
        }
        return extent;
    }

    public static ExtentTest getTest() {
        return testThread.get();
    }

    public static void setTest(ExtentTest test) {
        testThread.set(test);
    }

    public static void flush() {
        if (extent != null) {
            extent.flush();
        }
    }
}
```

### Wire ExtentReports into Hooks

```java
@Before(order = 0)
public void startExtentTest(Scenario scenario) {
    ExtentTest test = ExtentReportManager.getInstance()
        .createTest(scenario.getName())
        .assignCategory(scenario.getSourceTagNames().toArray(new String[0]));
    ExtentReportManager.setTest(test);
}

@After(order = 0)
public void finishExtentTest(Scenario scenario) {
    ExtentTest test = ExtentReportManager.getTest();
    if (test != null) {
        if (scenario.isFailed()) {
            // Embed screenshot in ExtentReports
            byte[] screenshot = ((TakesScreenshot) context.getDriver())
                .getScreenshotAs(OutputType.BYTES);
            String base64 = Base64.getEncoder().encodeToString(screenshot);
            test.addScreenCaptureFromBase64String(base64, "Failure Screenshot");
            test.fail(scenario.getName() + " FAILED");
        } else {
            test.pass(scenario.getName() + " PASSED");
        }
    }
}

// In @AfterAll (static method, so no DI):
@AfterAll
public static void flushReports() {
    ExtentReportManager.flush();
}
```

---

## Screenshots on failure — automatic embed in Cucumber report

This attaches the screenshot directly to the Cucumber HTML/JSON report (no extra setup needed beyond this):

```java
@After
public void takeScreenshotOnFailure(Scenario scenario) {
    if (scenario.isFailed()) {
        byte[] screenshot = ((TakesScreenshot) context.getDriver())
            .getScreenshotAs(OutputType.BYTES);
        // Embeds in Cucumber's own HTML report
        scenario.attach(screenshot, "image/png", "Screenshot on failure");
    }
}
```

---

## Logging with SLF4J + Logback

Add a `logback-test.xml` to `src/test/resources/` for clean, timestamped console output:

```xml
<configuration>
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss} [%-5level] %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>

    <!-- Reduce Selenium's verbose logging -->
    <logger name="org.openqa.selenium" level="WARN"/>
</configuration>
```

Use in any class:
```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoginPage extends BasePage {
    private static final Logger log = LoggerFactory.getLogger(LoginPage.class);

    public void clickLogin() {
        log.info("Clicking login button");
        click(LOGIN_BUTTON);
    }
}
```

---

## Report output locations

```
target/
├── cucumber-reports/
│   ├── cucumber.html         ← Cucumber native HTML
│   ├── cucumber.json         ← JSON (can feed other tools)
│   └── cucumber.xml          ← JUnit XML (for CI)
└── extent-reports/
    └── report.html           ← ExtentReports rich report
```

Open reports locally:
```bash
# macOS/Linux
open target/extent-reports/report.html

# Windows
start target\extent-reports\report.html
```

---

## CI report artifacts (GitHub Actions)

See `references/ci-cd.md` for the full workflow. The key step:

```yaml
- name: Upload test reports
  uses: actions/upload-artifact@v4
  if: always()   # upload even if tests fail
  with:
    name: test-reports
    path: |
      target/cucumber-reports/
      target/extent-reports/
```
