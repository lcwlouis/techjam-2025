# techjam-2025
JurAI or smth 


# backend instructions 
create own virtual environment using command `` python -m venv .venv ``

then activate using `` source .venv/bin/activate ``

then install requirements via `` pip install -r requirements.txt `` 

if there are any new packages installed update requirements via `` pip freeze > requirements.txt `` so that next person can install new reqs 

to run backend server run `` uvicorn main:app --host 0.0.0.0 --port 80``
