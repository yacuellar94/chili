
@echo off
rem You can activate your virtualenv and then start server using a bat file. Copy this script in to a file and save it with .bat extension (eg. runserver.bat)
rem cmd /k "cd /d C:\Users\Admin\Desktop\venv\Scripts & activate & cd /d  C:\Users\Admin\Desktop\helloworld & python manage.py runserver"
rem start "" http://localhost:80/
rem cmd /k "python .\main.py"

set mypath=%cd%
cd %mypath%

echo .\venv\Scripts\activate
cmd /k ".\venv\Scripts\activate & python .\main.py -w"
 
@echo on
echo "Quit python env"
cmd /k "deactivate"
pause
 


 
