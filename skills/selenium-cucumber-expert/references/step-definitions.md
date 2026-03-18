# Step Definitions — Implementing Given/When/Then in Java

Step definitions are the bridge between Gherkin text and Selenium code. Keep them thin — they orchestrate, they don't implement. The actual browser interactions belong in Page Objects or Screenplay Tasks.

---

## Basic step class structure

```java
package com.mycompany.tests.steps;

import com.mycompany.tests.pages.LoginPage;
import com.mycompany.tests.support.TestContext;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.jupiter.api.Assertions;

public class LoginSteps {

    private final TestContext context;
    private final LoginPage loginPage;

    // PicoContainer injects TestContext via constructor — never use field injection
    public LoginSteps(TestContext context) {
        this.context = context;
        this.loginPage = new LoginPage(context.getDriver());
    }

    @Given("the user is on the login page")
    public void theUserIsOnTheLoginPage() {
        loginPage.navigateTo();
    }

    @When("the user enters username {string} and password {string}")
    public void theUserEntersCredentials(String username, String password) {
        loginPage.enterUsername(username);
        loginPage.enterPassword(password);
    }

    @When("clicks the login button")
    public void clicksLoginButton() {
        loginPage.clickLogin();
    }

    @Then("they should be redirected to the dashboard")
    public void theyAreRedirectedToDashboard() {
        Assertions.assertTrue(
            context.getDriver().getCurrentUrl().contains("/dashboard"),
            "Expected dashboard URL but was: " + context.getDriver().getCurrentUrl()
        );
    }

    @Then("the welcome message should show {string}")
    public void theWelcomeMessageShouldShow(String expectedMessage) {
        String actual = loginPage.getWelcomeMessage();
        Assertions.assertEquals(expectedMessage, actual,
            "Welcome message mismatch");
    }
}
```

---

## Parameter types (Cucumber expressions)

Cucumber expressions extract values from step text automatically:

| Expression | Java type | Example step text |
|---|---|---|
| `{string}` | `String` | `"hello"` (with quotes in Gherkin) |
| `{int}` | `int` / `Integer` | `42` |
| `{long}` | `long` / `Long` | `1234567890` |
| `{float}` | `float` / `Float` | `3.14` |
| `{double}` | `double` / `Double` | `99.99` |
| `{word}` | `String` | `hello` (no quotes, no spaces) |
| `{bigdecimal}` | `BigDecimal` | `19.99` |
| Regular expression | any | `the user has (\d+) items` |

```java
// Gherkin: When the user adds 3 items to the cart
@When("the user adds {int} items to the cart")
public void userAddsItemsToCart(int quantity) {
    cartPage.addItems(quantity);
}

// Gherkin: When the price is $19.99
@When("the price is ${double}")
public void thePriceIs(double price) {
    Assertions.assertEquals(price, cartPage.getTotalPrice(), 0.01);
}
```

---

## DataTable in steps

```java
import io.cucumber.datatable.DataTable;
import java.util.Map;

// Gherkin table with header row → Map<String, String>
@When("the user fills in the form with:")
public void userFillsForm(DataTable dataTable) {
    Map<String, String> formData = dataTable.asMap(String.class, String.class);
    registrationPage.fillForm(formData);
}

// Multiple rows → List<Map<String, String>>
@When("the following users are created:")
public void createUsers(DataTable dataTable) {
    List<Map<String, String>> users = dataTable.asMaps(String.class, String.class);
    for (Map<String, String> user : users) {
        adminPage.createUser(user.get("Email"), user.get("Role"));
    }
}
```

---

## DocString in steps

```java
import io.cucumber.java.en.When;

@When("they preview the email body:")
public void theyPreviewEmailBody(String emailBody) {
    emailPage.setBody(emailBody);
    emailPage.clickPreview();
}
```

---

## Sharing state between step classes with PicoContainer

When your steps are spread across multiple classes (e.g., `LoginSteps`, `CartSteps`, `CheckoutSteps`), they need to share the `WebDriver` and any scenario-scoped data. **PicoContainer injects shared objects through constructors automatically** — you just need to declare the same type in each class's constructor.

```java
// TestContext.java — the shared state bag
public class TestContext {
    private WebDriver driver;
    private String authToken;   // example of scenario-scoped state

    public WebDriver getDriver() { return driver; }
    public void setDriver(WebDriver driver) { this.driver = driver; }
    public String getAuthToken() { return authToken; }
    public void setAuthToken(String token) { this.authToken = token; }
}

// LoginSteps.java
public class LoginSteps {
    private final TestContext context;
    public LoginSteps(TestContext context) { this.context = context; }
    // ...
}

// CartSteps.java — PicoContainer creates the same TestContext instance
public class CartSteps {
    private final TestContext context;
    public CartSteps(TestContext context) { this.context = context; }
    // ...
}
```

> PicoContainer creates one instance of `TestContext` per scenario and injects it into all step classes that request it. No manual wiring, no static state.

---

## Step reuse

If multiple features share the same precondition (e.g., "user is logged in"), define the step once in a dedicated `CommonSteps` class. Cucumber finds all step definitions in the glue path — location doesn't matter, only the text pattern matters.

```java
// CommonSteps.java
public class CommonSteps {
    private final TestContext context;

    public CommonSteps(TestContext context) { this.context = context; }

    @Given("the user is logged in as {string}")
    public void theUserIsLoggedInAs(String role) {
        // Perform login and store auth state in context
        context.setCurrentUser(userService.login(role));
    }
}
```

---

## What NOT to put in step definitions

- **No `driver.findElement()` calls** — that belongs in Page Objects
- **No `Thread.sleep()`** — use `WebDriverWait` in Page Objects
- **No assertions in `Given` or `When` steps** — assert only in `Then`
- **No hardcoded URLs** — read from `ConfigReader`
- **No business logic** — steps coordinate, Pages encapsulate
