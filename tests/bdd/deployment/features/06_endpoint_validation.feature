@endpoint-validation
Feature: Endpoint Validation
  As a Developer or DevOps Engineer
  I want to verify that all service endpoints respond correctly
  So that I can ensure the deployment is complete and functional

  Background:
    Given services are running

  @US-EP-001 @high-priority
  Scenario: API Documentation is accessible
    When I request the API documentation endpoint
    Then the response status should be 200
    And the response should contain Swagger UI HTML
    And the OpenAPI specification is accessible

  @US-EP-002 @high-priority
  Scenario: OpenAPI specification is valid
    When I request the OpenAPI JSON specification
    Then the response status should be 200
    And the response should be valid JSON
    And the specification contains required OpenAPI fields

  @US-EP-003 @medium-priority
  Scenario: WebUI serves the application correctly
    When I request the WebUI root endpoint
    Then the response status should be 200
    And the response should contain HTML with React root element
    And the response should reference Vite client
    And static assets are accessible

  @US-EP-004 @medium-priority
  Scenario: Feedback Example application loads correctly
    When I request the feedback example root endpoint
    Then the response status should be 200
    And the response should be a valid HTML page

  @US-EP-005 @high-priority
  Scenario: Health endpoint provides detailed status
    When I request the detailed health endpoint
    Then the response status should be 200
    And the response should contain health status fields
    And the database component should be healthy

  @US-EP-006 @medium-priority
  Scenario: Server root endpoint provides API information
    When I request the server root endpoint
    Then the response status should be 200
    And the response should contain server name
    And the response should contain API version
    And the response should contain documentation URL
