#!/bin/bash

# FoodSave AI - Automatic Table of Contents Generator
# Generates and updates TOC for the entire project
# Usage: ./scripts/generate_toc.sh [--main] [--docs] [--all] [--check]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOC_FILE="$PROJECT_ROOT/docs/TOC.md"
MAIN_README="$PROJECT_ROOT/README.md"
DOCS_DIR="$PROJECT_ROOT/docs"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to generate main project TOC
generate_main_toc() {
    print_header "Generating Main Project TOC"
    
    cat > "$TOC_FILE" << 'EOF'
# 📚 FoodSave AI – Table of Contents (Auto-generated)

## 1. Project Overview & Quick Start
- [README.md](../README.md) – Project summary, quick start, architecture, status
- [docs/README.md](README.md) – Extended overview, features, stack, configuration

## 2. System Architecture & Design
- [docs/ARCHITECTURE_DOCUMENTATION.md](ARCHITECTURE_DOCUMENTATION.md) – System architecture, diagrams, data flow, components
- [docs/INFORMATION_ARCHITECTURE.md](INFORMATION_ARCHITECTURE.md) – Information architecture, navigation, user flows

## 3. AI Agents & Core Features
- [docs/AGENTS_GUIDE.md](AGENTS_GUIDE.md) – AI agent system, responsibilities, implementation
- [docs/RECEIPT_ANALYSIS_GUIDE.md](RECEIPT_ANALYSIS_GUIDE.md) – Receipt analysis, OCR, categorization, normalization
- [docs/RAG_SYSTEM_GUIDE.md](RAG_SYSTEM_GUIDE.md) – Retrieval-Augmented Generation (RAG), vector store, API, CLI
- [docs/CONCISE_RESPONSES_IMPLEMENTATION.md](CONCISE_RESPONSES_IMPLEMENTATION.md) – Concise responses, map-reduce, frontend integration
- [docs/ANTI_HALLUCINATION_GUIDE.md](ANTI_HALLUCINATION_GUIDE.md) – Anti-hallucination system, prompt engineering, validation
- [docs/DATE_TIME_QUERY_GUIDE.md](DATE_TIME_QUERY_GUIDE.md) – Date/time queries, instant system responses

## 4. API Reference & Integration
- [docs/API_REFERENCE.md](API_REFERENCE.md) – Full API reference, endpoints, request/response examples
- [docs/TELEGRAM_BOT_INTEGRATION_REPORT.md](TELEGRAM_BOT_INTEGRATION_REPORT.md) – Telegram Bot API integration, architecture, code, troubleshooting

## 5. Testing & Quality Assurance
- [docs/TESTING_GUIDE.md](TESTING_GUIDE.md) – Testing strategy, types, coverage, examples
- [docs/FINAL_TEST_STATUS.md](../tests/FINAL_TEST_STATUS.md) – Final test status
- [../backend_test_results.txt](../backend_test_results.txt) – Backend test results
- [../frontend_test_results.txt](../frontend_test_results.txt) – Frontend test results
- [docs/CRITICAL_FIXES_SUMMARY.md](../CRITICAL_FIXES_SUMMARY.md) – Critical fixes summary
- [docs/TEST_EXECUTION_SUMMARY.md](../TEST_EXECUTION_SUMMARY.md) – Test execution summary

## 6. Monitoring, Performance & Optimization
- [docs/MONITORING_TELEMETRY_GUIDE.md](MONITORING_TELEMETRY_GUIDE.md) – Monitoring, metrics, dashboards, logging
- [docs/MODEL_OPTIMIZATION_GUIDE.md](MODEL_OPTIMIZATION_GUIDE.md) – Model optimization, caching, deployment
- [docs/CONVERSATION_CONTEXT_MANAGEMENT.md](CONVERSATION_CONTEXT_MANAGEMENT.md) – Conversation context, memory, summarization

## 7. Database, Backup & Data Management
- [docs/DATABASE_GUIDE.md](DATABASE_GUIDE.md) – Database schema, ERD, models, migrations
- [docs/BACKUP_SYSTEM_GUIDE.md](BACKUP_SYSTEM_GUIDE.md) – Backup system, retention, verification, restore

## 8. Deployment, DevOps & Security
- [docs/DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) – Deployment (dev/prod), Docker, environment, SSL, troubleshooting
- [docs/TELEGRAM_BOT_DEPLOYMENT_GUIDE.md](TELEGRAM_BOT_DEPLOYMENT_GUIDE.md) – Telegram Bot deployment, configuration, security

## 9. Frontend Implementation & UX
- [docs/frontend-implementation-plan.md](frontend-implementation-plan.md) – Frontend implementation plan
- [docs/frontend-implementation-checklist.md](frontend-implementation-checklist.md) – Frontend implementation checklist

## 10. Contribution, Roadmap & Governance
- [docs/CONTRIBUTING_GUIDE.md](CONTRIBUTING_GUIDE.md) – Contribution guidelines, workflow, code standards
- [../ROADMAP.md](../ROADMAP.md) – Roadmap, planned features, phases

---

## ⭐️ Best Practices for Documentation Structure

- **Single Source of Truth:** Main README as entry point, linking to detailed guides.
- **Topic-based sub-guides:** Each area (AI, API, testing, monitoring, deployment) has its own guide.
- **Table of Contents:** Each long file should have its own TOC at the top.
- **Examples & diagrams:** Every guide includes code samples, diagrams, API calls.
- **Troubleshooting sections:** In deployment, backup, and integration guides.
- **Status & update dates:** At the end of each guide – last update date and status.
- **Links to Swagger/Redoc:** In API Reference and README.
- **Checklists & roadmaps:** For development, testing, deployment.

---

*Generated automatically on $(date) – update as documentation evolves.*
EOF

    print_status "Main TOC generated: $TOC_FILE"
}

