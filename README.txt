# ===== IMPORTANT ======#

!!!!! Never launch 2 birds.bat at the same time !!!!!!

# ===== Preliminary installation ===== 

# Install Python 3.10 with (check PATH)

# Create virtuel env
py -3 -m venv venv
.\venv\Scripts\activate

# If that doesn't work, open powershell as admin and run:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Upgrade pip :
python -m pip install --upgrade pip

# Install geopandas:
pip install pipwin
pipwin install gdal
pipwin install fiona
pip install geopandas

# For Excel ():
pip install  openpyxl

# Install thread for server
pip install thread6

# ===== END of Installation ======

# ===== If birds.bat doesn't work =====

Open the folder where the project is located
- on the bar (path), type: cmd
or
- open command prompt, In window, type python main.py

# ===== If the browser does not open automatically =====
Open your browser manually
type: localhost

# --------- Optional Installation -----------

# For Plot install :
pip install matplotlib
pip install mapclassify

# To Check installed (version) :
pip list

# deactivate venv
deactivate

# Uninstall package
pip uninstal <package>
