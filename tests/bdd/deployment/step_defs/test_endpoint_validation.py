"""Step definitions for Endpoint Validation feature."""

import json
import os

import pytest
import requests
from pytest_bdd import scenarios, when, then

from conftest import (
    SERVICE_URLS,
    PORTS,
)

# Environment variable to control whether to skip service-dependent tests
REQUIRE_SERVICES = os.environ.get("BDD_REQUIRE_SERVICES", "false").lower() == "true"

# Load scenarios from feature file
scenarios("../features/06_endpoint_validation.feature")


# =============================================================================
# WHEN STEPS - API Documentation
# =============================================================================

@when("I request the API documentation endpoint")
def request_api_docs(http_client: requests.Session, context: dict):
    """Request the Swagger UI documentation endpoint."""
    url = f"{SERVICE_URLS['feedback-server']}/api/docs"
    try:
        response = http_client.get(url, timeout=15)
        context["api_docs_response"] = response
    except requests.exceptions.RequestException as e:
        context["api_docs_error"] = str(e)
        if REQUIRE_SERVICES:
            pytest.fail(f"Failed to request API docs: {e}")
        else:
            pytest.skip("API docs not accessible (set BDD_REQUIRE_SERVICES=true to fail)")


@when("I request the OpenAPI JSON specification")
def request_openapi_spec(http_client: requests.Session, context: dict):
    """Request the OpenAPI JSON specification."""
    url = f"{SERVICE_URLS['feedback-server']}/api/docs/openapi.json"
    try:
        response = http_client.get(url, timeout=15)
        context["openapi_response"] = response
    except requests.exceptions.RequestException as e:
        context["openapi_error"] = str(e)
        if REQUIRE_SERVICES:
            pytest.fail(f"Failed to request OpenAPI spec: {e}")
        else:
            pytest.skip("OpenAPI spec not accessible (set BDD_REQUIRE_SERVICES=true to fail)")


# =============================================================================
# WHEN STEPS - WebUI
# =============================================================================

@when("I request the WebUI root endpoint")
def request_webui_root(http_client: requests.Session, context: dict):
    """Request the WebUI root endpoint."""
    url = SERVICE_URLS["webui"]
    try:
        response = http_client.get(url, timeout=15)
        context["webui_response"] = response
    except requests.exceptions.RequestException as e:
        context["webui_error"] = str(e)
        if REQUIRE_SERVICES:
            pytest.fail(f"Failed to request WebUI: {e}")
        else:
            pytest.skip("WebUI not accessible (set BDD_REQUIRE_SERVICES=true to fail)")


# =============================================================================
# WHEN STEPS - Feedback Example
# =============================================================================

@when("I request the feedback example root endpoint")
def request_example_root(http_client: requests.Session, context: dict):
    """Request the feedback example root endpoint."""
    url = SERVICE_URLS["feedback-example"]
    try:
        response = http_client.get(url, timeout=15)
        context["example_response"] = response
    except requests.exceptions.RequestException as e:
        context["example_error"] = str(e)
        if REQUIRE_SERVICES:
            pytest.fail(f"Failed to request feedback-example: {e}")
        else:
            pytest.skip("feedback-example not accessible (set BDD_REQUIRE_SERVICES=true to fail)")


# =============================================================================
# WHEN STEPS - Health & Info
# =============================================================================

@when("I request the detailed health endpoint")
def request_detailed_health(http_client: requests.Session, context: dict):
    """Request the detailed health endpoint."""
    url = f"{SERVICE_URLS['feedback-server']}/api/v1/health/detailed"
    try:
        response = http_client.get(url, timeout=15)
        context["health_response"] = response
    except requests.exceptions.RequestException as e:
        context["health_error"] = str(e)
        if REQUIRE_SERVICES:
            pytest.fail(f"Failed to request health endpoint: {e}")
        else:
            pytest.skip("Health endpoint not accessible (set BDD_REQUIRE_SERVICES=true to fail)")


