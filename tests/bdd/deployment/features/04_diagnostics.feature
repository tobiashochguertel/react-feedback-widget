@diagnostics
Feature: Validation and Diagnostics
  As a Developer or DevOps Engineer
  I want comprehensive diagnostics
  So that I can troubleshoot issues efficiently

  Background:
    Given the repository is cloned
    And Docker is installed and running

  @US-DEV-011 @medium-priority
  Scenario: Docker daemon is running and accessible
    When I check Docker daemon status
    Then Docker reports it is running
    And Docker can list containers

  @US-DEV-011 @medium-priority
  Scenario: Required ports are available or in use by our services
    Given services may or may not be running
    When I check port availability for service ports
    Then ports are either available or used by our containers

  @US-DEV-012 @medium-priority
  Scenario: Container status can be inspected
    Given services are running
    When I run docker compose ps
    Then I see status for all defined services
    And each service shows its current state

  @US-DEV-012 @medium-priority
  Scenario: Service logs can be retrieved for troubleshooting
    Given services are running
    When I run docker compose logs with tail option
    Then recent log entries are displayed
    And logs are useful for debugging
