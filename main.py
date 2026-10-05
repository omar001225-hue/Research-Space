
from fastapi import FastAPI , HTTPException
from pydantic import BaseModel

from sqlalchemy import create_engine, Column, Integer, String, Text, Date
from sqlalchemy.orm import sessionmaker, declarative_base, Session


from datetime import date


engine = create_engine("mysql+pymysql://root:password@localhost:3306/research_portal")
LocalSession = sessionmaker(bind=engine)

Base = declarative_base()

class Opportunity(Base):

    __tablename__ = "research_opportunities"
    id = Column(Integer, primary_key=True)
    title = Column(String(200))
    description = Column(Text)
    research_area = Column(String(100))
    faculty_name = Column(String(100))
    department=Column(String(100))
    required_skills = Column(String(300))
    available_positions = Column(Integer)
    application_deadline = Column(Date)
    status = Column(String(10))



app = FastAPI()

 
class OpportunityIn(BaseModel):
    
    title: str
    description: str
    research_area: str
    faculty_name: str
    department: str
    required_skills: str
    available_positions: int
    application_deadline: date
    status: str = "Open"











