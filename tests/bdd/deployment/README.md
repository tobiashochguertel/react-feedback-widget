# BDD Deployment Tests

This directory contains BDD (Behavior-Driven Development) tests for verifying the Reference Deployment of React Visual Feedback.

## Overview

These tests validate the **deployment infrastructure** (Dockerfiles, Taskfiles, docker-compose, scripts) rather than application functionality.

## Prerequisites

- Python 3.11+
- Docker
- Task (go-task)
- pip or uv for package installation

## Installation

```bash
# Navigate to test directory
cd tests/bdd/deployment

# Install dependencies
pip install -r requirements.txt
# or
uv pip install -r requirements.txt
```

## Running Tests

### Run All Tests

```bash
# From the tests/bdd/deployment directory
pytest

# With verbose output
pytest -v

# With specific markers
pytest -m "high_priority"
pytest -m "quick_evaluation"
```

### Run Specific Features

```bash
# Quick evaluation tests
pytest step_defs/test_quick_evaluation.py

# Developer workflow tests
pytest step_defs/test_developer_workflow.py

# Production deployment tests
pytest step_defs/test_production_deployment.py

# Diagnostics tests
pytest step_defs/test_diagnostics.py

# Safety tests
pytest step_defs/test_safety.py
```

### Run by Tag

```bash
# High priority tests only
pytest -m "high_priority"

# Medium priority tests
pytest -m "medium_priority"

# Specific user story
pytest -k "US-DEV-001"
```

## Test Structure

```
tests/bdd/deployment/
├── conftest.py                      # Shared fixtures
├── pytest.ini                       # pytest configuration
├── requirements.txt                 # Test dependencies
├── README.md                        # This file
│
├── features/                        # Gherkin feature files
│   ├── 01_quick_evaluation.feature
│   ├── 02_developer_workflow.feature
│   ├── 03_production_deployment.feature
│   ├── 04_diagnostics.feature
│   └── 05_safety.feature
│
├── step_defs/                       # Step definitions
│   ├── __init__.py
│   ├── conftest.py                  # Step-specific fixtures
│   ├── test_quick_evaluation.py
│   ├── test_developer_workflow.py
│   ├── test_production_deployment.py
│   ├── test_diagnostics.py
│   └── test_safety.py
│
└── helpers/                         # Test utilities
    └── __init__.py
```

## Feature Coverage

| Feature                  | User Stories            | Priority | Description                    |
| ------------------------ | ----------------------- | -------- | ------------------------------ |
| Quick Evaluation         | US-DEV-001, 002, 003    | High     | First-time setup experience    |
| Developer Workflow       | US-DEV-004, 005, 006, 007 | High   | Development environment        |
| Production Deployment    | US-DEV-008, 009, 010    | High     | Production configuration       |
| Diagnostics              | US-DEV-011, 012         | Medium   | Troubleshooting and validation |
| Safety                   | US-DEV-015              | High     | Data protection                |

## Test Reports

```bash
# Generate HTML report
pytest --html=report.html --self-contained-html

# Generate JUnit XML (for CI)
pytest --junitxml=results.xml
```

## Troubleshooting

### Docker Not Running

```
pytest.skip: Docker is not running - skipping test
```

**Solution**: Start Docker daemon before running tests.

### Task Not Installed

```
pytest.skip: Task is not installed - skipping test
```

**Solution**: Install Task from https://taskfile.dev

### Port Already in Use

If tests fail due to port conflicts, ensure no other services are using ports 3001, 3002, or 5173.

```bash
# Check what's using the ports
lsof -i :3001
lsof -i :3002
lsof -i :5173
```

## Related Documentation

- [User Stories](../../../docs/spec/004.deployment-verification-user-stories/README.md)
- [BDD Specification](../../../docs/spec/005.deployment-verification-bdd/README.md)
- [Deployment Tasks](../../../docs/spec/002.reference-deployment-tasks/README.md)
