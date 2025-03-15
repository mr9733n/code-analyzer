# app.py
import os
import json

from typing import Dict, Tuple
from flask import Flask, render_template, request, jsonify, send_from_directory
from analyzer.core import CodeAnalyzer
from utils.file_manager import FileManager
from utils.project_manager import ProjectManager

app = Flask(__name__, static_folder='static')

analysis_results = {}

project_manager = ProjectManager(analysis_results)

REPORTS_DIR = FileManager.REPORTS_DIR
GRAPHS_DIR = FileManager.GRAPHS_DIR
MERMAID_DIR = FileManager.MERMAID_DIR
FILE_TYPES = FileManager.FILE_TYPES
CONTENT_TYPES = FileManager.CONTENT_TYPES

@app.route('/')
def index():
    """Отображает главную страницу приложения"""
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    """Анализирует указанный путь к проекту Python"""
    project_path = request.form.get('project_path')

    if not os.path.exists(project_path):
        return jsonify({'error': f'Path does not exist: {project_path}'}), 400

    try:
        analyzer = CodeAnalyzer(project_path)
        analyzer.scan_project()
        report = analyzer.generate_project_report()

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
    except Exception as e:
        return jsonify({'error': f'Error analyzing project: {str(e)}'}), 500


@app.route('/report/<project_id>', methods=['GET'])
def get_report(project_id):
    """Возвращает полный отчет анализа проекта"""
    if not project_manager.check_project_exists(project_id):
        return jsonify({'error': 'Project not found'}), 404

    return jsonify(analysis_results[project_id])


@app.route('/dependencies/<project_id>', methods=['GET'])
def get_dependencies(project_id):
    """Возвращает граф зависимостей для указанного проекта"""
    if not project_manager.check_project_exists(project_id):
        return jsonify({'error': 'Project not found'}), 404

    dependency_graph = analysis_results[project_id]['dependency_graph']

    if not dependency_graph:
        dependency_graph = project_manager.generate_demo_dependencies(project_id)

    return jsonify(dependency_graph)


@app.route('/complex_functions/<project_id>', methods=['GET'])
def get_complex_functions(project_id):
    """Возвращает список сложных функций проекта"""

    if not project_manager.check_project_exists(project_id):
        return jsonify({'error': 'Project not found'}), 404

    complex_functions = analysis_results[project_id]['complex_functions']

    if not complex_functions:
        complex_functions = project_manager.generate_demo_complex_functions(project_id)

    return jsonify(complex_functions)


@app.route('/save_report/<project_id>', methods=['GET'])
def save_report(project_id):
    """Сохраняет отчет анализа в JSON файл на сервере"""
    if not project_manager.check_project_exists(project_id):
        return jsonify({'error': 'Project not found'}), 404

    try:
        report = analysis_results[project_id]

        timestamp = FileManager.get_timestamp()
        filename = f'report_{timestamp}.json'

        filepath = FileManager.save_to_file(REPORTS_DIR, filename, lambda f: json.dump(report, f, indent=2))

        return jsonify({
            'success': True,
            'message': f'Отчет сохранен как {filename}',
            'filepath': filepath
        })
    except Exception as e:
        return _handle_save_error('report', str(e))


@app.route('/save_html_report/<project_id>', methods=['POST'])
def save_html_report(project_id):
    """Сохраняет HTML отчет на сервере"""
    if not project_manager.check_project_exists(project_id):
        return jsonify({'error': 'Project not found'}), 404

    try:
        data = request.get_json()
        html_content = data.get('html_content')
        file_name = data.get('file_name')

        if not html_content:
            return jsonify({'error': 'HTML content is missing'}), 400

        if not file_name:
            timestamp = FileManager.get_timestamp()
            file_name = f'report_{project_id}_{timestamp}.html'

        filepath = FileManager.save_to_file(REPORTS_DIR, file_name, lambda f: f.write(html_content))

        return jsonify({
            'message': f'HTML отчет сохранен как {file_name}',
            'filepath': filepath
        })
    except Exception as e:
        return _handle_save_error('HTML report', str(e))


