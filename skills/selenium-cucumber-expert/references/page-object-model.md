# Page Object Model — Selenium 4 + Java

The Page Object Model (POM) is the most widely-used design pattern in Selenium automation. Each web page (or significant component) gets its own Java class that encapsulates its locators and actions. When the UI changes, you fix it in one class — not scattered across dozens of step files.

---

## BasePage — the shared foundation

Every Page Object inherits from `BasePage`, which provides common behavior like navigation, explicit waits, and scrolling:

```java
package com.mycompany.tests.pages;

import org.openqa.selenium.*;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public abstract class BasePage {

    protected WebDriver driver;
    protected WebDriverWait wait;
    private static final int DEFAULT_TIMEOUT_SECONDS = 10;

    public BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(DEFAULT_TIMEOUT_SECONDS));
        // PageFactory wires @FindBy annotations (optional; see note below)
        PageFactory.initElements(driver, this);
    }

    protected WebElement waitForVisible(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected WebElement waitForClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    protected void click(By locator) {
        waitForClickable(locator).click();
    }

    protected void type(By locator, String text) {
        WebElement element = waitForVisible(locator);
        element.clear();
        element.sendKeys(text);
    }

    protected String getText(By locator) {
        return waitForVisible(locator).getText();
    }

    protected boolean isDisplayed(By locator) {
        try {
            return driver.findElement(locator).isDisplayed();
        } catch (NoSuchElementException e) {
            return false;
        }
    }

    public String getTitle() {
        return driver.getTitle();
    }

    public String getCurrentUrl() {
        return driver.getCurrentUrl();
    }
}
```

> **PageFactory vs. `By` constants:** Both approaches work. `By` constants (shown below) are simpler, easier to maintain, and avoid lazy-initialization subtleties that `@FindBy` introduces. Prefer `By` constants unless your team already uses `PageFactory` extensively.

---

## Page Object example — LoginPage

```java
package com.mycompany.tests.pages;

import com.mycompany.tests.utils.ConfigReader;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class LoginPage extends BasePage {

    // Locators as constants — change the UI, change one line
    private static final By USERNAME_INPUT = By.id("email");
    private static final By PASSWORD_INPUT = By.id("password");
    private static final By LOGIN_BUTTON   = By.cssSelector("button[type='submit']");
    private static final By ERROR_MESSAGE  = By.className("error-message");
    private static final By WELCOME_TEXT   = By.cssSelector(".dashboard-header h1");

    public LoginPage(WebDriver driver) {
        super(driver);
    }

    public void navigateTo() {
        driver.get(ConfigReader.get("base.url") + "/login");
    }

    public void enterUsername(String username) {
        type(USERNAME_INPUT, username);
    }

    public void enterPassword(String password) {
        type(PASSWORD_INPUT, password);
    }

    public void clickLogin() {
        click(LOGIN_BUTTON);
    }

    // Convenience method for the full login flow
    public void loginAs(String username, String password) {
        navigateTo();
        enterUsername(username);
        enterPassword(password);
        clickLogin();
    }

    public String getErrorMessage() {
        return getText(ERROR_MESSAGE);
    }

    public String getWelcomeMessage() {
        return getText(WELCOME_TEXT);
    }

    public boolean isErrorDisplayed() {
        return isDisplayed(ERROR_MESSAGE);
    }
}
```

---

## Fluent API pattern

For pages with multi-step forms, returning `this` (or the next page) creates readable chains:

```java
public class CheckoutPage extends BasePage {

    private static final By FIRST_NAME = By.id("firstName");
    private static final By LAST_NAME  = By.id("lastName");
    private static final By CONFIRM_BUTTON = By.id("confirmOrder");

    public CheckoutPage(WebDriver driver) { super(driver); }

    public CheckoutPage enterFirstName(String name) {
        type(FIRST_NAME, name);
        return this;
    }

    public CheckoutPage enterLastName(String name) {
        type(LAST_NAME, name);
        return this;
    }

    // Returns the next page after submission
    public ConfirmationPage confirm() {
        click(CONFIRM_BUTTON);
        return new ConfirmationPage(driver);
    }
}

// In step definitions, this reads naturally:
ConfirmationPage confirmation = checkoutPage
    .enterFirstName("John")
    .enterLastName("Doe")
    .confirm();
```

---

## Locator priority (Selenium 4)

Choose locators in this order — more resilient first:

1. **`By.id()`** — fastest, most stable when IDs are meaningful
2. **`By.name()`** — good for form inputs
3. **`By.cssSelector()`** — flexible, human-readable, fast
4. **`By.linkText()` / `By.partialLinkText()`** — for anchor elements
5. **`By.xpath()`** — use as a last resort; xpath is brittle and slow
6. **Selenium 4 relative locators** — `RelativeLocator.with(By.tagName("input")).above(By.id("submit"))` — useful when elements lack stable attributes

Avoid: generated class names, text content that changes by locale, pixel coordinates.

---

## Selenium 4 — new features to leverage

**`driver.manage().window().fullscreen()`** — more reliable than maximize for screenshots.

**Relative locators** for components without IDs:
```java
WebElement label = driver.findElement(By.id("name-label"));
WebElement input = driver.findElement(
    RelativeLocator.with(By.tagName("input")).toRightOf(label)
);
```

**`WebElement.getShadowRoot()`** — for web components using Shadow DOM:
```java
SearchContext shadowRoot = driver.findElement(By.cssSelector("my-component"))
                                 .getShadowRoot();
WebElement innerEl = shadowRoot.findElement(By.cssSelector(".inner-input"));
```

**`Actions` API for complex interactions:**
```java
new Actions(driver)
    .moveToElement(menuItem)
    .pause(Duration.ofMillis(500))
    .click(subMenuItem)
    .perform();
```

---

## Component Page Objects

For reusable UI components (navigation bar, modal dialogs, toast notifications), create dedicated component classes:

```java
public class NavBar extends BasePage {
    private static final By USER_MENU = By.id("user-menu");
    private static final By LOGOUT    = By.id("nav-logout");

    public NavBar(WebDriver driver) { super(driver); }

    public void logout() {
        click(USER_MENU);
        click(LOGOUT);
    }
}

// Used inside a Page Object:
public class HomePage extends BasePage {
    private final NavBar navBar;

    public HomePage(WebDriver driver) {
        super(driver);
        this.navBar = new NavBar(driver);
    }

    public NavBar getNavBar() { return navBar; }
}
```
