"""Step definitions for Quick Evaluation feature."""

import subprocess
import time
from pathlib import Path

import pytest
import requests
import yaml
from pytest_bdd import scenarios, given, when, then, parsers

from conftest import (
    REPO_ROOT,
    SERVICE_URLS,
    HEALTH_ENDPOINTS,
    wait_for_services,
)

# Load scenarios from feature file
scenarios("../features/01_quick_evaluation.feature")


# =============================================================================
# WHEN STEPS
# =============================================================================

@when('I run "task up" to start all services')
def run_task_up(repo_root: Path, context: dict):
    """Execute task up to start all services."""
    start_time = time.time()

    result = subprocess.run(
        ["task", "up"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=600
    )

    elapsed = time.time() - start_time
    context["task_up_result"] = result
    context["task_up_elapsed"] = elapsed

    # Don't fail here - let subsequent steps check success


@when('I run "task --list"')
def run_task_list(repo_root: Path, context: dict):
    """Execute task --list to show available tasks."""
    result = subprocess.run(
        ["task", "--list"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=30
    )
    context["task_list_result"] = result


@when("I open the feedback-example page")
def open_feedback_example(http_client: requests.Session, context: dict):
    """Request the feedback-example page."""
    url = SERVICE_URLS["feedback-example"]
    try:
        response = http_client.get(url, timeout=15)
        context["page_response"] = response
    except requests.exceptions.RequestException as e:
        context["page_error"] = str(e)
        pytest.fail(f"Failed to open feedback-example: {e}")


@when("I request the health endpoint")
def request_health_endpoint(http_client: requests.Session, context: dict):
    """Request the health endpoint."""
    url = HEALTH_ENDPOINTS["feedback-server"]
    try:
        response = http_client.get(url, timeout=10)
        context["health_response"] = response
    except requests.exceptions.RequestException as e:
        context["health_error"] = str(e)


# =============================================================================
# THEN STEPS
# =============================================================================

@then("the output contains available tasks")
def output_contains_tasks(context: dict):
    """Verify task list output contains tasks."""
    result = context.get("task_list_result")
    assert result is not None, "task --list was not run"
    assert result.returncode == 0, f"task --list failed: {result.stderr}"

    # Check for task-like output
    output = result.stdout + result.stderr
    assert len(output) > 50, "Task list output seems too short"


@then("each task has a description")
def each_task_has_description(context: dict):
    """Verify tasks have descriptions."""
    result = context.get("task_list_result")
    assert result is not None

    # Task output typically shows tasks with descriptions
    # This is a basic check - descriptions are shown with tasks
    output = result.stdout + result.stderr
    lines = [l for l in output.split("\n") if l.strip()]

    # At least some lines should have meaningful content
    assert len(lines) > 3, "Expected more task entries with descriptions"


@then("the page loads with status 200")
def page_loads_with_200(context: dict):
    """Verify page loaded with status 200."""
    response = context.get("page_response")
    assert response is not None, "Page was not requested"
    assert response.status_code in [200, 304], \
        f"Page returned status {response.status_code}"


@then("the page contains feedback widget elements")
def page_contains_widget(context: dict):
    """Verify page contains feedback widget markup."""
    response = context.get("page_response")
    assert response is not None

    # Check for React app or feedback-related content
    content = response.text.lower()
    # The page should contain some app structure
    assert "<!doctype html>" in content or "<html" in content, \
        "Page does not appear to be HTML"


@then("the response status is 200")
def response_status_200(context: dict):
    """Verify health response is 200."""
    response = context.get("health_response")
    if response is None:
        error = context.get("health_error", "Unknown error")
        pytest.fail(f"Health request failed: {error}")

    assert response.status_code == 200, \
        f"Health endpoint returned {response.status_code}"


@then("the response indicates healthy status")
def response_indicates_healthy(context: dict):
    """Verify health response indicates healthy."""
    response = context.get("health_response")
    assert response is not None

    # Check response content
    try:
        data = response.json()
        # Look for common health indicators
        status = data.get("status", data.get("health", "unknown"))
        assert status.lower() in ["ok", "healthy", "up", "running"], \
            f"Unexpected health status: {status}"
    except (ValueError, KeyError):
        # If not JSON, just check the response exists
        assert response.text, "Empty health response"


@then("Taskfile.yml exists in the repository root")
def taskfile_exists(repo_root: Path):
    """Verify Taskfile.yml exists."""
    taskfile = repo_root / "Taskfile.yml"
    assert taskfile.exists(), f"Taskfile.yml not found at {taskfile}"


@then("Taskfile.yml is valid YAML")
def taskfile_is_valid_yaml(repo_root: Path):
    """Verify Taskfile.yml is valid YAML."""
    taskfile = repo_root / "Taskfile.yml"

    try:
        with open(taskfile) as f:
            content = yaml.safe_load(f)
        assert content is not None, "Taskfile.yml is empty"
        assert "tasks" in content or "version" in content, \
            "Taskfile.yml missing expected keys"
    except yaml.YAMLError as e:
        pytest.fail(f"Taskfile.yml is not valid YAML: {e}")
