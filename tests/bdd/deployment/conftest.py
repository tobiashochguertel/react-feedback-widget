"""Shared fixtures and configuration for BDD deployment tests."""

import os
import subprocess
import time
from pathlib import Path
from typing import Generator, Callable

import pytest
import requests


def get_repo_root() -> Path:
    """Find the repository root by looking for Taskfile.yml."""
    current = Path(__file__).parent
    for _ in range(10):  # Max 10 levels up
        if (current / "Taskfile.yml").exists():
            return current
        parent = current.parent
        if parent == current:
            break
        current = parent
    
    # Fallback: assume tests/bdd/deployment structure
    return Path(__file__).parent.parent.parent.parent


# Repository root path
REPO_ROOT = get_repo_root()

# Service URLs
SERVICE_URLS = {
    "feedback-server": "http://localhost:3001",
    "webui": "http://localhost:5173",
    "feedback-example": "http://localhost:3002",
}

# Health endpoints
HEALTH_ENDPOINTS = {
    "feedback-server": "http://localhost:3001/api/v1/health",
    "feedback-example": "http://localhost:3002",
    "webui": "http://localhost:5173",
}


@pytest.fixture(scope="session")
def repo_root() -> Path:
    """Return the repository root directory."""
    return REPO_ROOT


@pytest.fixture(scope="session")
def docker_available() -> bool:
    """Check if Docker daemon is running."""
    try:
        result = subprocess.run(
            ["docker", "info"],
            capture_output=True,
            timeout=10
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


@pytest.fixture(scope="session")
def task_available() -> bool:
    """Check if Task is installed."""
    try:
        result = subprocess.run(
            ["task", "--version"],
            capture_output=True,
            timeout=5
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False


@pytest.fixture(scope="session")
def skip_if_no_docker(docker_available: bool):
    """Skip test if Docker is not available."""
    if not docker_available:
        pytest.skip("Docker is not running")


@pytest.fixture(scope="session")
def skip_if_no_task(task_available: bool):
    """Skip test if Task is not available."""
    if not task_available:
        pytest.skip("Task is not installed")


@pytest.fixture
def run_task(repo_root: Path) -> Callable:
    """Fixture to run task commands."""
    def _run_task(
        task_name: str,
        timeout: int = 300,
        check: bool = False,
        input_text: str | None = None
    ) -> subprocess.CompletedProcess:
        """
        Run a task command.
        
        Args:
            task_name: Name of the task to run
            timeout: Command timeout in seconds
            check: If True, raise exception on failure
            input_text: Text to send to stdin
            
        Returns:
            CompletedProcess with stdout, stderr, returncode
        """
        return subprocess.run(
            ["task", task_name],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=timeout,
            input=input_text,
            check=check
        )
    return _run_task


@pytest.fixture
def run_docker_compose(repo_root: Path) -> Callable:
    """Fixture to run docker compose commands."""
    def _run_compose(
        *args: str,
        timeout: int = 300,
        check: bool = False
    ) -> subprocess.CompletedProcess:
        """Run docker compose command with given arguments."""
        cmd = ["docker", "compose", *args]
        return subprocess.run(
            cmd,
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=check
        )
    return _run_compose


@pytest.fixture
def http_client() -> requests.Session:
    """HTTP client for API testing."""
    session = requests.Session()
    session.timeout = 10
    return session


@pytest.fixture
def service_urls() -> dict:
    """Return service URLs dictionary."""
    return SERVICE_URLS.copy()


@pytest.fixture
def health_endpoints() -> dict:
    """Return health endpoints dictionary."""
    return HEALTH_ENDPOINTS.copy()


def wait_for_services(timeout: int = 120) -> bool:
    """
    Wait for all services to become healthy.
    
    Args:
        timeout: Maximum time to wait in seconds
        
    Returns:
        True if all services are healthy, False otherwise
    """
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        all_healthy = True
        
        for name, url in HEALTH_ENDPOINTS.items():
            try:
                response = requests.get(url, timeout=5)
                if response.status_code not in [200, 304]:
                    all_healthy = False
                    break
            except requests.exceptions.RequestException:
                all_healthy = False
                break
        
        if all_healthy:
            return True
        
        time.sleep(5)
    
    return False


@pytest.fixture(scope="module")
def services_running(
    repo_root: Path,
    docker_available: bool,
    task_available: bool
) -> Generator[None, None, None]:
    """
    Start services before tests and stop after.
    
    This is a module-scoped fixture that:
    1. Starts all services with 'task up'
    2. Waits for services to be healthy
    3. Yields control to tests
    4. Stops services with 'task down'
    """
    if not docker_available:
        pytest.skip("Docker is not running")
    if not task_available:
        pytest.skip("Task is not installed")
    
    # Check if services are already running
    already_running = False
    try:
        for url in HEALTH_ENDPOINTS.values():
            response = requests.get(url, timeout=2)
            if response.status_code in [200, 304]:
                already_running = True
    except requests.exceptions.RequestException:
        pass
    
    if not already_running:
        # Start services
        result = subprocess.run(
            ["task", "up"],
            cwd=repo_root,
            capture_output=True,
            text=True,
            timeout=600
        )
        
        if result.returncode != 0:
            pytest.fail(f"Failed to start services: {result.stderr}")
        
        # Wait for services to be healthy
        if not wait_for_services(timeout=180):
            # Try to get logs for debugging
            log_result = subprocess.run(
                ["docker", "compose", "logs", "--tail=50"],
                cwd=repo_root,
                capture_output=True,
                text=True
            )
            pytest.fail(f"Services did not become healthy. Logs:\n{log_result.stdout}")
    
    yield
    
    # Only stop if we started them
    if not already_running:
        subprocess.run(
            ["task", "down"],
            cwd=repo_root,
            capture_output=True,
            timeout=120
        )


@pytest.fixture
def fresh_environment(
    repo_root: Path,
    run_task: Callable
) -> Generator[None, None, None]:
    """
    Ensure a fresh environment for tests that need isolation.
    
    This fixture:
    1. Stops any running services
    2. Yields control to the test
    3. Cleans up after the test
    """
    # Stop any running services
    run_task("down", timeout=120)
    
    yield
    
    # Clean up after test
    run_task("down", timeout=120)


def get_container_status(repo_root: Path) -> dict:
    """
    Get status of all containers.
    
    Returns:
        Dictionary mapping container name to status
    """
    result = subprocess.run(
        ["docker", "compose", "ps", "--format", "{{.Name}}\t{{.State}}\t{{.Health}}"],
        cwd=repo_root,
        capture_output=True,
        text=True
    )
    
    status = {}
    for line in result.stdout.strip().split("\n"):
        if line:
            parts = line.split("\t")
            if len(parts) >= 2:
                name = parts[0]
                state = parts[1]
                health = parts[2] if len(parts) > 2 else "N/A"
                status[name] = {"state": state, "health": health}
    
    return status
