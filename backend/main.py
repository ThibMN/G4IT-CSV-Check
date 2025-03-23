from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import *

app = FastAPI()

# Configurer CORS pour permettre les requêtes du front-end
origins = [
    "http://localhost:3000",  # URL du front-end Next.js
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/data")
def read_data():
    return {"message": "Hello from FastAPI"}