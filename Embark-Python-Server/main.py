from fastapi import FastAPI
from api.workflow_router import router as workflow_router
from fastapi.middleware.cors import CORSMiddleware
from api.execution_status_router import execution_status_router
from uvicorn import run as uvicorn_run
from os import getenv as os_getenv, environ as os_environ
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# Add the router with the default prefix 'workflow'
app.include_router(workflow_router, prefix="/execute")
app.include_router(execution_status_router, prefix="/status")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,  # Allow cookies, authorization headers, etc.
    allow_methods=["*"],     # Allow all HTTP methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],     # Allow all headers
)

# Optionally, add a root path for health check or landing info
@app.get("/")
async def home():
    return {"message": "API is up and running"}


if __name__ == "__main__":
    # SETUP THE ENV VARIABLES FOR LLM EXECUTION
    gemini_key = os_getenv("GEMINI_API_KEY")
    os_environ["GEMINI_API_KEY"] = gemini_key
    os_environ["GOOGLE_API_KEY"] = gemini_key

    uvicorn_run(app, port=8000)