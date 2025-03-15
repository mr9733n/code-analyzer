# project_manager.py
from typing import Dict, List, Any, Optional


class ProjectManager:
    """Класс для управления проектами и генерации демо-данных"""

    def __init__(self, analysis_results: Dict[str, Any]):
        self.analysis_results = analysis_results

    def check_project_exists(self, project_id: str) -> bool:
        """Проверяет, существует ли проект с указанным ID"""
        return project_id in self.analysis_results

    def generate_demo_dependencies(self, project_id: str) -> Dict[str, List[str]]:
        """Генерирует демо-данные для графа зависимостей"""
        dependency_graph = {
            "demo/module1.py": ["os", "sys", "demo/module2.py"],
            "demo/module2.py": ["json", "logging", "demo/module3.py"],
            "demo/module3.py": ["datetime", "math"]
        }

        real_modules = list(self.analysis_results[project_id]['modules'].keys())
        if real_modules:
            first_module = real_modules[0]
            dependency_graph[first_module] = ["os", "sys", "demo/module1.py"]

        return dependency_graph

    def generate_demo_complex_functions(self, project_id: str) -> List[Dict[str, Any]]:
        """Генерирует демо-данные для сложных функций"""
        complex_functions = [
            {
                "name": "process_data",
                "module": "demo/module1.py",
                "complexity": 12,
                "line": 45
            },
            {
                "name": "parse_input",
                "module": "demo/module2.py",
                "complexity": 8,
                "line": 23
            },
            {
                "name": "validate_request",
                "module": "demo/module3.py",
                "class": "RequestHandler",
                "complexity": 15,
                "line": 78
            }
        ]

        real_modules = list(self.analysis_results[project_id]['modules'].keys())
        if real_modules:
            first_module = real_modules[0]
            complex_functions.append({
                "name": "sample_complex_function",
                "module": first_module,
                "complexity": 7,
                "line": 10
            })

        return complex_functions