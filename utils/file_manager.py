# file_manager.py
import os
import datetime
from typing import Dict, List, Any, Callable


class FileManager:
    """Класс для управления файловыми операциями приложения"""
    REPORTS_DIR = 'reports'
    GRAPHS_DIR = 'graphs'
    MERMAID_DIR = 'mermaid'

    FILE_TYPES = {
        '.json': 'JSON Report',
        '.html': 'HTML Report',
        '.svg': 'SVG Diagram',
        '.mermaid': 'Mermaid Diagram'
    }

    CONTENT_TYPES = {
        '.json': 'application/json',
        '.html': 'text/html',
        '.svg': 'image/svg+xml',
        '.mermaid': 'text/plain'
    }

    @staticmethod
    def get_timestamp() -> str:
        """Возвращает текущий timestamp для имен файлов"""
        return datetime.datetime.now().strftime('%Y%m%d_%H%M%S')

    @classmethod
    def save_to_file(cls, directory: str, filename: str, write_func: Callable) -> str:
        """Сохраняет данные в файл, используя предоставленную функцию записи"""
        dir_path = os.path.join(os.getcwd(), directory)
        os.makedirs(dir_path, exist_ok=True)

        filepath = os.path.join(dir_path, filename)

        with open(filepath, 'w', encoding='utf-8') as f:
            write_func(f)

        return filepath

    @classmethod
    def scan_directory_for_reports(cls, dir_name: str, dir_path: str) -> List[Dict[str, Any]]:
        """Сканирует директорию и возвращает информацию о файлах отчетов"""
        reports = []

        for filename in os.listdir(dir_path):
            file_path = os.path.join(dir_path, filename)
            if not os.path.isfile(file_path):
                continue

            _, ext = os.path.splitext(filename)

            if ext not in cls.FILE_TYPES:
                continue

            file_info = cls.get_file_info(filename, file_path, ext, dir_name)
            reports.append(file_info)

        return reports

    @classmethod
    def get_file_info(cls, filename: str, file_path: str, ext: str, dir_name: str) -> Dict[str, Any]:
        """Получает информацию о файле отчета"""
        creation_time = os.path.getctime(file_path)
        creation_date = datetime.datetime.fromtimestamp(creation_time)
        file_size = os.path.getsize(file_path)

        size_str = cls.format_file_size(file_size)

        return {
            'filename': filename,
            'created': creation_date.strftime('%Y-%m-%d %H:%M:%S'),
            'path': file_path,
            'type': cls.FILE_TYPES[ext],
            'category': dir_name,
            'size': size_str
        }

    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """Форматирует размер файла в читаемый вид"""
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.1f} MB"