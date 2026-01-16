@feedback-widget @theming
Feature: Theming Support
  As a website user
  I want the feedback widget to have consistent styling
  So that the interface looks professional and readable

  Background:
    Given I am on the example app homepage

  @theming @consistent-styling
  Scenario: Feedback modal has consistent visual styling
    When I open the feedback modal
    Then the modal should have visible text elements
    And the modal should have interactive buttons

  @theming @form-elements
  Scenario: Form elements are properly styled
    When I open the feedback modal
    Then the text input fields should be visible
    And the submit button should be styled distinctly
