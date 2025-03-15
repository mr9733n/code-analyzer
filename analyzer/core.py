# analyzer/core.py
import ast
import os
import json
from typing import Dict, List, Any, Tuple, Set


class CodeAnalyzer:
    """Базовый класс для анализа кода на Python."""

    def __init__(self, project_root: str):
        """
        Инициализирует анализатор кода.

        Args:
            project_root: Корневая директория проекта для анализа
        """
        self.project_root = os.path.abspath(project_root)
        self.modules: Dict[str, Dict] = {}
        self.dependencies: Dict[str, Set[str]] = {}

    def scan_project(self) -> None:
        """Сканирует проект и собирает информацию о Python-файлах."""
        for root, _, files in os.walk(self.project_root):
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    rel_path = os.path.relpath(file_path, self.project_root)

                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()

                        module_info = self.analyze_file(content, rel_path)
                        self.modules[rel_path] = module_info
                    except Exception as e:
                        print(f"Error analyzing {file_path}: {e}")

    def analyze_file(self, content: str, file_path: str) -> Dict[str, Any]:
        """
        Анализирует содержимое файла Python.

        Args:
            content: Содержимое файла
            file_path: Относительный путь к файлу

        Returns:
            Словарь с информацией о файле
        """
        try:
            tree = ast.parse(content)

            # Базовый анализ
            imports = []
            functions = []
            classes = []

            for node in ast.walk(tree):
                # Анализ импортов
                if isinstance(node, ast.Import):
                    for name in node.names:
                        imports.append(name.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.append(node.module)

                # Анализ функций
                elif isinstance(node, ast.FunctionDef):
                    func_info = {
                        'name': node.name,
                        'line': node.lineno,
                        'args': [arg.arg for arg in node.args.args],
                        'complexity': self._calculate_complexity(node)
                    }
                    functions.append(func_info)

                # Анализ классов
                elif isinstance(node, ast.ClassDef):
                    class_info = {
                        'name': node.name,
                        'line': node.lineno,
                        'methods': []
                    }

                    for class_node in ast.iter_child_nodes(node):
                        if isinstance(class_node, ast.FunctionDef):
                            method_info = {
                                'name': class_node.name,
                                'line': class_node.lineno,
                                'args': [arg.arg for arg in class_node.args.args],
                                'complexity': self._calculate_complexity(class_node)
                            }
                            class_info['methods'].append(method_info)

                    classes.append(class_info)

            # Сохраняем зависимости
            self.dependencies[file_path] = set(imports)

            return {
                'path': file_path,
                'imports': imports,
                'functions': functions,
                'classes': classes,
                'loc': len(content.split('\n')),
            }

        except SyntaxError as e:
            return {
                'path': file_path,
                'error': f"Syntax error: {e}",
            }

    def _calculate_complexity(self, node: ast.AST) -> int:
        """
        Вычисляет приблизительную цикломатическую сложность функции.

        Args:
            node: AST-узел функции или метода

        Returns:
            Значение цикломатической сложности
        """
        complexity = 1  # Базовая сложность

        for child_node in ast.walk(node):
            # Увеличиваем сложность для каждой ветки
            if isinstance(child_node, (ast.If, ast.While, ast.For)):
                complexity += 1
            # Для каждого блока except
            elif isinstance(child_node, ast.ExceptHandler):
                complexity += 1
            # Для каждой операции and/or
            elif isinstance(child_node, ast.BoolOp):
                complexity += len(child_node.values) - 1

        return complexity

    def get_dependency_graph(self) -> Dict[str, List[str]]:
        """
        Возвращает граф зависимостей модулей.

        Returns:
            Словарь зависимостей, где ключи - модули, значения - списки зависимостей
        """
        graph = {}
        for module, deps in self.dependencies.items():
            graph[module] = list(deps)
        return graph

    def generate_project_report(self) -> Dict[str, Any]:
        """
        Генерирует отчет о проекте.

        Returns:
            Словарь с информацией о проекте
        """
        total_loc = sum(module.get('loc', 0) for module in self.modules.values())
        total_functions = sum(len(module.get('functions', [])) for module in self.modules.values())
        total_classes = sum(len(module.get('classes', [])) for module in self.modules.values())

        # Поиск самых сложных функций
        all_functions = []
        for module_path, module_info in self.modules.items():
            for func in module_info.get('functions', []):
                func['module'] = module_path
                all_functions.append(func)

            for cls in module_info.get('classes', []):
                for method in cls.get('methods', []):
                    method['module'] = module_path
                    method['class'] = cls['name']
                    all_functions.append(method)

        # Сортировка функций по сложности
        all_functions.sort(key=lambda x: x.get('complexity', 0), reverse=True)
        complex_functions = all_functions[:10]  # Топ-10 самых сложных функций

        return {
            'total_modules': len(self.modules),
            'total_loc': total_loc,
            'total_functions': total_functions,
            'total_classes': total_classes,
            'complex_functions': complex_functions,
            'dependency_graph': self.get_dependency_graph()
        }

    def save_report(self, output_path: str) -> None:
        """
        Сохраняет отчет в JSON-файл.

        Args:
            output_path: Путь для сохранения отчета
        """
        report = self.generate_project_report()

        # Преобразование set в list для JSON-сериализации
        for key, value in report.items():
            if isinstance(value, set):
                report[key] = list(value)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        project_path = sys.argv[1]
    else:
        project_path = "."

    analyzer = CodeAnalyzer(project_path)
    analyzer.scan_project()
    report = analyzer.generate_project_report()
    print(json.dumps(report, indent=2))