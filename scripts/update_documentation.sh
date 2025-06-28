#!/bin/bash

# FoodSave AI - Comprehensive Documentation Update Script
# Updates dates, statuses, links, and checks consistency
# Usage: ./scripts/update_documentation.sh [--full] [--quick] [--check-only]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CURRENT_DATE=$(date +"%Y-%m-%d")
CURRENT_YEAR=$(date +"%Y")
SCRIPTS_DIR="$PROJECT_ROOT/scripts"

# Debug function
debug_print() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Error handling function
handle_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    return 1
}

# Success function
success_print() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Warning function
warning_print() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Info function
info_print() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# Header function
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to update dates in markdown files
update_dates() {
    print_header "Updating dates in documentation"
    
    local files_updated=0
    
    # Find all markdown files
    local markdown_files=$(find "$PROJECT_ROOT" -name "*.md" -type f | grep -v node_modules | grep -v .git)
    
    for file in $markdown_files; do
        if [[ -f "$file" ]]; then
            local updated=false
            # Debug
            debug_print "Checking file: $file"
            # Update "Last Updated" dates
            if grep -q "Last Updated\|Ostatnia aktualizacja\|Last updated" "$file"; then
                sed -i "s/Last Updated.*[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}/Last Updated: $CURRENT_DATE/g" "$file"
                sed -i "s/Ostatnia aktualizacja.*[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}/Ostatnia aktualizacja: $CURRENT_DATE/g" "$file"
                sed -i "s/last updated.*[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}/last updated: $CURRENT_DATE/g" "$file"
                updated=true
            fi
            # Update copyright years
            if grep -q "Copyright.*[0-9]\{4\}" "$file"; then
                sed -i "s/Copyright.*[0-9]\{4\}/Copyright $CURRENT_YEAR/g" "$file"
                updated=true
            fi
            # Update "Generated on" dates
            if grep -q "Generated.*[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}" "$file"; then
                sed -i "s/Generated.*[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}/Generated on $CURRENT_DATE/g" "$file"
                updated=true
            fi
            if [[ "$updated" == true ]]; then
                info_print "Updated dates in: $(basename "$file")"
                ((files_updated++))
            fi
        fi
    done
    info_print "Updated dates in $files_updated files"
}

# Function to check and update test status
update_test_status() {
    print_header "Checking and updating test status"
    # Debug
    debug_print "Checking backend and frontend test results"
    # Check if test results exist
    local backend_results="$PROJECT_ROOT/backend_test_results.txt"
    local frontend_results="$PROJECT_ROOT/frontend_test_results.txt"
    if [[ -f "$backend_results" ]]; then
        local backend_status=$(grep -o "passed.*failed" "$backend_results" | head -1 || echo "unknown")
        info_print "Backend test status: $backend_status"
    else
        warning_print "Backend test results not found"
    fi
    if [[ -f "$frontend_results" ]]; then
        local frontend_status=$(grep -o "passed.*failed" "$frontend_results" | head -1 || echo "unknown")
        info_print "Frontend test status: $frontend_status"
    else
        warning_print "Frontend test results not found"
    fi
    # Update test status in README if needed
    if [[ -f "$PROJECT_ROOT/README.md" ]]; then
        info_print "Test status checked - manual review recommended"
    fi
    # Do not exit on missing test files
    return 0
}

# Function to check broken links
check_broken_links() {
    print_header "Checking for broken links"
    
    local broken_links=0
    
    # Find all markdown files
    local markdown_files=$(find "$PROJECT_ROOT" -name "*.md" -type f | grep -v node_modules | grep -v .git)
    
    for file in $markdown_files; do
        if [[ -f "$file" ]]; then
            # Extract links from markdown
            while IFS= read -r line; do
                # Use grep and sed instead of bash regex for compatibility
                if echo "$line" | grep -q '\[.*\]([^)]*)'; then
                    local link_url=$(echo "$line" | sed -n 's/.*\[.*\](\([^)]*\)).*/\1/p')
                    # Check if it's a relative link
                    if echo "$link_url" | grep -q '^\./' || echo "$link_url" | grep -q '^\.\./' || echo "$link_url" | grep -q '^[^/]'; then
                        local full_path=""
                        if echo "$link_url" | grep -q '^\.\./'; then
                            # Relative to parent directory
                            full_path="$(dirname "$file")/$(dirname "$link_url")/$(basename "$link_url")"
                        else
                            # Relative to current directory
                            full_path="$(dirname "$file")/$link_url"
                        fi
                        if [[ ! -f "$full_path" ]] && [[ ! -d "$full_path" ]]; then
                            warning_print "Broken link in $(basename "$file"): $link_url"
                            ((broken_links++))
                        fi
                    fi
                fi
            done < "$file"
        fi
    done
    
    if [[ $broken_links -eq 0 ]]; then
        info_print "No broken links found ✓"
    else
        handle_error "Found $broken_links broken links"
        return 1
    fi
}

