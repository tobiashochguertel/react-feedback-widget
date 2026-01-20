@safety
Feature: Safety Mechanisms
  As a DevOps Engineer
  I want protection against accidental data loss
  So that I don't accidentally delete production data

  Background:
    Given the repository is cloned
    And Docker is installed and running

  @US-DEV-015 @high-priority
  Scenario: Taskfile includes reset task
    Given the repository is cloned
    When I examine the Taskfile.yml
    Then a reset or clean task is defined
    And the task is documented

  @US-DEV-015 @high-priority
  Scenario: Volumes are used for data persistence
    When I examine docker-compose.yml
    Then volumes are defined for data persistence
    And volume configurations are appropriate

  @US-DEV-015 @high-priority
  Scenario: Down command does not remove volumes by default
    Given services are running
    When I run "task down" to stop services
    Then containers are stopped
    But volumes remain intact

  @US-DEV-015 @high-priority
  Scenario: Services can be completely removed when needed
    Given services are running
    When I run docker compose down with volumes flag
    Then containers are removed
    And volumes are removed
