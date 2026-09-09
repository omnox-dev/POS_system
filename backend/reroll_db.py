import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.seed import seed_database
from app import models

def reroll():
    print("Dropping all existing database tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating clean database tables...")
    Base.metadata.create_all(bind=engine)
    print("Seeding database with fresh initial data...")
    seed_database()
    print("[SUCCESS] Database successfully re-rolled to a 100% clean initial state!")


if __name__ == "__main__":
    reroll()
