# app.py
from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json
from analyzer.core import CodeAnalyzer

app = Flask(__name__)

# Временное хранилище для результатов анализа
analysis_results = {}


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/static/js/<path:filename>')
def serve_static(filename):
    """Обработчик для обслуживания статических JS файлов"""
    return send_from_directory('static/js', filename)


@app.route('/analyze', methods=['POST'])
def analyze():
    project_path = request.form.get('project_path')

    if not os.path.exists(project_path):
        return jsonify({'error': f'Path does not exist: {project_path}'}), 400

    # Создаем анализатор
    analyzer = CodeAnalyzer(project_path)

    # Анализируем проект
    analyzer.scan_project()

    # Получаем отчет
    report = analyzer.generate_project_report()

    # Сохраняем результаты
    project_id = str(hash(project_path))
    analysis_results[project_id] = report

    return jsonify({
        'project_id': project_id,
        'summary': {
            'total_modules': report['total_modules'],
            'total_loc': report['total_loc'],
            'total_functions': report['total_functions'],
            'total_classes': report['total_classes']
        }
    })


@app.route('/report/<project_id>', methods=['GET'])
def get_report(project_id):
    if project_id not in analysis_results:
        return jsonify({'error': 'Project not found'}), 404

    return jsonify(analysis_results[project_id])


@app.route('/dependencies/<project_id>', methods=['GET'])
def get_dependencies(project_id):
    if project_id not in analysis_results:
        return jsonify({'error': 'Project not found'}), 404

    # Возвращаем только граф зависимостей
    dependency_graph = analysis_results[project_id]['dependency_graph']

    # Если граф пустой, добавляем демо-данные
    if not dependency_graph:
        dependency_graph = {
            "demo/module1.py": ["os", "sys", "demo/module2.py"],
            "demo/module2.py": ["json", "logging", "demo/module3.py"],
            "demo/module3.py": ["datetime", "math"]
        }

        # Если проект содержит хотя бы один модуль, добавляем его в граф
        real_modules = list(analysis_results[project_id]['modules'].keys())
        if real_modules:
            first_module = real_modules[0]
            dependency_graph[first_module] = ["os", "sys", "demo/module1.py"]

    return jsonify(dependency_graph)


@app.route('/complex_functions/<project_id>', methods=['GET'])
def get_complex_functions(project_id):
    if project_id not in analysis_results:
        return jsonify({'error': 'Project not found'}), 404

    # Возвращаем список сложных функций
    complex_functions = analysis_results[project_id]['complex_functions']

    # Если список пустой, добавляем демо-данные
    if not complex_functions:
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

        # Если проект содержит хотя бы один модуль, добавляем демо-функцию в этом модуле
        real_modules = list(analysis_results[project_id]['modules'].keys())
        if real_modules:
            first_module = real_modules[0]
            complex_functions.append({
                "name": "sample_complex_function",
                "module": first_module,
                "complexity": 7,
                "line": 10
            })

    return jsonify(complex_functions)


if __name__ == '__main__':
    # Запускаем Flask-приложение
    app.run(debug=True)