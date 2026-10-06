
from fastapi import FastAPI , Depends , HTTPException
from pydantic import BaseModel

from sqlalchemy import create_engine, Column, Integer, String, Text, Date
from sqlalchemy.orm import sessionmaker, declarative_base, Session


from datetime import date


engine = create_engine("mysql+pymysql://root@localhost:3306/research_portal")
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


def session_generation():

    db = LocalSession()
    try : 
        yield db
    finally : 
        db.close()



@app.post("/opportunities")
def create(data:OpportunityIn , db = Depends(session_generation)):

    if (data.status != "Open") and (data.status != "Close"):
        raise HTTPException (
            status_code=400 , 
            detail= "This is a Client Side error , The client did not enter the correct status for the research opportunity  "
        )
    

    new_opportunities = Opportunity(title = data.title , description = data.description ,research_area = data.research_area , 
                                    faculty_name = data.faculty_name , department = data.department 
                                     , required_skills = data.required_skills , available_positions = data.available_positions ,
                                      application_deadline = data.application_deadline , status = data.status ) 

    #this setups the new row the client is inserting in our databse server via parameters given by the client

    # the db.add actually adds it to the database 
    # db.commit , commits or saves the changes to the table of the database 
    db.add(new_opportunities)
    db.commit()
    return {
        "message " : " 201 , Research Entery Posted Successfully! "
    }



@app.get("/opportunities/{id}")
def find(id : int , db = Depends(session_generation)):


    found_opportunity = db.query(Opportunity).filter(Opportunity.id == id ).first() 

    #this means to search the table (Opportunity) and filter only those id(s) 
    # which match the users given ID
    # .first() means that give only the first matching result
    
    if found_opportunity is None :
        raise HTTPException(
            status_code = 404 ,
            detail = "Opportunity ID not found"
            )

    return {

        "Opportunity ID  " : found_opportunity.id , 
        "Title" : found_opportunity.title , 
        "Description": found_opportunity.description ,
        "Research Area " : found_opportunity.research_area ,
        "Faculty Name" : found_opportunity.faculty_name ,
        "Department" : found_opportunity.department ,
        "Required Skills" : found_opportunity.required_skills , 
        "Available Positions" : found_opportunity.available_positions , 
        "Application Deadline" : found_opportunity.application_deadline , 
        "Status" : found_opportunity.status

    }





