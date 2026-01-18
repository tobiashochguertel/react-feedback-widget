#!/usr/bin/env bash
#
# Feedback CLI Installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Murali1889/react-feedback-widget/main/packages/feedback-server-cli/scripts/install.sh | bash
#
# Options:
#   VERSION=v0.1.0 ./install.sh  # Install specific version
#

set -euo pipefail

# Configuration
REPO="Murali1889/react-feedback-widget"
BINARY_NAME="feedback-cli"
INSTALL_DIR="${HOME}/.local/bin"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Detect OS and Architecture
detect_platform() {
    local os arch

    os=$(uname -s | tr '[:upper:]' '[:lower:]')
    arch=$(uname -m)

    case "$os" in
        linux*)
            OS="linux"
            ;;
        darwin*)
            OS="darwin"
            ;;
        mingw* | msys* | cygwin*)
            OS="windows"
            ;;
        *)
            error "Unsupported operating system: $os"
            ;;
    esac

    case "$arch" in
        x86_64 | amd64)
            ARCH="x64"
            ;;
        arm64 | aarch64)
            ARCH="arm64"
            ;;
        *)
            error "Unsupported architecture: $arch"
            ;;
    esac

    info "Detected platform: ${OS}-${ARCH}"
}

# Get latest release version
get_latest_version() {
    local version

    if [[ -n "${VERSION:-}" ]]; then
        RELEASE_VERSION="$VERSION"
        info "Using specified version: $RELEASE_VERSION"
        return
    fi

    info "Fetching latest version..."

    version=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases" | \
        grep -o '"tag_name": "cli-v[^"]*"' | \
        head -1 | \
        sed 's/"tag_name": "//;s/"//')

    if [[ -z "$version" ]]; then
        error "Could not determine latest version. Please specify VERSION=cli-vX.Y.Z"
    fi

    RELEASE_VERSION="$version"
    info "Latest version: $RELEASE_VERSION"
}

# Download and install binary
install_binary() {
    local binary_name download_url tmp_dir

    # Construct binary name
    if [[ "$OS" == "windows" ]]; then
        binary_name="${BINARY_NAME}-${OS}-${ARCH}.exe"
    else
        binary_name="${BINARY_NAME}-${OS}-${ARCH}"
    fi

    download_url="https://github.com/${REPO}/releases/download/${RELEASE_VERSION}/${binary_name}"

    info "Downloading ${binary_name}..."

    tmp_dir=$(mktemp -d)
    trap 'rm -rf "$tmp_dir"' EXIT

    if ! curl -fsSL -o "${tmp_dir}/${binary_name}" "$download_url"; then
        error "Failed to download binary from: $download_url"
    fi

    # Create install directory
    mkdir -p "$INSTALL_DIR"

    # Install binary
    local target_path="${INSTALL_DIR}/${BINARY_NAME}"

    mv "${tmp_dir}/${binary_name}" "$target_path"
    chmod +x "$target_path"

    success "Installed ${BINARY_NAME} to ${target_path}"
}

# Add to PATH if needed
configure_path() {
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        warn "$INSTALL_DIR is not in your PATH"
        echo ""
        echo "Add the following to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
        echo ""
        echo "    export PATH=\"\$PATH:$INSTALL_DIR\""
        echo ""
    fi
}

# Verify installation
verify_installation() {
    local version

    if command -v "$BINARY_NAME" &> /dev/null; then
        version=$("$BINARY_NAME" --version 2>/dev/null || echo "unknown")
        success "Verified installation: ${BINARY_NAME} ${version}"
    elif [[ -x "${INSTALL_DIR}/${BINARY_NAME}" ]]; then
        version=$("${INSTALL_DIR}/${BINARY_NAME}" --version 2>/dev/null || echo "unknown")
        success "Verified installation: ${BINARY_NAME} ${version}"
    else
        warn "Could not verify installation. Please check your PATH."
    fi
}

# Main
main() {
    echo ""
    echo "╔══════════════════════════════════════╗"
    echo "║     Feedback CLI Installer           ║"
    echo "╚══════════════════════════════════════╝"
    echo ""

    detect_platform
    get_latest_version
    install_binary
    configure_path
    verify_installation

    echo ""
    success "Installation complete! 🎉"
    echo ""
    echo "Get started with:"
    echo "    ${BINARY_NAME} --help"
    echo ""
}

main "$@"
