from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Service Python en ligne"}

@app.get("/health")
def health_check():
    return {"status": "UP"}