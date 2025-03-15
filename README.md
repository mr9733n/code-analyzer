## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/mr9733n/code-analyzer
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

