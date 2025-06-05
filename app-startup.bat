echo Tworzenie wirtualnego środowiska...
py -m venv venv

echo Aktywacja wirtualnego środowiska...
call venv\Scripts\activate

echo Instalacja wymaganych paczek...
pip install -r api\requirements.txt

echo Uruchamianie aplikacji...
start cmd /k "py api\flask_app.py"

echo Uruchamianie frontendu React...
cd auto_review_react-app\src
call npm install
start cmd /k "npm run build"
cd ../..

echo Dezaktywacja wirtualnego środowiska...
deactivate
