package com.mycompany.tests.pages;

import com.mycompany.tests.utils.ConfigReader;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/**
 * Page Object for the Login page.
 *
 * Principles:
 * - All locators are private constants — change the UI, change one line
 * - No assertions here — assertions belong in step definitions (@Then)
 * - Waits are handled in BasePage — no Thread.sleep() anywhere
 * - Methods return void or a String (data), not WebElements
 */
public class LoginPage extends BasePage {

    // ─── Locators ────────────────────────────────────────────────────────────────
    private static final By USERNAME_INPUT  = By.id("email");
    private static final By PASSWORD_INPUT  = By.id("password");
    private static final By LOGIN_BUTTON    = By.cssSelector("button[type='submit']");
    private static final By ERROR_MESSAGE   = By.cssSelector(".alert-error");
    private static final By REGISTER_LINK   = By.linkText("Create an account");
    private static final By REMEMBER_ME_CB  = By.id("rememberMe");

    // ─── Constructor ─────────────────────────────────────────────────────────────
    public LoginPage(WebDriver driver) {
        super(driver);
    }

    // ─── Navigation ──────────────────────────────────────────────────────────────
    public void navigateTo() {
        driver.get(ConfigReader.get("base.url") + "/login");
    }

    // ─── Actions ─────────────────────────────────────────────────────────────────
    public void enterUsername(String username) {
        type(USERNAME_INPUT, username);
    }

    public void enterPassword(String password) {
        type(PASSWORD_INPUT, password);
    }

    public void clickLogin() {
        click(LOGIN_BUTTON);
    }

    public void clickRegisterLink() {
        click(REGISTER_LINK);
    }

    public void checkCheckbox(String label) {
        // Simple implementation — extend as needed for label-based lookup
        click(REMEMBER_ME_CB);
    }

    /**
     * Convenience method for the complete login flow.
     * Use in Background steps or Screenplay tasks that need a logged-in user.
     */
    public void loginAs(String username, String password) {
        enterUsername(username);
        enterPassword(password);
        clickLogin();
    }

    // ─── Queries ─────────────────────────────────────────────────────────────────
    public String getErrorMessage() {
        return getText(ERROR_MESSAGE);
    }

    public boolean isErrorDisplayed() {
        return isDisplayed(ERROR_MESSAGE);
    }
}
