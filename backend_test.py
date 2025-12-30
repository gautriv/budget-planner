import requests
import sys
import json
from datetime import datetime, date
from typing import Dict, List, Any

class BudgetAppAPITester:
    def __init__(self, base_url="https://smartbudget-app-10.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.created_resources = {
            'categories': [],
            'transactions': [],
            'budgets': [],
            'savings_goals': []
        }

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            self.failed_tests.append(f"{name}: {details}")
            print(f"❌ {name} - {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.base_url}/api{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                return False, {}, 0
            
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {}
                
            return response.status_code < 400, response_data, response.status_code
            
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_categories_api(self):
        """Test Categories API endpoints"""
        print("\n🔍 Testing Categories API...")
        
        # Test GET /categories
        success, data, status = self.make_request('GET', '/categories')
        self.log_test("GET /categories", success and status == 200, 
                     f"Status: {status}" if not success else "")
        
        if success:
            categories = data
            print(f"   Found {len(categories)} default categories")
            
            # Test POST /categories - Create custom category
            new_category = {
                "name": "Test Category",
                "icon": "test",
                "color": "#ff0000",
                "type": "expense"
            }
            success, data, status = self.make_request('POST', '/categories', new_category)
            self.log_test("POST /categories", success and status == 200, 
                         f"Status: {status}" if not success else "")
            
            if success and 'id' in data:
                category_id = data['id']
                self.created_resources['categories'].append(category_id)
                
                # Test DELETE /categories/{id}
                success, data, status = self.make_request('DELETE', f'/categories/{category_id}')
                self.log_test("DELETE /categories/{id}", success and status == 200, 
                             f"Status: {status}" if not success else "")
                
                if success:
                    self.created_resources['categories'].remove(category_id)

    def test_transactions_api(self):
        """Test Transactions API endpoints"""
        print("\n🔍 Testing Transactions API...")
        
        # First get categories to use valid category_id
        success, categories, status = self.make_request('GET', '/categories')
        if not success or not categories:
            self.log_test("GET /categories (for transactions)", False, "Need categories for transaction tests")
            return
            
        expense_category = next((c for c in categories if c['type'] == 'expense'), None)
        income_category = next((c for c in categories if c['type'] == 'income'), None)
        
        if not expense_category or not income_category:
            self.log_test("Find valid categories", False, "Need both expense and income categories")
            return
        
        # Test GET /transactions
        success, data, status = self.make_request('GET', '/transactions')
        self.log_test("GET /transactions", success and status == 200, 
                     f"Status: {status}" if not success else "")
        
        # Test POST /transactions - Create expense
        new_transaction = {
            "amount": 100.50,
            "type": "expense",
            "category_id": expense_category['id'],
            "description": "Test expense",
            "date": date.today().isoformat()
        }
        success, data, status = self.make_request('POST', '/transactions', new_transaction)
        self.log_test("POST /transactions (expense)", success and status == 200, 
                     f"Status: {status}" if not success else "")
        
        transaction_id = None
        if success and 'id' in data:
            transaction_id = data['id']
            self.created_resources['transactions'].append(transaction_id)
            
            # Test PUT /transactions/{id}
            update_data = {"amount": 150.75, "description": "Updated test expense"}
            success, data, status = self.make_request('PUT', f'/transactions/{transaction_id}', update_data)
            self.log_test("PUT /transactions/{id}", success and status == 200, 
                         f"Status: {status}" if not success else "")
        
        # Test POST /transactions - Create income
        income_transaction = {
            "amount": 2000.00,
            "type": "income",
            "category_id": income_category['id'],
            "description": "Test income",
            "date": date.today().isoformat()
        }
        success, data, status = self.make_request('POST', '/transactions', income_transaction)
        self.log_test("POST /transactions (income)", success and status == 200, 
                     f"Status: {status}" if not success else "")
        
        if success and 'id' in data:
            income_id = data['id']
            self.created_resources['transactions'].append(income_id)
        
        # Test GET /transactions with filters
        current_month = date.today().strftime("%Y-%m")
        success, data, status = self.make_request('GET', '/transactions', params={'month': current_month})
        self.log_test("GET /transactions?month=current", success and status == 200, 
                     f"Status: {status}" if not success else "")
        
        success, data, status = self.make_request('GET', '/transactions', params={'type': 'expense'})
        self.log_test("GET /transactions?type=expense", success and status == 200, 
                     f"Status: {status}" if not success else "")

    def test_budgets_api(self):
        """Test Budgets API endpoints"""
        print("\n🔍 Testing Budgets API...")
        
        # Get expense categories
        success, categories, status = self.make_request('GET', '/categories')
        if not success:
            self.log_test("GET /categories (for budgets)", False, "Need categories for budget tests")
            return
            
        expense_category = next((c for c in categories if c['type'] == 'expense'), None)
        if not expense_category:
            self.log_test("Find expense category", False, "Need expense category for budget tests")
            return
        
        # Test GET /budgets
        success, data, status = self.make_request('GET', '/budgets')
        self.log_test("GET /budgets", success and status == 200, 
                     f"Status: {status}" if not success else "")
        
        # Test POST /budgets
        current_month = date.today().strftime("%Y-%m")
        new_budget = {
            "category_id": expense_category['id'],
            "limit": 500.00,
            "month": current_month
        }
        success, data, status = self.make_request('POST', '/budgets', new_budget)
        self.log_test("POST /budgets", success and status == 200, 
                     f"Status: {status}" if not success else "")
        
        budget_id = None
        if success and 'id' in data:
            budget_id = data['id']
            self.created_resources['budgets'].append(budget_id)
            
            # Test PUT /budgets/{id}
            update_data = {"limit": 750.00}
            success, data, status = self.make_request('PUT', f'/budgets/{budget_id}', update_data)
            self.log_test("PUT /budgets/{id}", success and status == 200, 
                         f"Status: {status}" if not success else "")
        
        # Test GET /budgets with month filter
        success, data, status = self.make_request('GET', '/budgets', params={'month': current_month})
        self.log_test("GET /budgets?month=current", success and status == 200, 
                     f"Status: {status}" if not success else "")

    def test_savings_goals_api(self):
        """Test Savings Goals API endpoints"""
        print("\n🔍 Testing Savings Goals API...")
        
        # Test GET /savings-goals
        success, data, status = self.make_request('GET', '/savings-goals')
        self.log_test("GET /savings-goals", success and status == 200, 
                     f"Status: {status}" if not success else "")
        
        # Test POST /savings-goals
        new_goal = {
            "name": "Test Vacation",
            "target_amount": 5000.00,
            "current_amount": 1000.00,
            "deadline": "2025-12-31",
            "color": "#10b981"
        }
        success, data, status = self.make_request('POST', '/savings-goals', new_goal)
        self.log_test("POST /savings-goals", success and status == 200, 
                     f"Status: {status}" if not success else "")
        
        goal_id = None
        if success and 'id' in data:
            goal_id = data['id']
            self.created_resources['savings_goals'].append(goal_id)
            
            # Test PUT /savings-goals/{id}
            update_data = {"current_amount": 1500.00}
            success, data, status = self.make_request('PUT', f'/savings-goals/{goal_id}', update_data)
            self.log_test("PUT /savings-goals/{id}", success and status == 200, 
                         f"Status: {status}" if not success else "")

    def test_dashboard_api(self):
        """Test Dashboard API endpoints"""
        print("\n🔍 Testing Dashboard API...")
        
        current_month = date.today().strftime("%Y-%m")
        
        # Test GET /dashboard/summary
        success, data, status = self.make_request('GET', '/dashboard/summary', params={'month': current_month})
        self.log_test("GET /dashboard/summary", success and status == 200, 
                     f"Status: {status}" if not success else "")
        
        if success:
            required_fields = ['month', 'total_income', 'total_expenses', 'balance', 'savings_rate']
            missing_fields = [field for field in required_fields if field not in data]
            self.log_test("Dashboard summary fields", len(missing_fields) == 0, 
                         f"Missing fields: {missing_fields}" if missing_fields else "")

    def test_analytics_api(self):
        """Test Analytics API endpoints"""
        print("\n🔍 Testing Analytics API...")
        
        # Test GET /analytics/trends
        success, data, status = self.make_request('GET', '/analytics/trends')
        self.log_test("GET /analytics/trends (default)", success and status == 200, 
                     f"Status: {status}" if not success else "")
        
        # Test with months parameter
        success, data, status = self.make_request('GET', '/analytics/trends', params={'months': 3})
        self.log_test("GET /analytics/trends?months=3", success and status == 200, 
                     f"Status: {status}" if not success else "")
        
        if success and isinstance(data, list):
            if len(data) > 0:
                trend_item = data[0]
                required_fields = ['month', 'income', 'expenses', 'savings']
                missing_fields = [field for field in required_fields if field not in trend_item]
                self.log_test("Analytics trends fields", len(missing_fields) == 0, 
                             f"Missing fields: {missing_fields}" if missing_fields else "")

    def cleanup_resources(self):
        """Clean up created test resources"""
        print("\n🧹 Cleaning up test resources...")
        
        # Delete transactions
        for txn_id in self.created_resources['transactions']:
            success, _, status = self.make_request('DELETE', f'/transactions/{txn_id}')
            if success:
                print(f"   Deleted transaction {txn_id}")
        
        # Delete budgets
        for budget_id in self.created_resources['budgets']:
            success, _, status = self.make_request('DELETE', f'/budgets/{budget_id}')
            if success:
                print(f"   Deleted budget {budget_id}")
        
        # Delete savings goals
        for goal_id in self.created_resources['savings_goals']:
            success, _, status = self.make_request('DELETE', f'/savings-goals/{goal_id}')
            if success:
                print(f"   Deleted savings goal {goal_id}")
        
        # Delete categories (custom ones only)
        for cat_id in self.created_resources['categories']:
            success, _, status = self.make_request('DELETE', f'/categories/{cat_id}')
            if success:
                print(f"   Deleted category {cat_id}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Budget App API Tests...")
        print(f"Testing against: {self.base_url}")
        
        try:
            # Test basic connectivity
            success, data, status = self.make_request('GET', '/')
            self.log_test("API Root endpoint", success and status == 200, 
                         f"Status: {status}" if not success else "")
            
            # Run all test suites
            self.test_categories_api()
            self.test_transactions_api()
            self.test_budgets_api()
            self.test_savings_goals_api()
            self.test_dashboard_api()
            self.test_analytics_api()
            
        finally:
            # Always cleanup
            self.cleanup_resources()
        
        # Print summary
        print(f"\n📊 Test Results:")
        print(f"   Tests run: {self.tests_run}")
        print(f"   Tests passed: {self.tests_passed}")
        print(f"   Tests failed: {len(self.failed_tests)}")
        print(f"   Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   - {failure}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = BudgetAppAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())