# Function to generate mini-TOC for individual markdown files
generate_mini_toc() {
    local file="$1"
    local filename=$(basename "$file")
    local dirname=$(dirname "$file")
    
    # Skip if file doesn't exist or is not markdown
    if [[ ! -f "$file" ]] || [[ ! "$filename" =~ \.md$ ]]; then
        return
    fi
    
    # Skip if file is too small (less than 100 lines)
    local line_count=$(wc -l < "$file" 2>/dev/null || echo "0")
    if [[ $line_count -lt 100 ]]; then
        return
    fi
    
    print_status "Generating mini-TOC for: $filename"
    
    # Create temporary file for new content
    local temp_file=$(mktemp)
    
    # Extract title from first line
    local title=$(head -n 1 "$file" | sed 's/^# //')
    
    # Generate mini-TOC
    cat > "$temp_file" << EOF
# $title

## Table of Contents

EOF
    
    # Extract headers and create TOC
    grep -E '^#{1,3} ' "$file" | while read -r header; do
        local level=$(echo "$header" | sed 's/^#* .*$/#/' | wc -c)
        local indent=$(printf '%*s' $((level - 1)) '')
        local text=$(echo "$header" | sed 's/^#* //')
        local anchor=$(echo "$text" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-\|-$//g')
        
        echo "${indent}- [$text](#$anchor)" >> "$temp_file"
    done
    
    echo "" >> "$temp_file"
    echo "---" >> "$temp_file"
    echo "" >> "$temp_file"
    
    # Add original content (skip first line if it's just a title)
    if [[ $(head -n 1 "$file") =~ ^#\ .*$ ]]; then
        tail -n +2 "$file" >> "$temp_file"
    else
        cat "$file" >> "$temp_file"
    fi
    
    # Replace original file
    mv "$temp_file" "$file"
    
    print_status "Mini-TOC added to: $filename"
}

# Function to scan and generate mini-TOC for all markdown files
generate_all_mini_tocs() {
    print_header "Generating Mini-TOC for all markdown files"
    
    # Find all markdown files
    local markdown_files=$(find "$PROJECT_ROOT" -name "*.md" -type f | grep -v node_modules | grep -v .git)
    
    local count=0
    for file in $markdown_files; do
        if [[ -f "$file" ]]; then
            generate_mini_toc "$file"
            ((count++))
        fi
    done
    
    print_status "Generated mini-TOC for $count markdown files"
}

# Function to check TOC consistency
check_toc_consistency() {
    print_header "Checking TOC Consistency"
    
    local issues=0
    
    # Check if main TOC exists
    if [[ ! -f "$TOC_FILE" ]]; then
        print_error "Main TOC file missing: $TOC_FILE"
        ((issues++))
    fi
    
    # Check if main README has TOC section
    if ! grep -q "Table of Contents" "$MAIN_README" 2>/dev/null; then
        print_warning "Main README missing TOC section"
        ((issues++))
    fi
    
    # Check for broken links in TOC
    if [[ -f "$TOC_FILE" ]]; then
        local broken_links=0
        while IFS= read -r line; do
            # Use grep instead of bash regex for better compatibility
            if echo "$line" | grep -q '\[.*\]([^)]*)'; then
                local link=$(echo "$line" | sed -n 's/.*\[.*\](\([^)]*\)).*/\1/p')
                if [[ $link =~ ^\.\./ ]] || [[ $link =~ ^[^/] ]]; then
                    local full_path="$PROJECT_ROOT/docs/$link"
                    if [[ ! -f "$full_path" ]] && [[ ! -f "$link" ]]; then
                        print_warning "Broken link in TOC: $link"
                        ((broken_links++))
                    fi
                fi
            fi
        done < "$TOC_FILE"
        
        if [[ $broken_links -gt 0 ]]; then
            print_error "Found $broken_links broken links in TOC"
            ((issues++))
        fi
    fi
    
    # Check for files without mini-TOC
    local files_without_toc=0
    local markdown_files=$(find "$PROJECT_ROOT" -name "*.md" -type f | grep -v node_modules | grep -v .git)
    
    for file in $markdown_files; do
        if [[ -f "$file" ]]; then
            local line_count=$(wc -l < "$file" 2>/dev/null || echo "0")
            if [[ $line_count -ge 100 ]] && ! grep -q "## Table of Contents" "$file"; then
                print_warning "Large markdown file without mini-TOC: $file"
                ((files_without_toc++))
            fi
        fi
    done
    
    if [[ $files_without_toc -gt 0 ]]; then
        print_warning "Found $files_without_toc large files without mini-TOC"
        ((issues++))
    fi
    
    if [[ $issues -eq 0 ]]; then
        print_status "TOC consistency check passed ✓"
    else
        print_error "TOC consistency check failed with $issues issues"
        return 1
    fi
}

# Function to show usage
show_usage() {
    cat << EOF
FoodSave AI - Automatic Table of Contents Generator

Usage: $0 [OPTIONS]

Options:
    --main          Generate main project TOC only
    --docs          Generate mini-TOC for documentation files only
    --all           Generate both main TOC and all mini-TOC (default)
    --check         Check TOC consistency without generating
    --help          Show this help message

Examples:
    $0 --main       # Generate only main TOC
    $0 --docs       # Generate mini-TOC for docs only
    $0 --all        # Generate everything
    $0 --check      # Check consistency only

EOF
}

# Main function
main() {
    cd "$PROJECT_ROOT"
    
    case "${1:---all}" in
        --main)
            generate_main_toc
            ;;
        --docs)
            generate_all_mini_tocs
            ;;
        --all)
            generate_main_toc
            generate_all_mini_tocs
            ;;
        --check)
            check_toc_consistency
            ;;
        --help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
    
    print_status "TOC generation completed successfully!"
}

# Run main function with all arguments
main "$@" 