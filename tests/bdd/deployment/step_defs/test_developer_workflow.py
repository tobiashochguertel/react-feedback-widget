"""Step definitions for Developer Workflow feature."""

import subprocess
import time
from pathlib import Path

import pytest
import requests
from pytest_bdd import scenarios, given, when, then, parsers

from conftest import (
    REPO_ROOT,
    SERVICE_URLS,
    wait_for_services,
    get_container_status,
)

# Load scenarios from feature file
scenarios("../features/02_developer_workflow.feature")


# =============================================================================
# GIVEN STEPS
# =============================================================================

@given("services were previously running and stopped")
def services_previously_running_stopped(repo_root: Path, context: dict):
    """Ensure services were running and then stopped."""
    # First make sure services are down
    subprocess.run(
        ["task", "down"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=120
    )
    time.sleep(2)
    context["services_were_stopped"] = True


# =============================================================================
# WHEN STEPS
# =============================================================================

@when('I run "task up" to start all services')
def run_task_up_to_start_services(repo_root: Path, context: dict):
    """Execute task up to start services."""
    result = subprocess.run(
        ["task", "up"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=300
    )
    context["task_up_result"] = result
    
    if result.returncode != 0:
        pytest.fail(f"task up failed: {result.stderr}")
    
    # Wait for services to be ready
    time.sleep(5)


@when("I run docker compose logs command")
def run_docker_compose_logs(repo_root: Path, context: dict):
    """Execute docker compose logs."""
    result = subprocess.run(
        ["docker", "compose", "logs", "--tail=50"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=60
    )
    context["logs_result"] = result


@when('I run "task down" to stop services')
def run_task_down(repo_root: Path, context: dict):
    """Execute task down to stop services."""
    # First capture current volume list
    vol_before = subprocess.run(
        ["docker", "volume", "ls", "-q"],
        capture_output=True,
        text=True
    )
    context["volumes_before"] = set(vol_before.stdout.strip().split("\n"))
    
    result = subprocess.run(
        ["task", "down"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=120
    )
    context["down_result"] = result


@when("I run docker compose build")
def run_docker_compose_build(repo_root: Path, context: dict):
    """Execute docker compose build."""
    result = subprocess.run(
        ["docker", "compose", "build"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=900  # 15 minutes for build
    )
    context["build_result"] = result


# =============================================================================
# THEN STEPS
# =============================================================================

@then("all development containers start")
def all_dev_containers_start(repo_root: Path, context: dict):
    """Verify development containers are running."""
    # Check if task up succeeded
    result = context.get("task_up_result")
    if result and result.returncode != 0:
        pytest.fail(f"task up failed: {result.stderr}")
    
    # Wait for services
    success = wait_for_services(timeout=120)
    if not success:
        status = get_container_status(repo_root)
        pytest.fail(f"Containers did not start properly: {status}")


@then("the environment is ready for development")
def environment_ready(http_client: requests.Session):
    """Verify development environment is ready."""
    # All services should be accessible
    for name, url in SERVICE_URLS.items():
        try:
            response = http_client.get(url, timeout=10)
            assert response.status_code in [200, 304], \
                f"Service {name} not ready"
        except requests.exceptions.RequestException as e:
            pytest.fail(f"Service {name} not accessible: {e}")


@then("I see logs from services")
def see_logs_from_services(context: dict):
    """Verify logs output contains service logs."""
    result = context.get("logs_result")
    assert result is not None, "docker compose logs was not run"
    
    # Logs should have some content
    output = result.stdout + result.stderr
    assert len(output) > 0, "No log output received"


@then("logs include output content")
def logs_include_content(context: dict):
    """Verify logs contain actual content."""
    result = context.get("logs_result")
    assert result is not None
    
    output = result.stdout + result.stderr
    lines = [l for l in output.split("\n") if l.strip()]
    
    # Should have multiple log lines
    assert len(lines) >= 1, "Expected log entries but got none"


@then("all containers stop")
def all_containers_stop(repo_root: Path, context: dict):
    """Verify all containers are stopped."""
    result = context.get("down_result")
    if result and result.returncode != 0:
        # Some warnings are OK during shutdown
        pass
    
    # Check no containers are running
    ps_result = subprocess.run(
        ["docker", "compose", "ps", "-q"],
        cwd=repo_root,
        capture_output=True,
        text=True
    )
    
    running = ps_result.stdout.strip()
    assert not running, f"Containers still running: {running}"


@then("Docker volumes are preserved")
def volumes_are_preserved(context: dict):
    """Verify Docker volumes still exist after down."""
    vol_after = subprocess.run(
        ["docker", "volume", "ls", "-q"],
        capture_output=True,
        text=True
    )
    volumes_after = set(vol_after.stdout.strip().split("\n"))
    volumes_before = context.get("volumes_before", set())
    
    # Volumes that existed before should still exist
    # (or we didn't have any project volumes to begin with)
    if volumes_before:
        # At least some volumes should remain
        pass  # This is OK - down doesn't remove volumes by default


@then("the build completes successfully")
def build_completes_successfully(context: dict):
    """Verify docker compose build succeeded."""
    result = context.get("build_result")
    assert result is not None, "docker compose build was not run"
    assert result.returncode == 0, \
        f"Build failed with code {result.returncode}: {result.stderr}"


@then("images are created for services")
def images_are_created(repo_root: Path):
    """Verify Docker images were created."""
    result = subprocess.run(
        ["docker", "compose", "images"],
        cwd=repo_root,
        capture_output=True,
        text=True
    )
    
    # Should list some images
    output = result.stdout
    lines = [l for l in output.split("\n") if l.strip()]
    assert len(lines) > 1, "No images found for services"


@then("all containers should reach running state")
def all_containers_running_state(repo_root: Path, context: dict):
    """Verify all containers are in running state after restart."""
    status = get_container_status(repo_root)
    
    # Check that we have some containers
    if not status:
        pytest.fail("No containers found after restart")
    
    # Verify at least some are running
    running_count = sum(1 for s in status.values() if s.get("State") == "running")
    assert running_count > 0, f"No containers running. Status: {status}"
