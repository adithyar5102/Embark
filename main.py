from fastapi import FastAPI
from api.workflow_router import router as workflow_router

app = FastAPI()

# Add the router with the default prefix 'workflow'
app.include_router(workflow_router, prefix="/workflow")

# Optionally, add a root path for health check or landing info
@app.get("/")
async def home():
    return {"message": "API is up and running"}