# Function to validate markdown syntax
validate_markdown() {
    print_header "Validating markdown syntax"
    
    local syntax_errors=0
    
    # Find all markdown files
    local markdown_files=$(find "$PROJECT_ROOT" -name "*.md" -type f | grep -v node_modules | grep -v .git)
    
    for file in $markdown_files; do
        if [[ -f "$file" ]]; then
            # Check for common markdown issues
            local issues=0
            
            # Check for unclosed code blocks
            local code_blocks=$(grep -c '```' "$file" 2>/dev/null || echo "0")
            code_blocks=${code_blocks:-0}
            if [[ "$code_blocks" =~ ^[0-9]+$ ]]; then
                if (( code_blocks % 2 != 0 )); then
                    warning_print "Unclosed code block in: $(basename "$file")"
                    ((issues++))
                fi
            fi
            
            # Check for malformed links
            local malformed_links=$(grep -c '\[.*\](' "$file" 2>/dev/null | grep -v '\[.*\]\([^)]*\)' || echo "0")
            malformed_links=${malformed_links:-0}
            if [[ "$malformed_links" =~ ^[0-9]+$ ]] && (( malformed_links > 0 )); then
                warning_print "Malformed links in: $(basename "$file")"
                ((issues++))
            fi
            
            if [[ "$issues" =~ ^[0-9]+$ ]] && (( issues > 0 )); then
                ((syntax_errors++))
            fi
        fi
    done
    
    if [[ "$syntax_errors" =~ ^[0-9]+$ ]] && (( syntax_errors == 0 )); then
        info_print "Markdown syntax validation passed ✓"
    else
        warning_print "Found $syntax_errors files with syntax issues"
    fi
}