@when("I request the server root endpoint")
def request_server_root(http_client: requests.Session, context: dict):
    """Request the server root endpoint."""
    url = SERVICE_URLS["feedback-server"]
    try:
        response = http_client.get(url, timeout=15)
        context["info_response"] = response
    except requests.exceptions.RequestException as e:
        context["info_error"] = str(e)
        if REQUIRE_SERVICES:
            pytest.fail(f"Failed to request server root: {e}")
        else:
            pytest.skip("Server root not accessible (set BDD_REQUIRE_SERVICES=true to fail)")


# =============================================================================
# THEN STEPS - Response Status
# =============================================================================

@then("the response status should be 200")
def check_response_status_200(context: dict):
    """Verify that the response status is 200."""
    # Find the response in context (check multiple possible keys)
    response_keys = [
        "api_docs_response",
        "openapi_response",
        "webui_response",
        "example_response",
        "health_response",
        "info_response",
    ]

    response = None
    for key in response_keys:
        if key in context:
            response = context[key]
            break

    if response is None:
        pytest.fail("No response found in context")

    assert response.status_code == 200, f"Expected 200, got {response.status_code}"


# =============================================================================
# THEN STEPS - API Docs Validation
# =============================================================================

@then("the response should contain Swagger UI HTML")
def check_swagger_ui_html(context: dict):
    """Verify that the response contains Swagger UI HTML."""
    response = context.get("api_docs_response")
    if response is None:
        pytest.fail("No API docs response found in context")

    content = response.text.lower()
    assert "swagger" in content, "Response should contain 'swagger'"
    assert "<!doctype html>" in content or "<!DOCTYPE html>" in response.text, "Response should be HTML"


@then("the OpenAPI specification is accessible")
def check_openapi_accessible(http_client: requests.Session, context: dict):
    """Verify that the OpenAPI specification is accessible."""
    url = f"{SERVICE_URLS['feedback-server']}/api/docs/openapi.json"
    try:
        response = http_client.get(url, timeout=15)
        assert response.status_code == 200, f"OpenAPI spec returned {response.status_code}"
        # Verify it's valid JSON
        spec = response.json()
        assert "openapi" in spec or "swagger" in spec, "Not a valid OpenAPI specification"
    except requests.exceptions.RequestException as e:
        pytest.fail(f"Failed to access OpenAPI spec: {e}")


@then("the response should be valid JSON")
def check_valid_json(context: dict):
    """Verify that the response is valid JSON."""
    response = context.get("openapi_response")
    if response is None:
        pytest.fail("No OpenAPI response found in context")

    try:
        context["parsed_json"] = response.json()
    except json.JSONDecodeError as e:
        pytest.fail(f"Response is not valid JSON: {e}")


@then("the specification contains required OpenAPI fields")
def check_openapi_fields(context: dict):
    """Verify that the OpenAPI spec contains required fields."""
    spec = context.get("parsed_json")
    if spec is None:
        response = context.get("openapi_response")
        if response:
            spec = response.json()
        else:
            pytest.fail("No OpenAPI spec found in context")

    # Check for required OpenAPI 3.0 fields
    assert "openapi" in spec or "swagger" in spec, "Missing openapi/swagger version field"
    assert "info" in spec, "Missing info field"
    assert "paths" in spec, "Missing paths field"

    # Check info has required fields
    info = spec.get("info", {})
    assert "title" in info, "Missing info.title"
    assert "version" in info, "Missing info.version"


# =============================================================================
# THEN STEPS - WebUI Validation
# =============================================================================

@then("the response should contain HTML with React root element")
def check_react_root(context: dict):
    """Verify that the response contains HTML with React root element."""
    response = context.get("webui_response")
    if response is None:
        pytest.fail("No WebUI response found in context")

    content = response.text
    assert '<!DOCTYPE html>' in content or '<!doctype html>' in content.lower(), "Response should be HTML"
    assert 'id="root"' in content, "Response should contain React root element"


