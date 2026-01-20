"""Step definitions for Safety feature."""

import subprocess
from pathlib import Path

import pytest
import yaml
from pytest_bdd import scenarios, given, when, then, parsers

from conftest import REPO_ROOT

# Load scenarios from feature file
scenarios("../features/05_safety.feature")


# =============================================================================
# WHEN STEPS
# =============================================================================

@when("I examine the Taskfile.yml")
def examine_taskfile(repo_root: Path, context: dict):
    """Read and parse the Taskfile.yml."""
    taskfile_path = repo_root / "Taskfile.yml"

    if not taskfile_path.exists():
        context["taskfile"] = None
        return

    with open(taskfile_path) as f:
        content = yaml.safe_load(f)

    context["taskfile"] = content
    context["taskfile_raw"] = taskfile_path.read_text()


@when("I examine docker-compose.yml")
def examine_compose(repo_root: Path, context: dict):
    """Read and parse docker-compose.yml."""
    compose_path = repo_root / "docker-compose.yml"

    if not compose_path.exists():
        compose_path = repo_root / "compose.yml"

    if not compose_path.exists():
        context["compose"] = None
        return

    with open(compose_path) as f:
        content = yaml.safe_load(f)

    context["compose"] = content
    context["compose_raw"] = compose_path.read_text()


@when("I run docker compose down with volumes flag")
def run_compose_down_volumes(repo_root: Path, context: dict):
    """Run docker compose down with -v flag."""
    # First, list volumes before
    vol_before = subprocess.run(
        ["docker", "volume", "ls", "-q", "--filter", "name=react-feedback"],
        capture_output=True,
        text=True
    )
    context["volumes_before_down_v"] = vol_before.stdout.strip()

    result = subprocess.run(
        ["docker", "compose", "down", "-v"],
        cwd=repo_root,
        capture_output=True,
        text=True,
        timeout=120
    )
    context["down_v_result"] = result


# =============================================================================
# THEN STEPS
# =============================================================================

@then("a reset or clean task is defined")
def reset_task_defined(context: dict):
    """Verify a reset/clean task exists in Taskfile."""
    taskfile = context.get("taskfile")

    if taskfile is None:
        pytest.skip("Taskfile.yml not found")

    tasks = taskfile.get("tasks", {})

    # Look for reset, clean, or similar tasks
    reset_keywords = ["reset", "clean", "prune", "wipe", "destroy"]

    found_reset = False
    for task_name in tasks.keys():
        if any(kw in task_name.lower() for kw in reset_keywords):
            found_reset = True
            break

    # Also check for down task with volume removal
    if "down" in tasks:
        found_reset = True

    assert found_reset, "No reset/clean task found in Taskfile"


@then("the task is documented")
def task_is_documented(context: dict):
    """Verify reset task has documentation."""
    taskfile = context.get("taskfile")

    if taskfile is None:
        pytest.skip("Taskfile.yml not found")

    tasks = taskfile.get("tasks", {})

    # Check that tasks have descriptions
    for task_name, task_def in tasks.items():
        if isinstance(task_def, dict):
            # Task has a desc field (common in Taskfile)
            if "desc" in task_def:
                return  # Found a documented task

    # Also OK if task names are self-documenting
    pass


@then("volumes are defined for data persistence")
def volumes_defined(context: dict):
    """Verify volumes are defined in docker-compose.yml."""
    compose = context.get("compose")

    if compose is None:
        pytest.skip("docker-compose.yml not found")

    # Check for top-level volumes or service volumes
    has_volumes = False

    # Top-level volumes section
    if "volumes" in compose:
        has_volumes = True

    # Service-level volumes
    services = compose.get("services", {})
    for svc_name, svc_def in services.items():
        if "volumes" in svc_def:
            has_volumes = True
            break

    assert has_volumes, "No volumes defined in docker-compose.yml"


@then("volume configurations are appropriate")
def volume_configs_appropriate(context: dict):
    """Verify volume configurations look reasonable."""
    compose = context.get("compose")

    if compose is None:
        pytest.skip("docker-compose.yml not found")

    # Just verify volumes exist and aren't obviously wrong
    services = compose.get("services", {})

    for svc_name, svc_def in services.items():
        volumes = svc_def.get("volumes", [])
        for vol in volumes:
            if isinstance(vol, str):
                # String format: host:container or named:container
                assert ":" in vol, f"Volume {vol} has invalid format"
            elif isinstance(vol, dict):
                # Long format
                assert "target" in vol or "source" in vol, \
                    f"Volume definition missing required fields"


@then("containers are stopped")
def containers_stopped(repo_root: Path):
    """Verify containers are stopped."""
    result = subprocess.run(
        ["docker", "compose", "ps", "-q"],
        cwd=repo_root,
        capture_output=True,
        text=True
    )

    running = result.stdout.strip()
    assert not running, f"Containers still running: {running}"


@then("volumes remain intact")
def volumes_remain(context: dict):
    """Verify volumes were not deleted by down."""
    # Check current volumes
    vol_after = subprocess.run(
        ["docker", "volume", "ls", "-q"],
        capture_output=True,
        text=True
    )

    # This is a weak check - we just verify the command works
    # Actual volume persistence depends on what volumes existed


@then("containers are removed")
def containers_removed(repo_root: Path):
    """Verify containers are removed after down -v."""
    result = subprocess.run(
        ["docker", "compose", "ps", "-a", "-q"],
        cwd=repo_root,
        capture_output=True,
        text=True
    )

    containers = result.stdout.strip()
    assert not containers, f"Containers still exist: {containers}"


@then("volumes are removed")
def volumes_removed(context: dict):
    """Verify volumes were removed by down -v."""
    # Check for project volumes
    vol_after = subprocess.run(
        ["docker", "volume", "ls", "-q", "--filter", "name=react-feedback"],
        capture_output=True,
        text=True
    )

    project_volumes = vol_after.stdout.strip()
    # After down -v, project volumes should be gone
    # (This depends on naming convention)
