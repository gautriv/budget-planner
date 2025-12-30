from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

# Pre-defined categories
DEFAULT_CATEGORIES = [
    {"id": "cat_food", "name": "Food & Dining", "icon": "utensils", "color": "#10b981", "type": "expense", "is_default": True},
    {"id": "cat_transport", "name": "Transportation", "icon": "car", "color": "#3b82f6", "is_default": True, "type": "expense"},
    {"id": "cat_entertainment", "name": "Entertainment", "icon": "gamepad-2", "color": "#8b5cf6", "is_default": True, "type": "expense"},
    {"id": "cat_bills", "name": "Bills & Utilities", "icon": "receipt", "color": "#f59e0b", "is_default": True, "type": "expense"},
    {"id": "cat_shopping", "name": "Shopping", "icon": "shopping-bag", "color": "#ec4899", "is_default": True, "type": "expense"},
    {"id": "cat_health", "name": "Health", "icon": "heart-pulse", "color": "#ef4444", "is_default": True, "type": "expense"},
    {"id": "cat_housing", "name": "Housing", "icon": "home", "color": "#06b6d4", "is_default": True, "type": "expense"},
    {"id": "cat_savings", "name": "Savings", "icon": "piggy-bank", "color": "#22c55e", "is_default": True, "type": "expense"},
    {"id": "cat_salary", "name": "Salary", "icon": "briefcase", "color": "#10b981", "is_default": True, "type": "income"},
    {"id": "cat_freelance", "name": "Freelance", "icon": "laptop", "color": "#6366f1", "is_default": True, "type": "income"},
    {"id": "cat_investment", "name": "Investments", "icon": "trending-up", "color": "#14b8a6", "is_default": True, "type": "income"},
    {"id": "cat_other_income", "name": "Other Income", "icon": "wallet", "color": "#84cc16", "is_default": True, "type": "income"},
]

# Models
class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"cat_{uuid.uuid4().hex[:8]}")
    name: str
    icon: str = "circle"
    color: str = "#6b7280"
    type: str = "expense"
    is_default: bool = False

class CategoryCreate(BaseModel):
    name: str
    icon: str = "circle"
    color: str = "#6b7280"
    type: str = "expense"

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"txn_{uuid.uuid4().hex[:8]}")
    amount: float
    type: TransactionType
    category_id: str
    description: str = ""
    date: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TransactionCreate(BaseModel):
    amount: float
    type: TransactionType
    category_id: str
    description: str = ""
    date: str

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[TransactionType] = None
    category_id: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None

class Budget(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"bgt_{uuid.uuid4().hex[:8]}")
    category_id: str
    limit: float
    month: str  # Format: YYYY-MM
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BudgetCreate(BaseModel):
    category_id: str
    limit: float
    month: str

class BudgetUpdate(BaseModel):
    limit: Optional[float] = None

class SavingsGoal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"goal_{uuid.uuid4().hex[:8]}")
    name: str
    target_amount: float
    current_amount: float = 0
    deadline: Optional[str] = None
    icon: str = "target"
    color: str = "#10b981"
    image_url: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SavingsGoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0
    deadline: Optional[str] = None
    icon: str = "target"
    color: str = "#10b981"
    image_url: Optional[str] = None

class SavingsGoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None

# Initialize default categories
async def init_categories():
    existing = await db.categories.find_one({})
    if not existing:
        await db.categories.insert_many(DEFAULT_CATEGORIES)

@app.on_event("startup")
async def startup_event():
    await init_categories()

# Category Endpoints
@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    return categories

@api_router.post("/categories", response_model=Category)
async def create_category(input: CategoryCreate):
    category = Category(**input.model_dump())
    await db.categories.insert_one(category.model_dump())
    return category

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id, "is_default": False})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found or is a default category")
    return {"message": "Category deleted"}

# Transaction Endpoints
@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(month: Optional[str] = None, type: Optional[str] = None):
    query = {}
    if month:
        query["date"] = {"$regex": f"^{month}"}
    if type:
        query["type"] = type
    transactions = await db.transactions.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return transactions

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(input: TransactionCreate):
    transaction = Transaction(**input.model_dump())
    await db.transactions.insert_one(transaction.model_dump())
    return transaction

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, input: TransactionUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.transactions.find_one_and_update(
        {"id": transaction_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    result.pop("_id", None)
    return result

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str):
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"message": "Transaction deleted"}

# Budget Endpoints
@api_router.get("/budgets", response_model=List[Budget])
async def get_budgets(month: Optional[str] = None):
    query = {}
    if month:
        query["month"] = month
    budgets = await db.budgets.find(query, {"_id": 0}).to_list(100)
    return budgets

