@quick-evaluation
Feature: Quick Project Evaluation
  As an Evaluator
  I want to get the project running quickly
  So that I can evaluate if it meets my needs

  Background:
    Given the repository is cloned
    And Docker is installed and running
    And Task is installed

  @US-DEV-001 @high-priority
  Scenario: First-time setup completes successfully
    When I run "task up" to start all services
    Then all containers should reach running state
    And I should be able to access all service endpoints
    And the feedback-example page loads successfully

  @US-DEV-001 @high-priority
  Scenario: All services are accessible after startup
    Given services are running
    Then I can access feedback-example at "http://localhost:18196"
    And I can access webui at "http://localhost:19568"
    And I can access feedback-server at "http://localhost:15567"

  @US-DEV-002 @high-priority
  Scenario: Feedback widget is visible on example page
    Given services are running
    When I open the feedback-example page
    Then the page loads with status 200
    And the page contains feedback widget elements

  @US-DEV-002 @high-priority
  Scenario: Health endpoint responds correctly
    Given services are running
    When I request the health endpoint
    Then the response status is 200
    And the response indicates healthy status

  @US-DEV-003 @medium-priority
  Scenario: Task list shows available commands
    When I run "task --list"
    Then the output contains available tasks
    And each task has a description

  @US-DEV-003 @medium-priority
  Scenario: Taskfile exists and is valid
    Given the repository is cloned
    Then Taskfile.yml exists in the repository root
    And Taskfile.yml is valid YAML
