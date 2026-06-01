from dotenv import load_dotenv

load_dotenv()

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, engine
from app.routers import auth, dashboard, emr, patients, providers, vitals, appointments, diagnosis
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        seed_if_empty(db)
    yield


app = FastAPI(title="Health Prime API", version="1.0.0", lifespan=lifespan)

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(providers.router)
app.include_router(dashboard.router)
app.include_router(vitals.router)
app.include_router(emr.router)
app.include_router(appointments.router)
app.include_router(diagnosis.router)

@app.get("/health")
def health():
    return {"status": "ok"}



