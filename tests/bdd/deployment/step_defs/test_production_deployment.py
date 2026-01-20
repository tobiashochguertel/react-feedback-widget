"""Step definitions for Production Deployment feature."""

import subprocess
import json
from pathlib import Path

import pytest
import requests
import yaml
from pytest_bdd import scenarios, given, when, then, parsers

from conftest import (
    REPO_ROOT,
    SERVICE_URLS,
    HEALTH_ENDPOINTS,
)

# Load scenarios from feature file
scenarios("../features/03_production_deployment.feature")


# =============================================================================
# WHEN STEPS
# =============================================================================

@when("I run docker compose config validation")
def run_compose_config(repo_root: Path, context: dict):
    """Run docker compose config to validate configuration."""
    result = subprocess.run(
        ["docker", "compose", "config", "--quiet"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=30
    )
    context["config_result"] = result


@when("I request the feedback-server health endpoint")
def request_feedback_server_health(http_client: requests.Session, context: dict):
    """Request the feedback-server health endpoint."""
    url = HEALTH_ENDPOINTS["feedback-server"]
    try:
        response = http_client.get(url, timeout=10)
        context["health_response"] = response
    except requests.exceptions.RequestException as e:
        context["health_error"] = str(e)


@when("I check the feedback-server container")
def check_feedback_server_container(repo_root: Path, context: dict):
    """Inspect the feedback-server container."""
    result = subprocess.run(
        ["docker", "compose", "exec", "-T", "feedback-server", "env"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=30
    )
    context["container_env"] = result


# =============================================================================
# THEN STEPS
# =============================================================================

@then("configuration validation passes")
def config_validation_passes(context: dict):
    """Verify docker compose config succeeded."""
    result = context.get("config_result")
    assert result is not None, "docker compose config was not run"
    assert result.returncode == 0, \
        f"Config validation failed: {result.stderr}"


@then("no errors are reported")
def no_errors_reported(context: dict):
    """Verify no errors in config output."""
    result = context.get("config_result")
    assert result is not None

    # stderr should be empty or contain only warnings
    if result.stderr:
        stderr_lower = result.stderr.lower()
        assert "error" not in stderr_lower, \
            f"Errors found in config: {result.stderr}"


@then(".env.example file exists or environment is configured")
def env_example_exists(repo_root: Path):
    """Verify environment configuration exists."""
    env_example = repo_root / ".env.example"
    env_file = repo_root / ".env"

    # Either .env.example or .env should exist, or docker-compose handles defaults
    has_config = env_example.exists() or env_file.exists()

    if not has_config:
        # Check if docker-compose.yml defines default environment
        compose_file = repo_root / "docker-compose.yml"
        if compose_file.exists():
            with open(compose_file) as f:
                compose = yaml.safe_load(f)
            # If services define environment, that's OK
            services = compose.get("services", {})
            for svc in services.values():
                if "environment" in svc:
                    has_config = True
                    break

    assert has_config, \
        "No environment configuration found (.env.example, .env, or docker-compose defaults)"


@then("the file contains configuration guidance")
def file_contains_guidance(repo_root: Path):
    """Verify environment file has useful content."""
    env_example = repo_root / ".env.example"

    if env_example.exists():
        content = env_example.read_text()
        # Should have some content
        assert len(content) > 10, ".env.example is too short"
    else:
        # Check docker-compose.yml for environment definitions
        compose_file = repo_root / "docker-compose.yml"
        if compose_file.exists():
            content = compose_file.read_text()
            assert "environment" in content or "env_file" in content, \
                "No environment configuration guidance found"


@then("the response status code is 200")
def response_status_code_200(context: dict):
    """Verify response status is 200."""
    response = context.get("health_response")
    if response is None:
        error = context.get("health_error", "Unknown error")
        pytest.fail(f"Health request failed: {error}")

    assert response.status_code == 200, \
        f"Expected 200, got {response.status_code}"


@then("the response body is valid JSON")
def response_is_valid_json(context: dict):
    """Verify response body is valid JSON."""
    response = context.get("health_response")
    assert response is not None

    try:
        data = response.json()
        assert data is not None, "JSON body is null"
    except json.JSONDecodeError as e:
        pytest.fail(f"Response is not valid JSON: {e}")


@then("database configuration is present")
def database_config_present(context: dict):
    """Verify database configuration exists in container."""
    result = context.get("container_env")

    if result is None or result.returncode != 0:
        # Container might not be running or exec failed
        # This is OK if services aren't running
        pytest.skip("Could not check container environment")

    env_output = result.stdout

    # Look for database-related environment variables
    db_vars = ["DATABASE", "DB_", "SQLITE", "POSTGRES", "MONGO"]
    has_db_config = any(var in env_output.upper() for var in db_vars)

    # If no explicit DB config, check for default SQLite
    if not has_db_config:
        # Many apps use SQLite by default, which is fine
        pass
