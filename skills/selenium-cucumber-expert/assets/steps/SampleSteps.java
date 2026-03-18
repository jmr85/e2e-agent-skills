package com.mycompany.tests.steps;

import com.mycompany.tests.pages.LoginPage;
import com.mycompany.tests.pages.DashboardPage;
import com.mycompany.tests.support.TestContext;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.junit.jupiter.api.Assertions;

import java.util.Map;

/**
 * Step definitions for authentication scenarios.
 *
 * Notice:
 * - PicoContainer injects TestContext via constructor (no annotations needed)
 * - Page Objects are instantiated with the driver from context
 * - Steps only coordinate — they don't contain locators or wait logic
 * - All assertions are in @Then methods only
 */
public class LoginSteps {

    private final TestContext context;
    private final LoginPage loginPage;
    private DashboardPage dashboardPage;

    public LoginSteps(TestContext context) {
        this.context = context;
        this.loginPage = new LoginPage(context.getDriver());
    }

    @Given("the user is on the login page")
    public void theUserIsOnTheLoginPage() {
        loginPage.navigateTo();
    }

    @Given("the user navigates to the registration page")
    public void theUserNavigatesToRegistrationPage() {
        loginPage.navigateTo();
        loginPage.clickRegisterLink();
    }

    @Given("the user is logged in as {string} with password {string}")
    public void theUserIsLoggedInAs(String email, String password) {
        loginPage.navigateTo();
        loginPage.loginAs(email, password);
        dashboardPage = new DashboardPage(context.getDriver());
    }

    @When("the user enters username {string} and password {string}")
    public void theUserEntersCredentials(String username, String password) {
        loginPage.enterUsername(username);
        loginPage.enterPassword(password);
    }

    @When("checks the {string} checkbox")
    public void checksCheckbox(String label) {
        loginPage.checkCheckbox(label);
    }

    @When("clicks the login button")
    public void clicksLoginButton() {
        loginPage.clickLogin();
        dashboardPage = new DashboardPage(context.getDriver());
    }

    @When("they click the logout button")
    public void theyClickLogoutButton() {
        dashboardPage.clickLogout();
    }

    @When("refreshes the browser")
    public void refreshesBrowser() {
        context.getDriver().navigate().refresh();
    }

    @When("they fill in the registration form with:")
    public void theyFillInRegistrationForm(DataTable dataTable) {
        Map<String, String> formData = dataTable.asMap(String.class, String.class);
        // Delegate to the registration page (not shown here for brevity)
        // registrationPage.fillForm(formData);
    }

    @When("submits the registration")
    public void submitsRegistration() {
        // registrationPage.submit();
    }

    @Then("they should be redirected to the dashboard")
    public void theyShouldBeRedirectedToDashboard() {
        String currentUrl = context.getDriver().getCurrentUrl();
        Assertions.assertTrue(
            currentUrl.contains("/dashboard"),
            "Expected dashboard URL but got: " + currentUrl
        );
    }

    @Then("the welcome message should show {string}")
    public void theWelcomeMessageShouldShow(String expectedMessage) {
        String actual = dashboardPage.getWelcomeMessage();
        Assertions.assertEquals(expectedMessage, actual,
            "Welcome message mismatch");
    }

    @Then("an error message should be displayed containing {string}")
    public void anErrorMessageShouldBeDisplayedContaining(String expectedError) {
        String actualError = loginPage.getErrorMessage();
        Assertions.assertTrue(
            actualError.contains(expectedError),
            "Expected error containing '" + expectedError + "' but got: '" + actualError + "'"
        );
    }

    @Then("they should be redirected to the login page")
    public void theyShouldBeRedirectedToLoginPage() {
        String currentUrl = context.getDriver().getCurrentUrl();
        Assertions.assertTrue(
            currentUrl.contains("/login"),
            "Expected login URL but got: " + currentUrl
        );
    }

    @Then("they should still be on the dashboard")
    public void theyShouldStillBeOnDashboard() {
        String currentUrl = context.getDriver().getCurrentUrl();
        Assertions.assertTrue(
            currentUrl.contains("/dashboard"),
            "Expected to remain on dashboard after refresh but got: " + currentUrl
        );
    }

    @Then("the account should be created successfully")
    public void theAccountShouldBeCreatedSuccessfully() {
        // Assert success state — implementation depends on your app
    }

    @And("a confirmation email notification should appear")
    public void aConfirmationEmailNotificationShouldAppear() {
        // Assert notification — implementation depends on your app
    }
}
