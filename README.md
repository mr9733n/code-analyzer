# Руководство по быстрому старту

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/code-analyzer.git
cd code-analyzer
```

2. Создайте и активируйте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
```

3. Установите зависимости:
```bash
pip install -r requirements.txt
```

## Структура проекта

Создайте следующую структуру директорий:

```
code-analyzer/
├── analyzer/
│   ├── __init__.py
│   └── core.py
├── app.py
├── templates/
└── requirements.txt
```

4. Создайте файл `analyzer/__init__.py`:
```python
# analyzer/__init__.py
from .core import CodeAnalyzer
```

5. Скопируйте код из раздела "Базовый анализатор кода на Python" в файл `analyzer/core.py`

6. Скопируйте код из раздела "Простой веб-интерфейс для анализатора" в файл `app.py`

## Запуск

1. Запустите веб-интерфейс:
```bash
python app.py
```

2. Откройте браузер и перейдите по адресу http://127.0.0.1:5000/

3. Введите путь к вашему Python-проекту и нажмите "Analyze"

## Использование через командную строку

Вы также можете использовать анализатор напрямую из командной строки:

```bash
python -m analyzer.core /путь/к/вашему/проекту
```

Результат анализа будет выведен в формате JSON.

## Что дальше?

После успешного запуска базового анализатора вы можете:

1. Расширить функционал анализатора, добавив дополнительные метрики
2. Улучшить визуализацию, добавив более подробные графики и диаграммы
3. Добавить поддержку других языков программирования
4. Создать систему рекомендаций на основе выявленных паттернов