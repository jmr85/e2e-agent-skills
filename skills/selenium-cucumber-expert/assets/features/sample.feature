@auth
Feature: User Authentication
  As a registered user
  I want to be able to log in and log out of the application
  So that I can securely access my account

  Background:
    Given the user is on the login page

  @smoke
  Scenario: Successful login with valid credentials
    When the user enters username "john.doe@example.com" and password "Secret123!"
    And clicks the login button
    Then they should be redirected to the dashboard
    And the welcome message should show "Welcome, John"

  @negative
  Scenario Outline: Login fails with invalid credentials
    When the user enters username "<username>" and password "<password>"
    And clicks the login button
    Then an error message should be displayed containing "<error>"

    Examples:
      | username              | password   | error                     |
      | invalid@example.com   | Secret123! | Invalid email or password |
      | john.doe@example.com  | wrongpass  | Invalid email or password |

  @smoke
  Scenario: Successful logout after login
    Given the user is logged in as "john.doe@example.com" with password "Secret123!"
    When they click the logout button
    Then they should be redirected to the login page

  @regression
  Scenario: Remember me option keeps session across page refresh
    When the user enters username "john.doe@example.com" and password "Secret123!"
    And checks the "Remember me" checkbox
    And clicks the login button
    And refreshes the browser
    Then they should still be on the dashboard

  @regression
  Scenario: Registration of a new user account
    Given the user navigates to the registration page
    When they fill in the registration form with:
      | Field      | Value                  |
      | First Name | Jane                   |
      | Last Name  | Smith                  |
      | Email      | jane.smith@example.com |
      | Password   | NewPass123!            |
    And submits the registration
    Then the account should be created successfully
    And a confirmation email notification should appear