@then("the response should reference Vite client")
def check_vite_client(context: dict):
    """Verify that the response references Vite client for dev mode."""
    response = context.get("webui_response")
    if response is None:
        pytest.fail("No WebUI response found in context")

    content = response.text
    # In dev mode, Vite injects its client script
    assert "@vite/client" in content or "vite" in content.lower(), "Response should reference Vite"


@then("static assets are accessible")
def check_static_assets(http_client: requests.Session, context: dict):
    """Verify that static assets are accessible."""
    # Try to access a known static asset or check that the main.tsx is served
    url = f"{SERVICE_URLS['webui']}/src/main.tsx"
    try:
        response = http_client.get(url, timeout=15)
        # In Vite dev mode, this returns transformed JS
        assert response.status_code == 200, f"Static asset returned {response.status_code}"
    except requests.exceptions.RequestException as e:
        pytest.fail(f"Failed to access static assets: {e}")


# =============================================================================
# THEN STEPS - Feedback Example Validation
# =============================================================================

@then("the response should be a valid HTML page")
def check_valid_html(context: dict):
    """Verify that the response is a valid HTML page."""
    response = context.get("example_response")
    if response is None:
        pytest.fail("No example response found in context")

    content = response.text
    assert "<!DOCTYPE html>" in content or "<!doctype html>" in content.lower(), "Response should be HTML"
    assert "<html" in content.lower(), "Response should contain html tag"
    assert "<body" in content.lower(), "Response should contain body tag"


# =============================================================================
# THEN STEPS - Health Validation
# =============================================================================

@then("the response should contain health status fields")
def check_health_fields(context: dict):
    """Verify that the health response contains required fields."""
    response = context.get("health_response")
    if response is None:
        pytest.fail("No health response found in context")

    try:
        health = response.json()
        context["health_data"] = health
    except json.JSONDecodeError as e:
        pytest.fail(f"Health response is not valid JSON: {e}")

    assert "status" in health, "Missing status field"
    assert "version" in health, "Missing version field"


@then("the database component should be healthy")
def check_database_health(context: dict):
    """Verify that the database component is healthy."""
    health = context.get("health_data")
    if health is None:
        response = context.get("health_response")
        if response:
            health = response.json()
        else:
            pytest.fail("No health data found in context")

    # Check overall status
    status = health.get("status", "unknown")
    assert status in ["healthy", "ok", "up"], f"Unhealthy status: {status}"

    # Check components if present
    components = health.get("components", [])
    if components:
        for component in components:
            if component.get("name", "").lower() in ["database", "db", "sqlite"]:
                component_status = component.get("status", "unknown")
                assert component_status in ["healthy", "ok", "up"], \
                    f"Database component unhealthy: {component_status}"


# =============================================================================
# THEN STEPS - Server Info Validation
# =============================================================================

@then("the response should contain server name")
def check_server_name(context: dict):
    """Verify that the info response contains server name."""
    response = context.get("info_response")
    if response is None:
        pytest.fail("No info response found in context")

    try:
        info = response.json()
        context["info_data"] = info
    except json.JSONDecodeError as e:
        pytest.fail(f"Info response is not valid JSON: {e}")

    assert "name" in info, "Missing name field"


@then("the response should contain API version")
def check_api_version(context: dict):
    """Verify that the info response contains API version."""
    info = context.get("info_data")
    if info is None:
        response = context.get("info_response")
        if response:
            info = response.json()
        else:
            pytest.fail("No info data found in context")

    assert "version" in info or "apiVersion" in info, "Missing version/apiVersion field"


@then("the response should contain documentation URL")
def check_docs_url(context: dict):
    """Verify that the info response contains documentation URL."""
    info = context.get("info_data")
    if info is None:
        response = context.get("info_response")
        if response:
            info = response.json()
        else:
            pytest.fail("No info data found in context")

    # Check for any form of docs URL field
    has_docs_url = any([
        "docs" in info,
        "docsUrl" in info,
        "documentation" in info,
        "docsURL" in info,
    ])
    assert has_docs_url, f"Missing documentation URL field. Keys found: {list(info.keys())}"
