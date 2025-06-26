#!/usr/bin/env python3
"""
Skrypt do sprawdzania i naprawy deprecated API calls

Zgodnie z regułami projektu:
- Sprawdzenie deprecated API calls
- Automatyczna naprawa gdzie to możliwe
- Raportowanie problemów wymagających ręcznej interwencji
"""

import os
import re
import ast
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Any, Tuple


class DeprecatedAPIChecker:
    """Klasa do sprawdzania deprecated API calls"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.deprecated_patterns = {
            # Pydantic deprecated patterns
            "pydantic.BaseSettings": {
                "old": "from pydantic import BaseSettings",
                "new": "from pydantic_settings import BaseSettings",
                "description": "BaseSettings moved to pydantic_settings in Pydantic v2"
            },
            "pydantic.BaseModel.Config": {
                "old": "class Config:",
                "new": "model_config = ConfigDict()",
                "description": "Config class replaced with model_config in Pydantic v2"
            },
            
            # SQLAlchemy deprecated patterns
            "sqlalchemy.declarative_base": {
                "old": "from sqlalchemy.orm import declarative_base",
                "new": "from sqlalchemy.orm import DeclarativeBase",
                "description": "declarative_base replaced with DeclarativeBase in SQLAlchemy 2.0"
            },
            "sqlalchemy.Column types": {
                "old": "from sqlalchemy import String, Integer, Boolean",
                "new": "from sqlalchemy import String, Integer, Boolean",
                "description": "Column types should use new syntax in SQLAlchemy 2.0"
            },
            
            # FastAPI deprecated patterns
            "fastapi.APIRouter prefix": {
                "old": "router = APIRouter(prefix='/api')",
                "new": "router = APIRouter()\napp.include_router(router, prefix='/api')",
                "description": "APIRouter prefix deprecated in favor of include_router"
            },
            
            # Python standard library deprecated patterns
            "typing.List": {
                "old": "from typing import List",
                "new": "list",  # Use built-in list type
                "description": "typing.List deprecated in favor of built-in list"
            },
            "typing.Dict": {
                "old": "from typing import Dict",
                "new": "dict",  # Use built-in dict type
                "description": "typing.Dict deprecated in favor of built-in dict"
            },
            "typing.Optional": {
                "old": "from typing import Optional",
                "new": "from typing import Optional",  # Still valid but can use Union[T, None]
                "description": "Optional can be replaced with Union[T, None] or T | None"
            }
        }
        
        self.found_issues = []
        self.fixed_issues = []
    
    def scan_project(self) -> List[Dict[str, Any]]:
        """Skanuje projekt w poszukiwaniu deprecated API calls"""
        python_files = list(self.project_root.rglob("*.py"))
        
        for file_path in python_files:
            if self._should_skip_file(file_path):
                continue
            
            issues = self._scan_file(file_path)
            self.found_issues.extend(issues)
        
        return self.found_issues
    
    def _should_skip_file(self, file_path: Path) -> bool:
        """Sprawdza czy plik powinien być pominięty"""
        skip_patterns = [
            "venv/",
            ".venv/",
            "__pycache__/",
            ".git/",
            "node_modules/",
            "build/",
            "dist/",
            ".pytest_cache/"
        ]
        
        return any(pattern in str(file_path) for pattern in skip_patterns)
    
    def _scan_file(self, file_path: Path) -> List[Dict[str, Any]]:
        """Skanuje pojedynczy plik w poszukiwaniu deprecated API calls"""
        issues = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
            
            for line_num, line in enumerate(lines, 1):
                for pattern_name, pattern_info in self.deprecated_patterns.items():
                    if self._check_line_for_pattern(line, pattern_info["old"]):
                        issues.append({
                            "file": str(file_path),
                            "line": line_num,
                            "pattern": pattern_name,
                            "old_code": line.strip(),
                            "new_code": pattern_info["new"],
                            "description": pattern_info["description"],
                            "fixed": False
                        })
        
        except Exception as e:
            print(f"Error scanning {file_path}: {e}")
        
        return issues
    
    def _check_line_for_pattern(self, line: str, pattern: str) -> bool:
        """Sprawdza czy linia zawiera deprecated pattern"""
        # Simple string matching - can be enhanced with regex
        return pattern in line
    
    def fix_issues(self, auto_fix: bool = False) -> List[Dict[str, Any]]:
        """Naprawia znalezione problemy"""
        if not auto_fix:
            print("Auto-fix disabled. Found issues:")
            for issue in self.found_issues:
                print(f"  {issue['file']}:{issue['line']} - {issue['pattern']}")
            return []
        
        for issue in self.found_issues:
            if self._can_auto_fix(issue):
                success = self._fix_issue(issue)
                if success:
                    issue["fixed"] = True
                    self.fixed_issues.append(issue)
        
        return self.fixed_issues
    
    def _can_auto_fix(self, issue: Dict[str, Any]) -> bool:
        """Sprawdza czy problem może być naprawiony automatycznie"""
        # Lista problemów, które można naprawić automatycznie
        auto_fixable_patterns = [
            "pydantic.BaseSettings",
            "sqlalchemy.declarative_base",
            "typing.List",
            "typing.Dict"
        ]
        
        return issue["pattern"] in auto_fixable_patterns
    
    def _fix_issue(self, issue: Dict[str, Any]) -> bool:
        """Naprawia pojedynczy problem"""
        try:
            file_path = Path(issue["file"])
            
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
            
            # Napraw linię
            line_index = issue["line"] - 1
            if line_index < len(lines):
                old_line = lines[line_index]
                new_line = self._apply_fix(old_line, issue)
                lines[line_index] = new_line
            
            # Zapisz plik
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write('\n'.join(lines))
            
            print(f"Fixed: {issue['file']}:{issue['line']} - {issue['pattern']}")
            return True
        
        except Exception as e:
            print(f"Error fixing {issue['file']}:{issue['line']} - {e}")
            return False
    
    def _apply_fix(self, line: str, issue: Dict[str, Any]) -> str:
        """Aplikuje naprawę do linii kodu"""
        pattern = issue["pattern"]
        
        if pattern == "pydantic.BaseSettings":
            return line.replace("from pydantic import BaseSettings", "from pydantic_settings import BaseSettings")
        
        elif pattern == "sqlalchemy.declarative_base":
            return line.replace("from sqlalchemy.orm import declarative_base", "from sqlalchemy.orm import DeclarativeBase")
        
        elif pattern == "typing.List":
            # To wymaga bardziej zaawansowanej analizy AST
            return line.replace("List[", "list[")
        
        elif pattern == "typing.Dict":
            # To wymaga bardziej zaawansowanej analizy AST
            return line.replace("Dict[", "dict[")
        
        return line
    
    def generate_report(self) -> str:
        """Generuje raport z wyników skanowania"""
        report = []
        report.append("=" * 60)
        report.append("DEPRECATED API CALLS REPORT")
        report.append("=" * 60)
        report.append("")
        
        if not self.found_issues:
            report.append("✅ No deprecated API calls found!")
            return '\n'.join(report)
        
        report.append(f"Found {len(self.found_issues)} potential deprecated API calls:")
        report.append("")
        
        # Grupuj problemy według plików
        files_issues = {}
        for issue in self.found_issues:
            file_path = issue["file"]
            if file_path not in files_issues:
                files_issues[file_path] = []
            files_issues[file_path].append(issue)
        
        for file_path, issues in files_issues.items():
            report.append(f"📁 {file_path}:")
            for issue in issues:
                status = "✅ FIXED" if issue["fixed"] else "❌ NEEDS ATTENTION"
                report.append(f"  Line {issue['line']}: {issue['pattern']} - {status}")
                report.append(f"    Description: {issue['description']}")
                if not issue["fixed"]:
                    report.append(f"    Old: {issue['old_code']}")
                    report.append(f"    New: {issue['new_code']}")
                report.append("")
        
        if self.fixed_issues:
            report.append(f"✅ Successfully fixed {len(self.fixed_issues)} issues automatically")
        
        remaining_issues = [i for i in self.found_issues if not i["fixed"]]
        if remaining_issues:
            report.append(f"⚠️  {len(remaining_issues)} issues require manual attention")
        
        return '\n'.join(report)


def run_python_compilation_check(project_root: str) -> Tuple[bool, str]:
    """Sprawdza czy kod kompiluje się bez ostrzeżeń"""
    try:
        result = subprocess.run(
            [sys.executable, "-m", "py_compile", "--warnings-as-errors", project_root],
            capture_output=True,
            text=True,
            cwd=project_root
        )
        
        if result.returncode == 0:
            return True, "✅ Code compiles without warnings"
        else:
            return False, f"❌ Compilation warnings found:\n{result.stderr}"
    
    except Exception as e:
        return False, f"❌ Error during compilation check: {e}"


def check_dependencies(project_root: str) -> List[str]:
    """Sprawdza zależności pod kątem deprecated APIs"""
    issues = []
    
    # Sprawdź requirements.txt lub pyproject.toml
    requirements_file = Path(project_root) / "requirements.txt"
    pyproject_file = Path(project_root) / "pyproject.toml"
    
    if requirements_file.exists():
        with open(requirements_file, 'r') as f:
            content = f.read()
            
            # Sprawdź deprecated packages
            deprecated_packages = {
                "pydantic<2.0": "Upgrade to pydantic>=2.0",
                "sqlalchemy<2.0": "Upgrade to sqlalchemy>=2.0",
                "fastapi<0.100": "Upgrade to fastapi>=0.100"
            }
            
            for package, recommendation in deprecated_packages.items():
                if package.split('<')[0] in content:
                    issues.append(f"Consider {recommendation}")
    
    return issues


def main():
    """Główna funkcja skryptu"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Check and fix deprecated API calls")
    parser.add_argument("--project-root", default=".", help="Project root directory")
    parser.add_argument("--auto-fix", action="store_true", help="Automatically fix issues where possible")
    parser.add_argument("--check-compilation", action="store_true", help="Check if code compiles without warnings")
    parser.add_argument("--check-dependencies", action="store_true", help="Check dependencies for deprecated packages")
    
    args = parser.parse_args()
    
    project_root = Path(args.project_root).resolve()
    
    if not project_root.exists():
        print(f"❌ Project root does not exist: {project_root}")
        sys.exit(1)
    
    print(f"🔍 Scanning project: {project_root}")
    print("=" * 60)
    
    # Sprawdź deprecated API calls
    checker = DeprecatedAPIChecker(project_root)
    issues = checker.scan_project()
    
    if args.auto_fix:
        print("🔧 Attempting to fix issues automatically...")
        fixed_issues = checker.fix_issues(auto_fix=True)
        print(f"Fixed {len(fixed_issues)} issues automatically")
    
    # Wygeneruj raport
    report = checker.generate_report()
    print(report)
    
    # Sprawdź kompilację
    if args.check_compilation:
        print("\n" + "=" * 60)
        print("COMPILATION CHECK")
        print("=" * 60)
        success, message = run_python_compilation_check(project_root)
        print(message)
    
    # Sprawdź zależności
    if args.check_dependencies:
        print("\n" + "=" * 60)
        print("DEPENDENCIES CHECK")
        print("=" * 60)
        dep_issues = check_dependencies(project_root)
        if dep_issues:
            for issue in dep_issues:
                print(f"⚠️  {issue}")
        else:
            print("✅ No dependency issues found")
    
    # Podsumowanie
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total issues found: {len(issues)}")
    print(f"Auto-fixed: {len([i for i in issues if i.get('fixed', False)])}")
    print(f"Manual attention needed: {len([i for i in issues if not i.get('fixed', False)])}")
    
    if any(not i.get('fixed', False) for i in issues):
        print("\n💡 Recommendations:")
        print("1. Review remaining issues manually")
        print("2. Update deprecated imports and function calls")
        print("3. Test thoroughly after making changes")
        print("4. Consider upgrading dependencies to latest versions")


if __name__ == "__main__":
    main() 