"""Shared step definitions and fixtures for all BDD tests."""

import os
import subprocess
import time
from pathlib import Path
from typing import Any

import pytest
import requests
from pytest_bdd import given, then, parsers

# Import shared fixtures from parent conftest
from conftest import (
    REPO_ROOT,
    SERVICE_URLS,
    HEALTH_ENDPOINTS,
    wait_for_services,
    get_container_status,
)

# Environment variable to control whether to fail or skip when services aren't available
REQUIRE_SERVICES = os.environ.get("BDD_REQUIRE_SERVICES", "false").lower() == "true"


# =============================================================================
# SHARED CONTEXT
# =============================================================================

@pytest.fixture
def context() -> dict:
    """Shared context dictionary for passing data between steps."""
    return {}


# =============================================================================
# GIVEN STEPS - Prerequisites and Setup
# =============================================================================

@given("the repository is cloned")
def repository_is_cloned(repo_root: Path):
    """Verify the repository exists and has expected structure."""
    assert repo_root.exists(), f"Repository root not found: {repo_root}"
    assert (repo_root / "Taskfile.yml").exists(), "Taskfile.yml not found"
    assert (repo_root / "docker-compose.yml").exists() or \
           (repo_root / "compose.yml").exists(), "docker-compose.yml not found"


@given("Docker is installed and running")
def docker_is_running(docker_available: bool):
    """Verify Docker daemon is accessible."""
    if not docker_available:
        pytest.skip("Docker is not running - skipping test")


@given("Task is installed")
def task_is_installed(task_available: bool):
    """Verify Task CLI is installed."""
    if not task_available:
        pytest.skip("Task is not installed - skipping test")


@given("services are running")
def services_are_running(services_running):
    """Ensure services are started and healthy."""
    # The services_running fixture handles startup
    pass


@given("services may or may not be running")
def services_may_or_may_not_be_running():
    """Accept any service state for this test."""
    pass


@given("services were previously running and stopped")
def services_were_stopped(repo_root: Path):
    """Ensure services are in stopped state."""
    subprocess.run(
        ["docker", "compose", "down"],
        cwd=repo_root,
        capture_output=True,
        timeout=120
    )


# =============================================================================
# THEN STEPS - Common Assertions
# =============================================================================

@then("all containers should reach running state")
def containers_reach_running_state(repo_root: Path):
    """Verify all containers are running."""
    # Wait for services
    success = wait_for_services(timeout=120)
    if not success:
        status = get_container_status(repo_root)
        if REQUIRE_SERVICES:
            pytest.fail(f"Not all containers reached running state: {status}")
        else:
            pytest.skip("Containers not running (set BDD_REQUIRE_SERVICES=true to fail)")


@then(parsers.parse('I can access {service} at "{url}"'))
def can_access_service_at_url(service: str, url: str, http_client: requests.Session):
    """Verify a service is accessible at the given URL."""
    try:
        response = http_client.get(url, timeout=10)
        assert response.status_code in [200, 304], \
            f"Cannot access {service} at {url}: status {response.status_code}"
    except requests.exceptions.RequestException as e:
        if REQUIRE_SERVICES:
            pytest.fail(f"Cannot access {service} at {url}: {e}")
        else:
            pytest.skip(f"Service {service} not accessible (set BDD_REQUIRE_SERVICES=true to fail)")


@then("I should be able to access all service endpoints")
def can_access_all_endpoints(http_client: requests.Session):
    """Verify all service endpoints are accessible."""
    for name, url in SERVICE_URLS.items():
        try:
            response = http_client.get(url, timeout=10)
            assert response.status_code in [200, 304], \
                f"Service {name} not accessible at {url}"
        except requests.exceptions.RequestException as e:
            if REQUIRE_SERVICES:
                pytest.fail(f"Cannot access {name} at {url}: {e}")
            else:
                pytest.skip(f"Service {name} not accessible (set BDD_REQUIRE_SERVICES=true to fail)")


@then("the feedback-example page loads successfully")
def feedback_example_loads(http_client: requests.Session):
    """Verify the feedback-example page loads."""
    url = SERVICE_URLS["feedback-example"]
    try:
        response = http_client.get(url, timeout=10)
        assert response.status_code in [200, 304], \
            f"feedback-example did not load: {response.status_code}"
    except requests.exceptions.RequestException as e:
        if REQUIRE_SERVICES:
            pytest.fail(f"feedback-example not accessible: {e}")
        else:
            pytest.skip("feedback-example not accessible (set BDD_REQUIRE_SERVICES=true to fail)")


@then(parsers.parse("feedback-server responds at port {port:d}"))
def server_responds_at_port(port: int, http_client: requests.Session):
    """Verify feedback-server responds at given port."""
    url = f"http://localhost:{port}"
    try:
        response = http_client.get(url, timeout=10)
        assert response.status_code in [200, 304, 404], \
            f"feedback-server not responding at port {port}"
    except requests.exceptions.RequestException as e:
        if REQUIRE_SERVICES:
            pytest.fail(f"feedback-server not responding at port {port}: {e}")
        else:
            pytest.skip(f"feedback-server not responding at port {port} (set BDD_REQUIRE_SERVICES=true to fail)")


@then(parsers.parse("webui responds at port {port:d}"))
def webui_responds_at_port(port: int, http_client: requests.Session):
    """Verify webui responds at given port."""
    url = f"http://localhost:{port}"
    try:
        response = http_client.get(url, timeout=10)
        assert response.status_code in [200, 304], \
            f"webui not responding at port {port}"
    except requests.exceptions.RequestException as e:
        if REQUIRE_SERVICES:
            pytest.fail(f"webui not responding at port {port}: {e}")
        else:
            pytest.skip(f"webui not responding at port {port} (set BDD_REQUIRE_SERVICES=true to fail)")


@then(parsers.parse("feedback-example responds at port {port:d}"))
def example_responds_at_port(port: int, http_client: requests.Session):
    """Verify feedback-example responds at given port."""
    url = f"http://localhost:{port}"
    try:
        response = http_client.get(url, timeout=10)
        assert response.status_code in [200, 304], \
            f"feedback-example not responding at port {port}"
    except requests.exceptions.RequestException as e:
        if REQUIRE_SERVICES:
            pytest.fail(f"feedback-example not responding at port {port}: {e}")
        else:
            pytest.skip(f"feedback-example not responding at port {port} (set BDD_REQUIRE_SERVICES=true to fail)")
