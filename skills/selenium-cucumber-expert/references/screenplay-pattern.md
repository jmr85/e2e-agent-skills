# Screenplay Pattern — Selenium + Cucumber Java

The Screenplay Pattern is an actor-centric alternative to POM. Instead of "pages that do things", you have "actors with abilities who perform tasks and ask questions". It shines for complex flows, multi-actor scenarios (e.g., admin + customer), and when you want highly composable, testable business logic.

---

## Core concepts

| Concept | Role | Example |
|---|---|---|
| **Actor** | The entity performing the test | A user, an admin, a guest |
| **Ability** | What an actor can do | `BrowseTheWeb` (has a WebDriver) |
| **Task** | A business-level action composed of Interactions | `Login.as("user@example.com")` |
| **Interaction** | A single UI action | `Click.on(LOGIN_BUTTON)` |
| **Question** | Observes the system and returns a value | `CurrentUrl.of(driver)` |

---

## When to choose Screenplay over POM

| POM is better when... | Screenplay is better when... |
|---|---|
| Small team, familiar with POM | Large team needing strict separation |
| Simple CRUD-style flows | Complex multi-step business flows |
| Solo developer | Multiple actors interact in one scenario |
| You need to ship quickly | You need maximum reusability of business tasks |

**Hybrid approach (recommended for most projects):** Use POM for page structure and locators, but introduce Screenplay Tasks to encapsulate multi-step business flows that span multiple pages.

---

## Ability — BrowseTheWeb

```java
package com.mycompany.tests.screenplay.abilities;

import org.openqa.selenium.WebDriver;

public class BrowseTheWeb {

    private final WebDriver driver;

    private BrowseTheWeb(WebDriver driver) {
        this.driver = driver;
    }

    public static BrowseTheWeb with(WebDriver driver) {
        return new BrowseTheWeb(driver);
    }

    public WebDriver getDriver() {
        return driver;
    }
}
```

---

## Actor

```java
package com.mycompany.tests.screenplay;

import com.mycompany.tests.screenplay.abilities.BrowseTheWeb;

public class Actor {

    private final String name;
    private BrowseTheWeb browseTheWeb;

    private Actor(String name) {
        this.name = name;
    }

    public static Actor named(String name) {
        return new Actor(name);
    }

    public Actor whoCan(BrowseTheWeb ability) {
        this.browseTheWeb = ability;
        return this;
    }

    public WebDriver getDriver() {
        return browseTheWeb.getDriver();
    }

    // Perform a task
    public void attemptsTo(Task... tasks) {
        for (Task task : tasks) {
            task.performAs(this);
        }
    }

    // Ask a question and get the answer
    public <T> T asksAbout(Question<T> question) {
        return question.answeredBy(this);
    }

    public String getName() { return name; }
}
```

---

## Task — Login

Tasks describe business-level operations. They are composed of Interactions (low-level UI actions):

```java
package com.mycompany.tests.screenplay.tasks;

import com.mycompany.tests.screenplay.Actor;
import com.mycompany.tests.screenplay.Task;
import com.mycompany.tests.screenplay.interactions.Click;
import com.mycompany.tests.screenplay.interactions.Enter;
import com.mycompany.tests.screenplay.interactions.Navigate;
import com.mycompany.tests.utils.ConfigReader;
import org.openqa.selenium.By;

public class Login implements Task {

    private final String username;
    private final String password;

    private Login(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // Factory method for readable usage: Login.as("user@example.com").withPassword("secret")
    public static Login as(String username) {
        return new Login(username, "");
    }

    public Login withPassword(String password) {
        return new Login(this.username, password);
    }

    @Override
    public void performAs(Actor actor) {
        actor.attemptsTo(
            Navigate.to(ConfigReader.get("base.url") + "/login"),
            Enter.theValue(username).into(By.id("email")),
            Enter.theValue(password).into(By.id("password")),
            Click.on(By.cssSelector("button[type='submit']"))
        );
    }
}
```

---

## Interaction — Click and Enter

```java
package com.mycompany.tests.screenplay.interactions;

import com.mycompany.tests.screenplay.Actor;
import com.mycompany.tests.screenplay.Task;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import java.time.Duration;

public class Click implements Task {

    private final By locator;

    private Click(By locator) { this.locator = locator; }

    public static Click on(By locator) { return new Click(locator); }

    @Override
    public void performAs(Actor actor) {
        WebDriverWait wait = new WebDriverWait(actor.getDriver(), Duration.ofSeconds(10));
        wait.until(ExpectedConditions.elementToBeClickable(locator)).click();
    }
}

public class Enter implements Task {

    private final String value;
    private By locator;

    private Enter(String value) { this.value = value; }

    public static Enter theValue(String value) { return new Enter(value); }

    public Enter into(By locator) {
        this.locator = locator;
        return this;
    }

    @Override
    public void performAs(Actor actor) {
        WebDriverWait wait = new WebDriverWait(actor.getDriver(), Duration.ofSeconds(10));
        var element = wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
        element.clear();
        element.sendKeys(value);
    }
}
```

---

## Question — CurrentUrl

Questions observe the system without changing its state:

```java
package com.mycompany.tests.screenplay.questions;

import com.mycompany.tests.screenplay.Actor;
import com.mycompany.tests.screenplay.Question;

public class CurrentUrl implements Question<String> {

    public static CurrentUrl displayed() { return new CurrentUrl(); }

    @Override
    public String answeredBy(Actor actor) {
        return actor.getDriver().getCurrentUrl();
    }
}

// Another example: reading text from a locator
public class TextOf implements Question<String> {

    private final By locator;

    private TextOf(By locator) { this.locator = locator; }

    public static TextOf element(By locator) { return new TextOf(locator); }

    @Override
    public String answeredBy(Actor actor) {
        return actor.getDriver().findElement(locator).getText();
    }
}
```

---

## Using Screenplay in step definitions

```java
public class LoginSteps {

    private final TestContext context;

    public LoginSteps(TestContext context) {
        this.context = context;
    }

    @Given("the user {string} wants to access the application")
    public void userWantsToAccess(String actorName) {
        Actor actor = Actor.named(actorName)
            .whoCan(BrowseTheWeb.with(context.getDriver()));
        context.setActor(actor);
    }

    @When("they log in with username {string} and password {string}")
    public void theyLogIn(String username, String password) {
        context.getActor().attemptsTo(
            Login.as(username).withPassword(password)
        );
    }

    @Then("they should land on the dashboard")
    public void theyLandOnDashboard() {
        String url = context.getActor().asksAbout(CurrentUrl.displayed());
        Assertions.assertTrue(url.contains("/dashboard"),
            "Expected dashboard URL, got: " + url);
    }
}
```

---

## Task and Question interfaces

```java
// Task.java
package com.mycompany.tests.screenplay;

@FunctionalInterface
public interface Task {
    void performAs(Actor actor);
}

// Question.java
package com.mycompany.tests.screenplay;

@FunctionalInterface
public interface Question<T> {
    T answeredBy(Actor actor);
}
```
