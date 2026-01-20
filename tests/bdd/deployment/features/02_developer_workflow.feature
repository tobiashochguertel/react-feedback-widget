@developer-workflow
Feature: Developer Workflow
  As a Developer
  I want a productive development environment
  So that I can contribute efficiently

  Background:
    Given the repository is cloned
    And Docker is installed and running

  @US-DEV-004 @high-priority
  Scenario: Development environment starts successfully
    When I run "task up" to start all services
    Then all development containers start
    And the environment is ready for development

  @US-DEV-005 @high-priority
  Scenario: Combined logs are accessible via docker compose
    Given services are running
    When I run docker compose logs command
    Then I see logs from services
    And logs include output content

  @US-DEV-006 @medium-priority
  Scenario: Clean shutdown works correctly
    Given services are running
    When I run "task down" to stop services
    Then all containers stop
    And Docker volumes are preserved

  @US-DEV-006 @medium-priority
  Scenario: Services can be restarted after shutdown
    Given services were previously running and stopped
    When I run "task up" to start all services
    Then all containers should reach running state

  @US-DEV-007 @medium-priority
  Scenario: Docker images can be built
    Given Docker is installed and running
    When I run docker compose build
    Then the build completes successfully
    And images are created for services
