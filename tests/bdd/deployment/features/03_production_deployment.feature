@production-deployment
Feature: Production Deployment
  As a DevOps Engineer
  I want reliable production deployment
  So that I can confidently deploy to production

  Background:
    Given the repository is cloned
    And Docker is installed and running

  @US-DEV-008 @high-priority
  Scenario: Docker compose configuration is valid
    When I run docker compose config validation
    Then configuration validation passes
    And no errors are reported

  @US-DEV-008 @high-priority
  Scenario: Environment example file exists
    Given the repository is cloned
    Then .env.example file exists or environment is configured
    And the file contains configuration guidance

  @US-DEV-009 @high-priority
  Scenario: Health endpoint is accessible
    Given services are running
    When I request the feedback-server health endpoint
    Then the response status code is 200
    And the response body is valid JSON

  @US-DEV-009 @high-priority
  Scenario: All services respond to requests
    Given services are running
    Then feedback-server responds at port 15567
    And webui responds at port 19568
    And feedback-example responds at port 18196

  @US-DEV-010 @medium-priority
  Scenario: Database configuration is accessible
    Given services are running
    When I check the feedback-server container
    Then database configuration is present