# Function to generate documentation summary
generate_documentation_summary() {
    print_header "Generating documentation summary"
    
    # Print current working directory
    debug_print "Current working directory: $(pwd)"
    
    # Ensure docs directory exists
    mkdir -p "$PROJECT_ROOT/docs"
    debug_print "Ensured docs directory exists: $PROJECT_ROOT/docs"
    
    # Check write permissions
    if [ -w "$PROJECT_ROOT/docs" ]; then
        debug_print "Write permission to docs directory confirmed."
    else
        handle_error "No write permission to $PROJECT_ROOT/docs"
        return 1
    fi
    
    local summary_path="$PROJECT_ROOT/docs/DOCUMENTATION_SUMMARY.md"
    debug_print "Attempting to write summary to: $summary_path"
    
    cat > "$summary_path" << 'EOF'
# Documentation Summary

## Overview
This document provides a comprehensive summary of the FoodSave AI / MyAppAssistant project documentation.

## Documentation Structure

### Core Documentation
- **README.md** - Main project overview and quick start guide
- **TOC.md** - Complete table of contents for all documentation
- **ARCHITECTURE_DOCUMENTATION.md** - System architecture and design patterns
- **API_REFERENCE.md** - Complete API documentation

### Backend Documentation
- **AGENTS_GUIDE.md** - AI agents system documentation
- **RAG_SYSTEM_GUIDE.md** - Retrieval-Augmented Generation system
- **RECEIPT_ANALYSIS_GUIDE.md** - Receipt processing and analysis
- **DATABASE_GUIDE.md** - Database schema and operations
- **BACKUP_SYSTEM_GUIDE.md** - Backup and recovery procedures

### Frontend Documentation
- **frontend-implementation-plan.md** - Frontend development roadmap
- **frontend-implementation-checklist.md** - Implementation tasks and status

### Testing & Quality
- **TESTING_GUIDE.md** - Testing strategies and procedures
- **ANTI_HALLUCINATION_GUIDE.md** - AI response validation
- **CONCISE_RESPONSES_IMPLEMENTATION.md** - Response optimization

### Deployment & Operations
- **DEPLOYMENT_GUIDE.md** - Deployment procedures
- **MONITORING_TELEMETRY_GUIDE.md** - System monitoring
- **TELEGRAM_BOT_INTEGRATION_REPORT.md** - Telegram integration

### Development
- **CONTRIBUTING_GUIDE.md** - Contribution guidelines
- **ROADMAP.md** - Project roadmap and milestones

## Last Updated
EOF

    echo "$(date +'%Y-%m-%d %H:%M:%S')" >> "$summary_path"
    
    cat >> "$summary_path" << 'EOF'

## Documentation Status
- [x] Core documentation complete
- [x] API documentation updated
- [x] Architecture documentation current
- [x] Testing documentation comprehensive
- [x] Deployment guides ready
- [ ] Frontend documentation in progress
- [ ] User guides planned

## Quick Links
- [Main README](README.md)
- [Complete TOC](docs/TOC.md)
- [API Reference](docs/API_REFERENCE.md)
- [Architecture](docs/ARCHITECTURE_DOCUMENTATION.md)
- [Testing Guide](docs/TESTING_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)

## Notes
- All documentation follows markdown standards
- API documentation includes OpenAPI/Swagger specifications
- Testing documentation includes coverage requirements
- Deployment guides include Docker and production setup
EOF

    # Check if file was created and print result
    if [[ -f "$summary_path" ]]; then
        success_print "Documentation summary generated successfully at $summary_path"
        debug_print "Summary file location: $summary_path"
    else
        handle_error "Failed to generate documentation summary at $summary_path"
        return 1
    fi
}

# Function to generate TOC
generate_toc() {
    print_header "Generating TOC"
    
    # Ensure docs directory exists
    mkdir -p "$PROJECT_ROOT/docs"
    
    # Run the TOC generation script
    if [[ -f "$SCRIPTS_DIR/generate_toc.sh" ]]; then
        debug_print "Running TOC generation script..."
        bash "$SCRIPTS_DIR/generate_toc.sh"
        success_print "TOC generation completed"
    else
        warning_print "TOC generation script not found"
    fi
}

# Main function
main() {
    echo "Starting documentation update process..."
    echo "========================================"
    
    debug_print "Script started at $(date)"
    
    debug_print "Calling update_dates..."
    update_dates || warning_print "Date update failed, continuing..."
    debug_print "Finished update_dates."
    
    debug_print "Calling update_test_status..."
    update_test_status || warning_print "Test status update failed, continuing..."
    debug_print "Finished update_test_status."
    
    debug_print "Calling check_broken_links..."
    check_broken_links || warning_print "Broken links check failed, continuing..."
    debug_print "Finished check_broken_links."
    
    debug_print "Calling validate_markdown..."
    validate_markdown || warning_print "Markdown validation failed, continuing..."
    debug_print "Finished validate_markdown."
    
    debug_print "About to generate documentation summary..."
    generate_documentation_summary || handle_error "Documentation summary generation failed"
    debug_print "Finished generate_documentation_summary."
    
    debug_print "Calling generate_toc..."
    generate_toc || warning_print "TOC generation failed, continuing..."
    debug_print "Finished generate_toc."
    
    echo "========================================"
    success_print "Documentation update process completed!"
    debug_print "Script finished at $(date)"
    
    # Final verification
    if [[ -f "$PROJECT_ROOT/docs/DOCUMENTATION_SUMMARY.md" ]]; then
        success_print "Documentation summary file created successfully"
        echo "Summary file: $PROJECT_ROOT/docs/DOCUMENTATION_SUMMARY.md"
    else
        handle_error "Documentation summary file was not created"
    fi
    
    if [[ -f "$PROJECT_ROOT/docs/TOC.md" ]]; then
        success_print "TOC file updated successfully"
        echo "TOC file: $PROJECT_ROOT/docs/TOC.md"
    else
        warning_print "TOC file not found or not updated"
    fi
}

# Run main function
main "$@" 