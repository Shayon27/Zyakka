"""
Backend API tests for Zyakka food delivery platform
Tests: Auth (register, login, demo accounts), Restaurants (list, filter, get by id), Cart (add, update, clear)
"""
import pytest
import requests
import os
import uuid

BASE_URL = "https://market-disrupt.preview.emergentagent.com"

class TestHealth:
    """Health check endpoint"""
    
    def test_health_check(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["app"] == "Zyakka"
        print("✓ Health check passed")


class TestAuth:
    """Authentication endpoints - register, login, demo accounts"""
    
    def test_register_new_user(self):
        """Test user registration and verify persistence"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@zyakka.com"
        payload = {
            "name": "Test User",
            "email": unique_email,
            "phone": "9876543210",
            "password": "testpass123",
            "role": "customer"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["name"] == "Test User"
        assert data["user"]["role"] == "customer"
        print(f"✓ User registration successful: {unique_email}")
        
        # Verify token works by fetching profile
        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        profile_response = requests.get(f"{BASE_URL}/api/auth/profile", headers=headers)
        assert profile_response.status_code == 200
        profile = profile_response.json()
        assert profile["email"] == unique_email
        print("✓ Token verification successful")
    
    def test_register_duplicate_email(self):
        """Test that duplicate email registration fails"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@zyakka.com"
        payload = {
            "name": "Test User",
            "email": unique_email,
            "phone": "9876543210",
            "password": "testpass123"
        }
        # First registration
        response1 = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response1.status_code == 200
        
        # Duplicate registration
        response2 = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert response2.status_code == 400
        assert "already registered" in response2.json()["detail"].lower()
        print("✓ Duplicate email validation working")
    
    def test_login_success(self):
        """Test login with valid credentials"""
        # First register a user
        unique_email = f"test_{uuid.uuid4().hex[:8]}@zyakka.com"
        register_payload = {
            "name": "Login Test User",
            "email": unique_email,
            "phone": "9876543210",
            "password": "logintest123"
        }
        requests.post(f"{BASE_URL}/api/auth/register", json=register_payload)
        
        # Now login
        login_payload = {"email": unique_email, "password": "logintest123"}
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        print(f"✓ Login successful: {unique_email}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid password"""
        payload = {"email": "nonexistent@zyakka.com", "password": "wrongpass"}
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
        print("✓ Invalid credentials rejected")
    
    def test_demo_kitchen_login(self):
        """Test demo kitchen account login and role verification"""
        payload = {"email": "kitchen1@zyakka.com", "password": "kitchen123"}
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["user"]["role"] == "kitchen"
        assert data["user"]["email"] == "kitchen1@zyakka.com"
        print("✓ Demo kitchen login successful")
    
    def test_demo_admin_login(self):
        """Test demo admin account login and role verification"""
        payload = {"email": "admin@zyakka.com", "password": "admin123"}
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == "admin@zyakka.com"
        print("✓ Demo admin login successful")


class TestRestaurants:
    """Restaurant endpoints - list, filter, get by id"""
    
    def test_list_all_restaurants(self):
        """Test GET /api/restaurants returns seeded restaurants"""
        response = requests.get(f"{BASE_URL}/api/restaurants")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 6, f"Expected 6 restaurants, got {len(data)}"
        
        # Verify structure of first restaurant
        first = data[0]
        required_fields = ["id", "name", "description", "cuisine", "rating", "distance_km", "is_veg", "delivery_fee", "prep_time_mins"]
        for field in required_fields:
            assert field in first, f"Missing field: {field}"
        
        print(f"✓ Listed {len(data)} restaurants")
    
    def test_filter_veg_restaurants(self):
        """Test GET /api/restaurants?is_veg=true filters vegetarian restaurants"""
        response = requests.get(f"{BASE_URL}/api/restaurants?is_veg=true")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0, "No vegetarian restaurants found"
        
        # Verify all returned restaurants are vegetarian
        for restaurant in data:
            assert restaurant["is_veg"] is True, f"Non-veg restaurant in veg filter: {restaurant['name']}"
        
        print(f"✓ Veg filter working: {len(data)} veg restaurants")
    
    def test_get_restaurant_by_id(self):
        """Test GET /api/restaurants/{id} returns restaurant with menu"""
        # First get list to get a valid ID
        list_response = requests.get(f"{BASE_URL}/api/restaurants")
        restaurants = list_response.json()
        restaurant_id = restaurants[0]["id"]
        
        # Get specific restaurant
        response = requests.get(f"{BASE_URL}/api/restaurants/{restaurant_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == restaurant_id
        assert "menu" in data
        assert isinstance(data["menu"], list)
        assert len(data["menu"]) > 0, "Restaurant should have menu items"
        
        # Verify menu item structure
        menu_item = data["menu"][0]
        required_fields = ["id", "name", "description", "price", "category", "is_veg", "is_available"]
        for field in required_fields:
            assert field in menu_item, f"Missing menu field: {field}"
        
        print(f"✓ Restaurant details fetched: {data['name']} with {len(data['menu'])} menu items")
    
    def test_get_nonexistent_restaurant(self):
        """Test GET /api/restaurants/{id} with invalid ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/restaurants/invalid-id-12345")
        assert response.status_code == 404
        print("✓ 404 for nonexistent restaurant")


class TestCart:
    """Cart endpoints - add, update, clear"""
    
    @pytest.fixture
    def auth_token(self):
        """Create a test user and return auth token"""
        unique_email = f"cart_test_{uuid.uuid4().hex[:8]}@zyakka.com"
        payload = {
            "name": "Cart Test User",
            "email": unique_email,
            "phone": "9876543210",
            "password": "carttest123"
        }
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        return response.json()["access_token"]
    
    def test_get_empty_cart(self, auth_token):
        """Test GET /api/cart returns empty cart for new user"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/cart", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        print("✓ Empty cart retrieved")
    
    def test_add_item_to_cart(self, auth_token):
        """Test POST /api/cart/add adds item and verify persistence"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Get a menu item first
        restaurants = requests.get(f"{BASE_URL}/api/restaurants").json()
        restaurant_id = restaurants[0]["id"]
        restaurant_detail = requests.get(f"{BASE_URL}/api/restaurants/{restaurant_id}").json()
        menu_item = restaurant_detail["menu"][0]
        
        # Add to cart
        payload = {
            "item_id": menu_item["id"],
            "restaurant_id": restaurant_id,
            "quantity": 2
        }
        response = requests.post(f"{BASE_URL}/api/cart/add", json=payload, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["item_id"] == menu_item["id"]
        assert data["items"][0]["quantity"] == 2
        assert data["subtotal"] > 0
        assert data["total"] > 0
        print(f"✓ Item added to cart: {menu_item['name']} x2")
        
        # Verify persistence by fetching cart again
        get_response = requests.get(f"{BASE_URL}/api/cart", headers=headers)
        cart_data = get_response.json()
        assert len(cart_data["items"]) == 1
        assert cart_data["items"][0]["quantity"] == 2
        print("✓ Cart persistence verified")
    
    def test_update_cart_item(self, auth_token):
        """Test PUT /api/cart/update updates item quantity"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Add item first
        restaurants = requests.get(f"{BASE_URL}/api/restaurants").json()
        restaurant_id = restaurants[0]["id"]
        restaurant_detail = requests.get(f"{BASE_URL}/api/restaurants/{restaurant_id}").json()
        menu_item = restaurant_detail["menu"][0]
        
        add_payload = {
            "item_id": menu_item["id"],
            "restaurant_id": restaurant_id,
            "quantity": 1
        }
        requests.post(f"{BASE_URL}/api/cart/add", json=add_payload, headers=headers)
        
        # Update quantity
        update_payload = {
            "item_id": menu_item["id"],
            "quantity": 5
        }
        response = requests.put(f"{BASE_URL}/api/cart/update", json=update_payload, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["items"][0]["quantity"] == 5
        print("✓ Cart item quantity updated to 5")
    
    def test_clear_cart(self, auth_token):
        """Test DELETE /api/cart/clear removes all items"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Add item first
        restaurants = requests.get(f"{BASE_URL}/api/restaurants").json()
        restaurant_id = restaurants[0]["id"]
        restaurant_detail = requests.get(f"{BASE_URL}/api/restaurants/{restaurant_id}").json()
        menu_item = restaurant_detail["menu"][0]
        
        add_payload = {
            "item_id": menu_item["id"],
            "restaurant_id": restaurant_id,
            "quantity": 1
        }
        requests.post(f"{BASE_URL}/api/cart/add", json=add_payload, headers=headers)
        
        # Clear cart
        response = requests.delete(f"{BASE_URL}/api/cart/clear", headers=headers)
        assert response.status_code == 200
        
        # Verify cart is empty
        get_response = requests.get(f"{BASE_URL}/api/cart", headers=headers)
        cart_data = get_response.json()
        assert cart_data["items"] == []
        print("✓ Cart cleared successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