@app.route('/save_graph/<project_id>', methods=['POST'])
def save_graph(project_id):
    """Сохраняет SVG-графику на сервере"""
    if not project_manager.check_project_exists(project_id):
        return jsonify({'error': 'Project not found'}), 404

    try:
        svg_data = request.json.get('svg_data')

        if not svg_data:
            return jsonify({'error': 'SVG data not provided'}), 400

        timestamp = FileManager.get_timestamp()
        filename = f'dependency_graph_{timestamp}.svg'

        filepath = FileManager.save_to_file(GRAPHS_DIR, filename, lambda f: f.write(svg_data))

        return jsonify({
            'success': True,
            'message': f'Граф сохранен как {filename}',
            'filepath': filepath
        })
    except Exception as e:
        return _handle_save_error('graph', str(e))


@app.route('/save_mermaid/<project_id>', methods=['POST'])
def save_mermaid(project_id):
    """Сохраняет диаграмму Mermaid на сервере"""
    if not project_manager.check_project_exists(project_id):
        return jsonify({'error': 'Project not found'}), 404

    try:
        mermaid_data = request.json.get('mermaid_data')

        if not mermaid_data:
            return jsonify({'error': 'Mermaid data not provided'}), 400

        timestamp = FileManager.get_timestamp()
        filename = f'dependency_graph_{timestamp}.mermaid'

        filepath = FileManager.save_to_file(MERMAID_DIR, filename, lambda f: f.write(mermaid_data))

        return jsonify({
            'success': True,
            'message': f'Mermaid сохранен как {filename}',
            'filepath': filepath
        })
    except Exception as e:
        return _handle_save_error('Mermaid diagram', str(e))


@app.route('/list_reports', methods=['GET'])
def list_reports():
    """Возвращает список всех сохраненных отчетов и диаграмм"""
    try:
        directories = {
            'reports': os.path.join(os.getcwd(), REPORTS_DIR),
            'graphs': os.path.join(os.getcwd(), GRAPHS_DIR),
            'mermaid': os.path.join(os.getcwd(), MERMAID_DIR)
        }

        reports = []
        for dir_name, dir_path in directories.items():
            if not os.path.exists(dir_path):
                continue

            reports.extend(FileManager.scan_directory_for_reports(dir_name, dir_path))

        reports.sort(key=lambda x: x['created'], reverse=True)

        return jsonify({'reports': reports})
    except Exception as e:
        return jsonify({'error': f'Ошибка при получении списка отчетов: {str(e)}'}), 500


@app.route('/download_report/<filename>', methods=['GET'])
def download_report(filename):
    """Скачивание или просмотр сохраненного отчета/диаграммы"""
    possible_dirs = [
        os.path.join(os.getcwd(), REPORTS_DIR),
        os.path.join(os.getcwd(), GRAPHS_DIR),
        os.path.join(os.getcwd(), MERMAID_DIR)
    ]
    _, ext = os.path.splitext(filename)
    mime_type = CONTENT_TYPES.get(ext.lower(), 'application/octet-stream')

    for directory in possible_dirs:
        file_path = os.path.join(directory, filename)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            as_attachment = 'download' in request.args or ext.lower() not in ['.svg', '.html']

            return send_from_directory(
                directory,
                filename,
                mimetype=mime_type,
                as_attachment=as_attachment
            )

    return jsonify({'error': 'Файл не найден'}), 404


def _handle_save_error(content_type: str, error_msg: str) -> Tuple[Dict[str, str], int]:
    """Создает стандартный ответ об ошибке при сохранении"""
    return jsonify({'error': f'Ошибка при сохранении {content_type}: {error_msg}'}), 500


if __name__ == '__main__':
    app.run(debug=True)