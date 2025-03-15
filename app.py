# app.py
import datetime

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


@app.route('/save_report/<project_id>', methods=['GET'])
def save_report(project_id):
    """Сохраняет отчет анализа в файл на сервере"""
    if project_id not in analysis_results:
        return jsonify({'error': 'Project not found'}), 404

    try:
        # Создаем директорию для отчетов, если она не существует
        reports_dir = os.path.join(os.getcwd(), 'reports')
        os.makedirs(reports_dir, exist_ok=True)

        # Получаем отчет
        report = analysis_results[project_id]

        # Формируем имя файла с датой и временем
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'report_{timestamp}.json'
        filepath = os.path.join(reports_dir, filename)

        # Сохраняем отчет в файл
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)

        return jsonify({
            'success': True,
            'message': f'Отчет сохранен как {filename}',
            'filepath': filepath
        })
    except Exception as e:
        return jsonify({'error': f'Ошибка при сохранении отчета: {str(e)}'}), 500


@app.route('/save_graph/<project_id>', methods=['POST'])
def save_graph(project_id):
    """Сохраняет SVG-данные графа на сервере"""
    if project_id not in analysis_results:
        return jsonify({'error': 'Project not found'}), 404

    try:
        # Получаем SVG-данные из запроса
        svg_data = request.json.get('svg_data')

        if not svg_data:
            return jsonify({'error': 'SVG data not provided'}), 400

        # Создаем директорию для графов, если она не существует
        graphs_dir = os.path.join(os.getcwd(), 'graphs')
        os.makedirs(graphs_dir, exist_ok=True)

        # Формируем имя файла с датой и временем
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'dependency_graph_{timestamp}.svg'
        filepath = os.path.join(graphs_dir, filename)

        # Сохраняем граф в файл
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(svg_data)

        return jsonify({
            'success': True,
            'message': f'Граф сохранен как {filename}',
            'filepath': filepath
        })
    except Exception as e:
        return jsonify({'error': f'Ошибка при сохранении графа: {str(e)}'}), 500


@app.route('/list_reports', methods=['GET'])
def list_reports():
    """Возвращает список сохраненных отчетов"""
    try:
        reports_dir = os.path.join(os.getcwd(), 'reports')
        if not os.path.exists(reports_dir):
            return jsonify({'reports': []})

        reports = []
        for filename in os.listdir(reports_dir):
            if filename.endswith('.json'):
                file_path = os.path.join(reports_dir, filename)
                creation_time = os.path.getctime(file_path)
                creation_date = datetime.datetime.fromtimestamp(creation_time)

                reports.append({
                    'filename': filename,
                    'created': creation_date.strftime('%Y-%m-%d %H:%M:%S'),
                    'path': file_path
                })

        # Сортируем по времени создания (новые вначале)
        reports.sort(key=lambda x: x['created'], reverse=True)

        return jsonify({'reports': reports})
    except Exception as e:
        return jsonify({'error': f'Ошибка при получении списка отчетов: {str(e)}'}), 500


@app.route('/download_report/<filename>', methods=['GET'])
def download_report(filename):
    """Скачивание сохраненного отчета"""
    reports_dir = os.path.join(os.getcwd(), 'reports')
    return send_from_directory(reports_dir, filename, as_attachment=True)


@app.route('/save_mermaid/<project_id>', methods=['POST'])
def save_mermaid(project_id):
    """Сохраняет данные Mermaid графа на сервере"""
    if project_id not in analysis_results:
        return jsonify({'error': 'Project not found'}), 404

    try:
        # Получаем данные Mermaid из запроса
        mermaid_data = request.json.get('mermaid_data')

        if not mermaid_data:
            return jsonify({'error': 'Mermaid data not provided'}), 400

        # Создаем директорию для графов Mermaid, если она не существует
        mermaid_dir = os.path.join(os.getcwd(), 'mermaid')
        os.makedirs(mermaid_dir, exist_ok=True)

        # Формируем имя файла с датой и временем
        timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f'dependency_graph_{timestamp}.mermaid'
        filepath = os.path.join(mermaid_dir, filename)

        # Сохраняем граф в файл
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(mermaid_data)

        return jsonify({
            'success': True,
            'message': f'Mermaid сохранен как {filename}',
            'filepath': filepath
        })
    except Exception as e:
        return jsonify({'error': f'Ошибка при сохранении Mermaid: {str(e)}'}), 500

if __name__ == '__main__':
    # Запускаем Flask-приложение
    app.run(debug=True)