@api_router.post("/budgets", response_model=Budget)
async def create_budget(input: BudgetCreate):
    # Check if budget already exists for this category and month
    existing = await db.budgets.find_one({"category_id": input.category_id, "month": input.month})
    if existing:
        # Update existing budget
        await db.budgets.update_one(
            {"category_id": input.category_id, "month": input.month},
            {"$set": {"limit": input.limit}}
        )
        existing.pop("_id", None)
        existing["limit"] = input.limit
        return existing
    
    budget = Budget(**input.model_dump())
    await db.budgets.insert_one(budget.model_dump())
    return budget

@api_router.put("/budgets/{budget_id}", response_model=Budget)
async def update_budget(budget_id: str, input: BudgetUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.budgets.find_one_and_update(
        {"id": budget_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    result.pop("_id", None)
    return result

@api_router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: str):
    result = await db.budgets.delete_one({"id": budget_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted"}

# Savings Goals Endpoints
@api_router.get("/savings-goals", response_model=List[SavingsGoal])
async def get_savings_goals():
    goals = await db.savings_goals.find({}, {"_id": 0}).to_list(100)
    return goals

@api_router.post("/savings-goals", response_model=SavingsGoal)
async def create_savings_goal(input: SavingsGoalCreate):
    goal = SavingsGoal(**input.model_dump())
    await db.savings_goals.insert_one(goal.model_dump())
    return goal

@api_router.put("/savings-goals/{goal_id}", response_model=SavingsGoal)
async def update_savings_goal(goal_id: str, input: SavingsGoalUpdate):
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.savings_goals.find_one_and_update(
        {"id": goal_id},
        {"$set": update_data},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    
    result.pop("_id", None)
    return result

@api_router.delete("/savings-goals/{goal_id}")
async def delete_savings_goal(goal_id: str):
    result = await db.savings_goals.delete_one({"id": goal_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    return {"message": "Savings goal deleted"}

# Dashboard/Analytics Endpoints
@api_router.get("/dashboard/summary")
async def get_dashboard_summary(month: str):
    # Get all transactions for the month
    transactions = await db.transactions.find(
        {"date": {"$regex": f"^{month}"}}, 
        {"_id": 0}
    ).to_list(1000)
    
    total_income = sum(t["amount"] for t in transactions if t["type"] == "income")
    total_expenses = sum(t["amount"] for t in transactions if t["type"] == "expense")
    balance = total_income - total_expenses
    
    # Get spending by category
    expense_transactions = [t for t in transactions if t["type"] == "expense"]
    spending_by_category = {}
    for t in expense_transactions:
        cat_id = t["category_id"]
        spending_by_category[cat_id] = spending_by_category.get(cat_id, 0) + t["amount"]
    
    # Get budgets for the month
    budgets = await db.budgets.find({"month": month}, {"_id": 0}).to_list(100)
    
    # Calculate budget alerts
    alerts = []
    for budget in budgets:
        spent = spending_by_category.get(budget["category_id"], 0)
        percentage = (spent / budget["limit"] * 100) if budget["limit"] > 0 else 0
        if percentage >= 80:
            alerts.append({
                "category_id": budget["category_id"],
                "spent": spent,
                "limit": budget["limit"],
                "percentage": percentage,
                "status": "exceeded" if percentage >= 100 else "warning"
            })
    
    # Get categories for mapping
    categories = await db.categories.find({}, {"_id": 0}).to_list(100)
    category_map = {c["id"]: c for c in categories}
    
    # Prepare spending breakdown with category info
    spending_breakdown = []
    for cat_id, amount in spending_by_category.items():
        cat = category_map.get(cat_id, {})
        spending_breakdown.append({
            "category_id": cat_id,
            "category_name": cat.get("name", "Unknown"),
            "category_color": cat.get("color", "#6b7280"),
            "category_icon": cat.get("icon", "circle"),
            "amount": amount
        })
    
    spending_breakdown.sort(key=lambda x: x["amount"], reverse=True)
    
    return {
        "month": month,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": balance,
        "savings_rate": ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0,
        "spending_breakdown": spending_breakdown,
        "alerts": alerts,
        "transaction_count": len(transactions)
    }

@api_router.get("/analytics/trends")
async def get_spending_trends(months: int = 6):
    # Get spending trends for the last N months
    from datetime import date
    from dateutil.relativedelta import relativedelta
    
    today = date.today()
    trends = []
    
    for i in range(months - 1, -1, -1):
        target_date = today - relativedelta(months=i)
        month_str = target_date.strftime("%Y-%m")
        
        transactions = await db.transactions.find(
            {"date": {"$regex": f"^{month_str}"}}, 
            {"_id": 0}
        ).to_list(1000)
        
        income = sum(t["amount"] for t in transactions if t["type"] == "income")
        expenses = sum(t["amount"] for t in transactions if t["type"] == "expense")
        
        trends.append({
            "month": month_str,
            "income": income,
            "expenses": expenses,
            "savings": income - expenses
        })
    
    return trends

@api_router.get("/")
async def root():
    return {"message": "Budget App API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
