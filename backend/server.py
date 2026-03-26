from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'zyakka_db')]

JWT_SECRET = os.environ.get('JWT_SECRET', 'zyakka-jwt-secret')
JWT_ALGORITHM = 'HS256'
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')

app = FastAPI(title="Zyakka API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ── Models ──────────────────────────────────────────────────────
class UserCreate(BaseModel):
    name: str
    email: str
    phone: str = ""
    password: str
    role: str = "customer"

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

class CartAddItem(BaseModel):
    item_id: str
    restaurant_id: str
    quantity: int = 1

class CartUpdateItem(BaseModel):
    item_id: str
    quantity: int

class OrderCreate(BaseModel):
    delivery_address: str = "123 Main Street"
    special_instructions: str = ""
    zero_waste: bool = False

class SubscribeRequest(BaseModel):
    plan_id: str

class GroupOrderCreate(BaseModel):
    name: str
    restaurant_id: str
    delivery_address: str = ""

class GroupOrderAddItems(BaseModel):
    items: List[CartAddItem]

class ChatMessageCreate(BaseModel):
    message: str

class CheckoutRequest(BaseModel):
    order_id: str
    origin_url: str

class OrderStatusUpdate(BaseModel):
    status: str

class PrepTimeUpdate(BaseModel):
    estimated_prep_time: int

class StockUpdate(BaseModel):
    is_available: bool

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None

# ── Auth Helpers ────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    except Exception:
        return None

# ── Seed Data ───────────────────────────────────────────────────
SEED_RESTAURANTS = [
    {
        "id": "rest-1", "name": "Spice Garden", "description": "Authentic North Indian cuisine with rich flavors",
        "image_url": "https://images.unsplash.com/photo-1770816307454-892c27fc625e?w=600",
        "cuisine": "North Indian", "rating": 4.5, "distance_km": 2.3, "is_veg": False,
        "is_active": True, "owner_id": "kitchen-1", "address": "12 MG Road, Sector 5",
        "delivery_fee": 2.50, "prep_time_mins": 30
    },
    {
        "id": "rest-2", "name": "Dosa Express", "description": "South Indian delights, crispy dosas and idlis",
        "image_url": "https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?w=600",
        "cuisine": "South Indian", "rating": 4.2, "distance_km": 1.8, "is_veg": True,
        "is_active": True, "owner_id": "kitchen-2", "address": "45 Gandhi Nagar",
        "delivery_fee": 1.50, "prep_time_mins": 20
    },
    {
        "id": "rest-3", "name": "The Green Bowl", "description": "Fresh, healthy vegetarian bowls and salads",
        "image_url": "https://images.pexels.com/photos/6607380/pexels-photo-6607380.jpeg?w=600",
        "cuisine": "Healthy", "rating": 4.7, "distance_km": 3.1, "is_veg": True,
        "is_active": True, "owner_id": "kitchen-3", "address": "78 Park Avenue",
        "delivery_fee": 2.00, "prep_time_mins": 15
    },
    {
        "id": "rest-4", "name": "Tandoori Nights", "description": "Smoky tandoor specialties and kebabs",
        "image_url": "https://images.unsplash.com/photo-1678831654422-f4f8f22e0cd6?w=600",
        "cuisine": "Mughlai", "rating": 4.3, "distance_km": 4.5, "is_veg": False,
        "is_active": True, "owner_id": "kitchen-4", "address": "23 Nehru Place",
        "delivery_fee": 3.00, "prep_time_mins": 35
    },
    {
        "id": "rest-5", "name": "Chai & Bites", "description": "Quick snacks, chaat, and refreshing beverages",
        "image_url": "https://images.pexels.com/photos/5865234/pexels-photo-5865234.jpeg?w=600",
        "cuisine": "Snacks", "rating": 4.1, "distance_km": 0.8, "is_veg": False,
        "is_active": True, "owner_id": "kitchen-5", "address": "9 Station Road",
        "delivery_fee": 1.00, "prep_time_mins": 10
    },
    {
        "id": "rest-6", "name": "Amma's Kitchen", "description": "Homestyle meals, tiffin subscriptions available",
        "image_url": "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?w=600",
        "cuisine": "Home Style", "rating": 4.8, "distance_km": 1.5, "is_veg": False,
        "is_active": True, "owner_id": "kitchen-6", "address": "56 Lajpat Nagar",
        "delivery_fee": 1.50, "prep_time_mins": 25
    }
]

SEED_MENU_ITEMS = [
    # Spice Garden
    {"id": "item-1-1", "restaurant_id": "rest-1", "name": "Butter Chicken", "description": "Creamy tomato curry with tender chicken", "price": 12.99, "category": "Main Course", "is_veg": False, "is_available": True},
    {"id": "item-1-2", "restaurant_id": "rest-1", "name": "Paneer Tikka", "description": "Marinated cottage cheese grilled to perfection", "price": 9.99, "category": "Starters", "is_veg": True, "is_available": True},
    {"id": "item-1-3", "restaurant_id": "rest-1", "name": "Dal Makhani", "description": "Slow-cooked black lentils in butter", "price": 8.99, "category": "Main Course", "is_veg": True, "is_available": True},
    {"id": "item-1-4", "restaurant_id": "rest-1", "name": "Garlic Naan", "description": "Fresh clay-oven bread with garlic", "price": 2.99, "category": "Breads", "is_veg": True, "is_available": True},
    {"id": "item-1-5", "restaurant_id": "rest-1", "name": "Chicken Biryani", "description": "Fragrant basmati rice with spiced chicken", "price": 14.99, "category": "Rice", "is_veg": False, "is_available": True},
    # Dosa Express
    {"id": "item-2-1", "restaurant_id": "rest-2", "name": "Masala Dosa", "description": "Crispy crepe with spiced potato filling", "price": 6.99, "category": "Dosa", "is_veg": True, "is_available": True},
    {"id": "item-2-2", "restaurant_id": "rest-2", "name": "Idli Sambar", "description": "Steamed rice cakes with lentil soup", "price": 5.99, "category": "Breakfast", "is_veg": True, "is_available": True},
    {"id": "item-2-3", "restaurant_id": "rest-2", "name": "Rava Dosa", "description": "Semolina crepe with onions and herbs", "price": 7.49, "category": "Dosa", "is_veg": True, "is_available": True},
    {"id": "item-2-4", "restaurant_id": "rest-2", "name": "Filter Coffee", "description": "Authentic South Indian filter coffee", "price": 2.49, "category": "Beverages", "is_veg": True, "is_available": True},
    # The Green Bowl
    {"id": "item-3-1", "restaurant_id": "rest-3", "name": "Quinoa Buddha Bowl", "description": "Nutrient-packed bowl with roasted veggies", "price": 11.99, "category": "Bowls", "is_veg": True, "is_available": True},
    {"id": "item-3-2", "restaurant_id": "rest-3", "name": "Avocado Smoothie", "description": "Creamy avocado and spinach blend", "price": 5.99, "category": "Drinks", "is_veg": True, "is_available": True},
    {"id": "item-3-3", "restaurant_id": "rest-3", "name": "Mediterranean Wrap", "description": "Hummus, falafel and fresh vegetables", "price": 9.49, "category": "Wraps", "is_veg": True, "is_available": True},
    # Tandoori Nights
    {"id": "item-4-1", "restaurant_id": "rest-4", "name": "Seekh Kebab", "description": "Charcoal-grilled spiced minced lamb", "price": 11.99, "category": "Kebabs", "is_veg": False, "is_available": True},
    {"id": "item-4-2", "restaurant_id": "rest-4", "name": "Tandoori Chicken", "description": "Whole chicken marinated in yogurt spices", "price": 15.99, "category": "Tandoor", "is_veg": False, "is_available": True},
    {"id": "item-4-3", "restaurant_id": "rest-4", "name": "Paneer Tikka Masala", "description": "Grilled paneer in rich curry sauce", "price": 10.99, "category": "Main Course", "is_veg": True, "is_available": True},
    # Chai & Bites
    {"id": "item-5-1", "restaurant_id": "rest-5", "name": "Samosa Plate", "description": "Crispy pastry with spiced potato filling", "price": 3.99, "category": "Snacks", "is_veg": True, "is_available": True},
    {"id": "item-5-2", "restaurant_id": "rest-5", "name": "Masala Chai", "description": "Spiced Indian tea with milk", "price": 1.99, "category": "Beverages", "is_veg": True, "is_available": True},
    {"id": "item-5-3", "restaurant_id": "rest-5", "name": "Pav Bhaji", "description": "Spiced mashed veggies with buttered bread", "price": 6.99, "category": "Snacks", "is_veg": True, "is_available": True},
    {"id": "item-5-4", "restaurant_id": "rest-5", "name": "Chicken Tikka Roll", "description": "Spiced chicken wrapped in paratha", "price": 7.49, "category": "Rolls", "is_veg": False, "is_available": True},
    # Amma's Kitchen
    {"id": "item-6-1", "restaurant_id": "rest-6", "name": "Thali Meal", "description": "Complete meal with dal, sabzi, rice, roti", "price": 8.99, "category": "Meals", "is_veg": False, "is_available": True},
    {"id": "item-6-2", "restaurant_id": "rest-6", "name": "Veg Thali", "description": "Vegetarian complete meal platter", "price": 7.49, "category": "Meals", "is_veg": True, "is_available": True},
    {"id": "item-6-3", "restaurant_id": "rest-6", "name": "Curd Rice", "description": "Comfort food - rice with seasoned yogurt", "price": 4.99, "category": "Rice", "is_veg": True, "is_available": True},
    {"id": "item-6-4", "restaurant_id": "rest-6", "name": "Rasam", "description": "Tangy pepper soup, perfect digestive", "price": 3.49, "category": "Soups", "is_veg": True, "is_available": True},
]

SEED_SUBSCRIPTION_PLANS = [
    {"id": "plan-1", "restaurant_id": "rest-6", "restaurant_name": "Amma's Kitchen", "plan_type": "7day", "price": 39.99, "meals_per_day": 2, "description": "7-day home-style meal plan - Lunch & Dinner"},
    {"id": "plan-2", "restaurant_id": "rest-6", "restaurant_name": "Amma's Kitchen", "plan_type": "30day", "price": 149.99, "meals_per_day": 2, "description": "30-day home-style meal plan - Lunch & Dinner"},
    {"id": "plan-3", "restaurant_id": "rest-2", "restaurant_name": "Dosa Express", "plan_type": "7day", "price": 29.99, "meals_per_day": 1, "description": "7-day South Indian breakfast plan"},
    {"id": "plan-4", "restaurant_id": "rest-2", "restaurant_name": "Dosa Express", "plan_type": "30day", "price": 99.99, "meals_per_day": 1, "description": "30-day South Indian breakfast plan"},
    {"id": "plan-5", "restaurant_id": "rest-3", "restaurant_name": "The Green Bowl", "plan_type": "7day", "price": 44.99, "meals_per_day": 1, "description": "7-day healthy lunch bowl plan"},
    {"id": "plan-6", "restaurant_id": "rest-3", "restaurant_name": "The Green Bowl", "plan_type": "30day", "price": 159.99, "meals_per_day": 1, "description": "30-day healthy lunch bowl plan"},
]

async def seed_database():
    count = await db.restaurants.count_documents({})
    if count == 0:
        logger.info("Seeding database...")
        await db.restaurants.insert_many(SEED_RESTAURANTS)
        await db.menu_items.insert_many(SEED_MENU_ITEMS)
        await db.subscription_plans.insert_many(SEED_SUBSCRIPTION_PLANS)
        # Create demo kitchen owners
        for i in range(1, 7):
            await db.users.insert_one({
                "id": f"kitchen-{i}", "name": f"Kitchen Owner {i}",
                "email": f"kitchen{i}@zyakka.com", "phone": f"900000000{i}",
                "password_hash": hash_password("kitchen123"), "role": "kitchen",
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        # Create demo admin
        await db.users.insert_one({
            "id": "admin-1", "name": "Zyakka Admin",
            "email": "admin@zyakka.com", "phone": "9000000000",
            "password_hash": hash_password("admin123"), "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Database seeded successfully")

@app.on_event("startup")
async def startup():
    await seed_database()

@app.on_event("shutdown")
async def shutdown():
    client.close()

# ── Auth Routes ─────────────────────────────────────────────────
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id, "name": data.name, "email": data.email,
        "phone": data.phone, "password_hash": hash_password(data.password),
        "role": data.role, "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, data.role)
    return TokenResponse(
        access_token=token,
        user=UserProfile(id=user_id, name=data.name, email=data.email, phone=data.phone, role=data.role)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["role"])
    return TokenResponse(
        access_token=token,
        user=UserProfile(id=user["id"], name=user["name"], email=user["email"], phone=user.get("phone", ""), role=user["role"])
    )

@api_router.get("/auth/profile")
async def get_profile(user=Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"], "phone": user.get("phone", ""), "role": user["role"]}

@api_router.put("/auth/profile")
async def update_profile(data: ProfileUpdate, user=Depends(get_current_user)):
    updates = {}
    if data.name:
        updates["name"] = data.name
    if data.phone is not None:
        updates["phone"] = data.phone
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated

# ── Restaurant Routes ───────────────────────────────────────────
@api_router.get("/restaurants")
async def list_restaurants(search: str = "", cuisine: str = "", is_veg: Optional[bool] = None, min_rating: float = 0, sort_by: str = "rating"):
    query = {"is_active": True}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"cuisine": {"$regex": search, "$options": "i"}}
        ]
    if cuisine:
        query["cuisine"] = {"$regex": cuisine, "$options": "i"}
    if is_veg is not None:
        query["is_veg"] = is_veg
    if min_rating > 0:
        query["rating"] = {"$gte": min_rating}
    sort_field = "rating" if sort_by == "rating" else "distance_km"
    sort_dir = -1 if sort_by == "rating" else 1
    restaurants = await db.restaurants.find(query, {"_id": 0}).sort(sort_field, sort_dir).to_list(50)
    return restaurants

@api_router.get("/restaurants/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    restaurant = await db.restaurants.find_one({"id": restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    menu = await db.menu_items.find({"restaurant_id": restaurant_id}, {"_id": 0}).to_list(100)
    restaurant["menu"] = menu
    return restaurant

# ── Cart Routes ─────────────────────────────────────────────────
@api_router.get("/cart")
async def get_cart(user=Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart:
        return {"user_id": user["id"], "items": [], "restaurant_id": None, "restaurant_name": "", "subtotal": 0, "tax": 0, "delivery_fee": 0, "zero_waste_deposit": 0, "total": 0}
    return cart

@api_router.post("/cart/add")
async def add_to_cart(data: CartAddItem, user=Depends(get_current_user)):
    item = await db.menu_items.find_one({"id": data.item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    restaurant = await db.restaurants.find_one({"id": data.restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if cart and cart.get("restaurant_id") and cart["restaurant_id"] != data.restaurant_id:
        await db.carts.delete_one({"user_id": user["id"]})
        cart = None
    if not cart:
        cart = {"user_id": user["id"], "items": [], "restaurant_id": data.restaurant_id, "restaurant_name": restaurant["name"]}
    existing = next((i for i in cart["items"] if i["item_id"] == data.item_id), None)
    if existing:
        existing["quantity"] += data.quantity
    else:
        cart["items"].append({
            "item_id": data.item_id, "name": item["name"], "price": item["price"],
            "quantity": data.quantity, "restaurant_id": data.restaurant_id,
            "restaurant_name": restaurant["name"], "is_veg": item.get("is_veg", True)
        })
    cart = recalculate_cart(cart, restaurant["delivery_fee"])
    await db.carts.update_one({"user_id": user["id"]}, {"$set": cart}, upsert=True)
    return cart

@api_router.put("/cart/update")
async def update_cart_item(data: CartUpdateItem, user=Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    item = next((i for i in cart["items"] if i["item_id"] == data.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item not in cart")
    if data.quantity <= 0:
        cart["items"] = [i for i in cart["items"] if i["item_id"] != data.item_id]
    else:
        item["quantity"] = data.quantity
    restaurant = await db.restaurants.find_one({"id": cart.get("restaurant_id")}, {"_id": 0})
    fee = restaurant["delivery_fee"] if restaurant else 2.0
    cart = recalculate_cart(cart, fee)
    if not cart["items"]:
        await db.carts.delete_one({"user_id": user["id"]})
        return {"user_id": user["id"], "items": [], "restaurant_id": None, "restaurant_name": "", "subtotal": 0, "tax": 0, "delivery_fee": 0, "zero_waste_deposit": 0, "total": 0}
    await db.carts.update_one({"user_id": user["id"]}, {"$set": cart})
    return cart

@api_router.delete("/cart/clear")
async def clear_cart(user=Depends(get_current_user)):
    await db.carts.delete_one({"user_id": user["id"]})
    return {"message": "Cart cleared"}

def recalculate_cart(cart, delivery_fee=2.0):
    subtotal = sum(i["price"] * i["quantity"] for i in cart["items"])
    tax = round(subtotal * 0.08, 2)
    cart["subtotal"] = round(subtotal, 2)
    cart["tax"] = tax
    cart["delivery_fee"] = delivery_fee
    cart["zero_waste_deposit"] = 0
    cart["total"] = round(subtotal + tax + delivery_fee, 2)
    return cart

# ── Order Routes ────────────────────────────────────────────────
@api_router.post("/orders")
async def create_order(data: OrderCreate, user=Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    zero_waste_deposit = 1.00 if data.zero_waste else 0
    total = cart["total"] + zero_waste_deposit
    order = {
        "id": str(uuid.uuid4()), "user_id": user["id"], "user_name": user["name"],
        "restaurant_id": cart["restaurant_id"], "restaurant_name": cart.get("restaurant_name", ""),
        "items": cart["items"], "subtotal": cart["subtotal"], "tax": cart["tax"],
        "delivery_fee": cart["delivery_fee"], "zero_waste_deposit": zero_waste_deposit,
        "zero_waste": data.zero_waste, "total": round(total, 2),
        "status": "placed", "delivery_address": data.delivery_address,
        "special_instructions": data.special_instructions,
        "estimated_prep_time": None, "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "payment_status": "pending"
    }
    await db.orders.insert_one(order)
    await db.carts.delete_one({"user_id": user["id"]})
    return {k: v for k, v in order.items() if k != "_id"}

@api_router.get("/orders")
async def list_orders(user=Depends(get_current_user)):
    query = {"user_id": user["id"]}
    if user["role"] == "admin":
        query = {}
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user=Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# ── Subscription Routes ────────────────────────────────────────
@api_router.get("/subscriptions/plans")
async def list_subscription_plans():
    plans = await db.subscription_plans.find({}, {"_id": 0}).to_list(50)
    return plans

@api_router.post("/subscriptions")
async def create_subscription(data: SubscribeRequest, user=Depends(get_current_user)):
    plan = await db.subscription_plans.find_one({"id": data.plan_id}, {"_id": 0})
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    days = 7 if plan["plan_type"] == "7day" else 30
    sub = {
        "id": str(uuid.uuid4()), "user_id": user["id"], "plan_id": plan["id"],
        "restaurant_id": plan["restaurant_id"], "restaurant_name": plan["restaurant_name"],
        "plan_type": plan["plan_type"], "price": plan["price"],
        "meals_per_day": plan["meals_per_day"], "description": plan["description"],
        "start_date": datetime.now(timezone.utc).isoformat(),
        "end_date": (datetime.now(timezone.utc) + timedelta(days=days)).isoformat(),
        "status": "active", "created_at": datetime.now(timezone.utc).isoformat(),
        "payment_status": "pending"
    }
    await db.subscriptions.insert_one(sub)
    return {k: v for k, v in sub.items() if k != "_id"}

@api_router.get("/subscriptions/my")
async def my_subscriptions(user=Depends(get_current_user)):
    subs = await db.subscriptions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return subs

@api_router.put("/subscriptions/{sub_id}/cancel")
async def cancel_subscription(sub_id: str, user=Depends(get_current_user)):
    result = await db.subscriptions.update_one(
        {"id": sub_id, "user_id": user["id"]}, {"$set": {"status": "cancelled"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Subscription cancelled"}

# ── Group Order Routes ──────────────────────────────────────────
@api_router.post("/group-orders")
async def create_group_order(data: GroupOrderCreate, user=Depends(get_current_user)):
    restaurant = await db.restaurants.find_one({"id": data.restaurant_id}, {"_id": 0})
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    group = {
        "id": str(uuid.uuid4()), "creator_id": user["id"], "creator_name": user["name"],
        "name": data.name, "restaurant_id": data.restaurant_id,
        "restaurant_name": restaurant["name"],
        "members": [{"user_id": user["id"], "user_name": user["name"], "items": []}],
        "status": "open", "delivery_address": data.delivery_address,
        "total": 0, "delivery_fee": restaurant["delivery_fee"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.group_orders.insert_one(group)
    return {k: v for k, v in group.items() if k != "_id"}

@api_router.get("/group-orders")
async def list_group_orders(user=Depends(get_current_user)):
    groups = await db.group_orders.find(
        {"$or": [{"creator_id": user["id"]}, {"members.user_id": user["id"]}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return groups

@api_router.get("/group-orders/{group_id}")
async def get_group_order(group_id: str):
    group = await db.group_orders.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Group order not found")
    return group

@api_router.post("/group-orders/{group_id}/join")
async def join_group_order(group_id: str, user=Depends(get_current_user)):
    group = await db.group_orders.find_one({"id": group_id}, {"_id": 0})
    if not group or group["status"] != "open":
        raise HTTPException(status_code=400, detail="Group order not available")
    if any(m["user_id"] == user["id"] for m in group["members"]):
        return group
    await db.group_orders.update_one(
        {"id": group_id},
        {"$push": {"members": {"user_id": user["id"], "user_name": user["name"], "items": []}}}
    )
    return await db.group_orders.find_one({"id": group_id}, {"_id": 0})

@api_router.post("/group-orders/{group_id}/add-items")
async def add_items_to_group(group_id: str, data: GroupOrderAddItems, user=Depends(get_current_user)):
    group = await db.group_orders.find_one({"id": group_id}, {"_id": 0})
    if not group or group["status"] != "open":
        raise HTTPException(status_code=400, detail="Group order not available")
    items_data = []
    for ci in data.items:
        item = await db.menu_items.find_one({"id": ci.item_id}, {"_id": 0})
        if item:
            items_data.append({"item_id": item["id"], "name": item["name"], "price": item["price"], "quantity": ci.quantity})
    await db.group_orders.update_one(
        {"id": group_id, "members.user_id": user["id"]},
        {"$set": {"members.$.items": items_data}}
    )
    # Recalculate total
    updated = await db.group_orders.find_one({"id": group_id}, {"_id": 0})
    total = sum(
        sum(i["price"] * i["quantity"] for i in m["items"])
        for m in updated["members"]
    )
    fee = updated.get("delivery_fee", 2.0)
    tax = round(total * 0.08, 2)
    await db.group_orders.update_one(
        {"id": group_id},
        {"$set": {"total": round(total + tax + fee, 2), "subtotal": round(total, 2), "tax": tax}}
    )
    return await db.group_orders.find_one({"id": group_id}, {"_id": 0})

@api_router.post("/group-orders/{group_id}/place")
async def place_group_order(group_id: str, user=Depends(get_current_user)):
    group = await db.group_orders.find_one({"id": group_id}, {"_id": 0})
    if not group or group["creator_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Only creator can place group order")
    all_items = []
    for m in group["members"]:
        all_items.extend(m["items"])
    if not all_items:
        raise HTTPException(status_code=400, detail="No items in group order")
    order = {
        "id": str(uuid.uuid4()), "user_id": user["id"], "user_name": user["name"],
        "restaurant_id": group["restaurant_id"], "restaurant_name": group["restaurant_name"],
        "items": all_items, "subtotal": group.get("subtotal", 0), "tax": group.get("tax", 0),
        "delivery_fee": group.get("delivery_fee", 2.0), "zero_waste_deposit": 0, "zero_waste": False,
        "total": group.get("total", 0), "status": "placed",
        "delivery_address": group.get("delivery_address", ""), "special_instructions": f"Group Order: {group['name']}",
        "is_group_order": True, "group_id": group_id,
        "estimated_prep_time": None, "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(), "payment_status": "pending"
    }
    await db.orders.insert_one(order)
    await db.group_orders.update_one({"id": group_id}, {"$set": {"status": "placed", "order_id": order["id"]}})
    return {k: v for k, v in order.items() if k != "_id"}

# ── Chat Routes ─────────────────────────────────────────────────
chat_connections: Dict[str, List[WebSocket]] = {}

@api_router.get("/chat/{order_id}")
async def get_chat_messages(order_id: str, user=Depends(get_current_user)):
    messages = await db.chat_messages.find({"order_id": order_id}, {"_id": 0}).sort("timestamp", 1).to_list(200)
    return messages

@api_router.post("/chat/{order_id}")
async def send_chat_message(order_id: str, data: ChatMessageCreate, user=Depends(get_current_user)):
    msg = {
        "id": str(uuid.uuid4()), "order_id": order_id,
        "sender_id": user["id"], "sender_name": user["name"],
        "sender_role": user["role"], "message": data.message,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_messages.insert_one(msg)
    # Broadcast to WebSocket connections
    if order_id in chat_connections:
        for ws in chat_connections[order_id][:]:
            try:
                await ws.send_json({k: v for k, v in msg.items() if k != "_id"})
            except Exception:
                chat_connections[order_id].remove(ws)
    return {k: v for k, v in msg.items() if k != "_id"}

@app.websocket("/api/ws/chat/{order_id}")
async def websocket_chat(websocket: WebSocket, order_id: str):
    await websocket.accept()
    if order_id not in chat_connections:
        chat_connections[order_id] = []
    chat_connections[order_id].append(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            msg = {
                "id": str(uuid.uuid4()), "order_id": order_id,
                "sender_id": data.get("sender_id", ""), "sender_name": data.get("sender_name", ""),
                "sender_role": data.get("sender_role", "customer"), "message": data.get("message", ""),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            await db.chat_messages.insert_one(msg)
            for ws in chat_connections[order_id][:]:
                try:
                    await ws.send_json({k: v for k, v in msg.items() if k != "_id"})
                except Exception:
                    chat_connections[order_id].remove(ws)
    except WebSocketDisconnect:
        chat_connections[order_id].remove(websocket)

# ── Payment Routes ──────────────────────────────────────────────
@api_router.post("/payments/checkout")
async def create_checkout(data: CheckoutRequest, request: Request, user=Depends(get_current_user)):
    order = await db.orders.find_one({"id": data.order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    amount = float(order["total"])
    origin = data.origin_url.rstrip("/")
    success_url = f"{origin}/order/{order['id']}?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/cart"
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        host_url = str(request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        checkout_req = CheckoutSessionRequest(
            amount=amount, currency="usd", success_url=success_url, cancel_url=cancel_url,
            metadata={"order_id": order["id"], "user_id": user["id"]}
        )
        session = await stripe_checkout.create_checkout_session(checkout_req)
        # Create payment transaction record
        await db.payment_transactions.insert_one({
            "id": str(uuid.uuid4()), "session_id": session.session_id,
            "order_id": order["id"], "user_id": user["id"],
            "amount": amount, "currency": "usd", "payment_status": "pending",
            "metadata": {"order_id": order["id"], "user_id": user["id"]},
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        return {"url": session.url, "session_id": session.session_id}
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, user=Depends(get_current_user)):
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        status = await stripe_checkout.get_checkout_status(session_id)
        # Update payment transaction
        tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if tx and tx["payment_status"] != "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": status.payment_status, "status": status.status}}
            )
            if status.payment_status == "paid":
                await db.orders.update_one(
                    {"id": tx["order_id"]},
                    {"$set": {"payment_status": "paid", "status": "placed"}}
                )
        return {"payment_status": status.payment_status, "status": status.status, "amount_total": status.amount_total, "currency": status.currency}
    except Exception as e:
        logger.error(f"Payment status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        body = await request.body()
        sig = request.headers.get("Stripe-Signature", "")
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
        event = await stripe_checkout.handle_webhook(body, sig)
        if event.payment_status == "paid":
            tx = await db.payment_transactions.find_one({"session_id": event.session_id}, {"_id": 0})
            if tx and tx["payment_status"] != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"payment_status": "paid"}}
                )
                await db.orders.update_one(
                    {"id": tx.get("order_id")},
                    {"$set": {"payment_status": "paid"}}
                )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "detail": str(e)}

# ── Kitchen Routes ──────────────────────────────────────────────
@api_router.get("/kitchen/orders")
async def kitchen_orders(user=Depends(get_current_user)):
    if user["role"] not in ["kitchen", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    query = {}
    if user["role"] == "kitchen":
        restaurants = await db.restaurants.find({"owner_id": user["id"]}, {"_id": 0, "id": 1}).to_list(10)
        rest_ids = [r["id"] for r in restaurants]
        query = {"restaurant_id": {"$in": rest_ids}}
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.put("/kitchen/orders/{order_id}/accept")
async def accept_order(order_id: str, user=Depends(get_current_user)):
    if user["role"] not in ["kitchen", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "accepted", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Order accepted"}

@api_router.put("/kitchen/orders/{order_id}/reject")
async def reject_order(order_id: str, user=Depends(get_current_user)):
    if user["role"] not in ["kitchen", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Order rejected"}

@api_router.put("/kitchen/orders/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, user=Depends(get_current_user)):
    if user["role"] not in ["kitchen", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    valid_statuses = ["placed", "accepted", "preparing", "out_for_delivery", "delivered", "rejected"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": data.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": f"Order status updated to {data.status}"}

@api_router.put("/kitchen/orders/{order_id}/prep-time")
async def set_prep_time(order_id: str, data: PrepTimeUpdate, user=Depends(get_current_user)):
    if user["role"] not in ["kitchen", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"estimated_prep_time": data.estimated_prep_time, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": f"Prep time set to {data.estimated_prep_time} minutes"}

@api_router.put("/kitchen/menu/{item_id}/stock")
async def toggle_stock(item_id: str, data: StockUpdate, user=Depends(get_current_user)):
    if user["role"] not in ["kitchen", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.menu_items.update_one({"id": item_id}, {"$set": {"is_available": data.is_available}})
    return {"message": f"Item {'available' if data.is_available else 'out of stock'}"}

@api_router.get("/kitchen/menu")
async def kitchen_menu(user=Depends(get_current_user)):
    if user["role"] not in ["kitchen", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    restaurants = await db.restaurants.find({"owner_id": user["id"]}, {"_id": 0, "id": 1}).to_list(10)
    rest_ids = [r["id"] for r in restaurants]
    items = await db.menu_items.find({"restaurant_id": {"$in": rest_ids}}, {"_id": 0}).to_list(100)
    return items

# ── Admin Routes ────────────────────────────────────────────────
@api_router.get("/admin/stats")
async def admin_stats(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    total_orders = await db.orders.count_documents({})
    active_orders = await db.orders.count_documents({"status": {"$in": ["placed", "accepted", "preparing", "out_for_delivery"]}})
    total_revenue_pipeline = [{"$match": {"payment_status": "paid"}}, {"$group": {"_id": None, "total": {"$sum": "$total"}}}]
    revenue_result = await db.orders.aggregate(total_revenue_pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    total_users = await db.users.count_documents({"role": "customer"})
    total_kitchens = await db.restaurants.count_documents({})
    total_subscriptions = await db.subscriptions.count_documents({"status": "active"})
    # Recent orders by restaurant (for heatmap-like data)
    demand_pipeline = [
        {"$group": {"_id": "$restaurant_name", "order_count": {"$sum": 1}, "revenue": {"$sum": "$total"}}},
        {"$sort": {"order_count": -1}}, {"$limit": 10}
    ]
    demand_data = await db.orders.aggregate(demand_pipeline).to_list(10)
    return {
        "total_orders": total_orders, "active_orders": active_orders,
        "total_revenue": round(total_revenue, 2), "total_users": total_users,
        "total_kitchens": total_kitchens, "total_subscriptions": total_subscriptions,
        "demand_data": demand_data
    }

@api_router.get("/admin/orders")
async def admin_orders(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return orders

@api_router.get("/admin/kitchens")
async def admin_kitchens(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    restaurants = await db.restaurants.find({}, {"_id": 0}).to_list(50)
    for r in restaurants:
        order_count = await db.orders.count_documents({"restaurant_id": r["id"]})
        revenue_pipeline = [
            {"$match": {"restaurant_id": r["id"], "payment_status": "paid"}},
            {"$group": {"_id": None, "total": {"$sum": "$total"}}}
        ]
        rev = await db.orders.aggregate(revenue_pipeline).to_list(1)
        r["total_orders"] = order_count
        r["total_revenue"] = round(rev[0]["total"], 2) if rev else 0
        r["kitchen_payout"] = round(r["total_revenue"] * 0.85, 2)
        r["platform_fee"] = round(r["total_revenue"] * 0.15, 2)
    return restaurants

@api_router.get("/admin/payouts")
async def admin_payouts(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {
            "_id": "$restaurant_id",
            "restaurant_name": {"$first": "$restaurant_name"},
            "total_revenue": {"$sum": "$total"},
            "order_count": {"$sum": 1}
        }},
        {"$sort": {"total_revenue": -1}}
    ]
    payouts = await db.orders.aggregate(pipeline).to_list(50)
    result = []
    for p in payouts:
        result.append({
            "restaurant_id": p["_id"],
            "restaurant_name": p["restaurant_name"],
            "total_revenue": round(p["total_revenue"], 2),
            "kitchen_share": round(p["total_revenue"] * 0.85, 2),
            "platform_share": round(p["total_revenue"] * 0.15, 2),
            "order_count": p["order_count"]
        })
    return result

# ── Health Check ────────────────────────────────────────────────
@api_router.get("/health")
async def health():
    return {"status": "healthy", "app": "Zyakka"}

# Include router & middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
