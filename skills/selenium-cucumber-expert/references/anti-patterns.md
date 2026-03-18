# Anti-Patterns — Selenium + Cucumber Java

These are the most common mistakes in Java-based Selenium automation and the reasoning behind why they cause problems. Understanding the "why" helps you avoid the whole class of mistakes, not just the specific examples.

---

## 1. Using `Thread.sleep()` for synchronization

**The problem:**
```java
// Fragile: either waits too long (slow) or not long enough (flaky)
driver.findElement(By.id("submit")).click();
Thread.sleep(3000);
driver.findElement(By.id("success-message")).getText();
```

**Why it breaks:** The wait duration is arbitrary. On a slow network or under load, 3 seconds may not be enough. On a fast machine, you're always wasting time. Test flakiness follows.

**The fix:**
```java
// Waits exactly as long as needed, up to the timeout
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
WebElement message = wait.until(
    ExpectedConditions.visibilityOfElementLocated(By.id("success-message"))
);
String text = message.getText();
```

---

## 2. Static `WebDriver` instance (kills parallel execution)

**The problem:**
```java
// Shared across all threads — parallel scenarios will fight over this
public class BaseTest {
    public static WebDriver driver;
}
```

**Why it breaks:** Two scenarios running in parallel click on different pages in the same browser window. Results are completely unpredictable.

**The fix:** Use `ThreadLocal<WebDriver>` in `DriverManager` and inject via `TestContext` with PicoContainer. Each thread gets its own driver instance.

---

## 3. Locators scattered in step definitions

**The problem:**
```java
@When("the user submits the form")
public void submitForm() {
    driver.findElement(By.cssSelector(".login-form button.submit-btn")).click();
}
```

**Why it breaks:** When the selector changes (and it will), you have to hunt through every step class to find all the places it's referenced.

**The fix:** All locators live as constants in the corresponding Page Object. Steps call page methods. Change the selector in one place.

---

## 4. Assertions in `Given` or `When` steps

**The problem:**
```java
@When("the user clicks the login button")
public void clickLogin() {
    loginPage.clickLogin();
    // This is an assertion — it doesn't belong here
    assertTrue(homePage.isWelcomeMessageVisible());
}
```

**Why it breaks:** It violates the BDD contract. `When` describes an action; `Then` describes the outcome. Mixing them makes failure messages confusing and steps harder to reuse.

**The fix:** Keep assertions exclusively in `Then` steps. `Given` = setup, `When` = action, `Then` = verify.

---

## 5. Hardcoded URLs, credentials, and test data

**The problem:**
```java
@Given("the user is on the login page")
public void navigateToLogin() {
    driver.get("https://staging.example.com/login");
}
```

**Why it breaks:** Running against prod, QA, or a local environment requires code changes. Credentials in code leak into version control.

**The fix:** Use `ConfigReader` with `config.properties` as the base and system property overrides for CI:
```java
driver.get(ConfigReader.get("base.url") + "/login");
```

---

## 6. Sharing state via static fields between step classes

**The problem:**
```java
// In LoginSteps
public static String authToken;

// In CartSteps
String token = LoginSteps.authToken; // tight coupling, breaks in parallel
```

**Why it breaks:** Static fields are shared across threads. In parallel execution, one scenario's login overwrites another's token. Also creates a maintenance nightmare — implicit coupling between unrelated step classes.

**The fix:** Use `TestContext` injected by PicoContainer. It's isolated per scenario and per thread.

---

## 7. Using XPath when a better locator exists

**The problem:**
```java
By.xpath("//div[@class='container']/form/div[2]/input[1]")
```

**Why it breaks:** XPath tied to DOM structure breaks with any HTML refactor. It's also slower than CSS selectors.

**The fix:** Prefer `id`, `name`, `data-testid`, or CSS selectors. Ask the dev team to add `data-testid` attributes to key UI elements — it's a small investment with huge automation payoffs.

```java
By.cssSelector("[data-testid='email-input']")
```

---

## 8. Missing `finally` block in teardown (leaked browsers)

**The problem:**
```java
@After
public void tearDown(Scenario scenario) {
    if (scenario.isFailed()) {
        takeScreenshot();
    }
    context.getDriver().quit();   // If takeScreenshot() throws, quit() never runs
}
```

**Why it breaks:** A crash in the screenshot code leaves a browser process running. After 100 test runs, you have 100 zombie browser processes consuming memory.

**The fix:**
```java
@After
public void tearDown(Scenario scenario) {
    try {
        if (scenario.isFailed()) {
            takeScreenshot(scenario);
        }
    } finally {
        DriverManager.quitDriver();  // always runs, even if screenshot fails
    }
}
```

---

## 9. Monolithic feature files with background-heavy setup

**The problem:**
```gherkin
Background:
  Given the user is logged in
  And they have 3 items in their cart
  And a promo code "SUMMER20" is applied
  And the shipping address is set

Scenario: View cart total
  # Only needed the cart, not the promo code
```

**Why it breaks:** Background steps run for every scenario in the file. If only 2 of 10 scenarios need the promo code, you're running unnecessary steps and coupling unrelated scenarios.

**The fix:** Keep Background to the minimal shared preconditions (usually just "navigate to page"). For complex setup, use tags + tag-scoped hooks, or factor the setup into a dedicated step that each scenario calls explicitly.

---

## 10. No `cucumber.publish.quiet=true` (noisy, unnecessary uploads)

**The problem:** Every test run prints a Cucumber cloud publish URL to the console, potentially exposing test results publicly (or just generating noise).

**The fix:** Add to `cucumber.properties`:
```properties
cucumber.publish.quiet=true
```

Or in the runner:
```java
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME, value = "..., io.cucumber.core.plugin.NoPublishPlugin")
```

---

## 11. Overly broad `@Before` / `@After` hooks

**The problem:** A single `Hooks` class that does login, creates test data, resets the database, AND takes screenshots — for every scenario, including the ones that don't need any of it.

**Why it breaks:** Test runs become slow and brittle. A failure in a setup step that's irrelevant to the current scenario causes a confusing failure message.

**The fix:** Use tag-scoped hooks (`@Before(value = "@needs-login")`) and keep each hook focused on a single responsibility. Create separate hook classes for different concerns.
