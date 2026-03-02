@auth @smoke
Feature: User Authentication
  As a registered user
  I want to log in to the application
  So that I can access my account

  Background:
    Given I am on the login page

  @smoke
  Scenario: Successful login with valid credentials
    When I enter valid credentials
    Then I should be redirected to the dashboard
    And I should see my username in the header

  @regression
  Scenario: Failed login with invalid password
    When I enter an invalid password
    Then I should see an error message "Invalid email or password"
    And I should remain on the login page

  @regression
  Scenario Outline: Failed login with missing fields
    When I submit the login form with email "<email>" and password "<password>"
    Then I should see a validation error for the "<field>" field

    Examples:
      | email             | password    | field    |
      |                   | password123 | email    |
      | user@example.com  |             | password |
      |                   |             | email    |
