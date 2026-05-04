from playwright.sync_api import sync_playwright
import time

def test_donor_dashboard():
    """Test donor login and verify dashboard shows donations"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # Headless=False to see what's happening
        context = browser.new_context()
        page = context.new_page()
        
        # Enable console logging
        page.on("console", lambda msg: print(f"[Browser Console] {msg.type}: {msg.text}"))
        
        try:
            print("Step 1: Navigate to login page...")
            page.goto('http://localhost:5173/login')
            page.wait_for_load_state('networkidle')
            
            # Take screenshot of login page
            page.screenshot(path='login_page.png')
            print("Screenshot saved: login_page.png")
            
            print("Step 2: Fill in login credentials...")
            # Find and fill email field
            email_field = page.locator('input[type="email"]').first
            if email_field.count() == 0:
                email_field = page.locator('input[placeholder*="email" i]').first
            email_field.fill('demo-donor@gmail.com')
            
            # Find and fill password field
            password_field = page.locator('input[type="password"]').first
            password_field.fill('Demo123!')
            
            print("Step 3: Click login button...")
            login_button = page.locator('button:has-text("Login")').first
            if login_button.count() == 0:
                login_button = page.locator('button[type="submit"]').first
            login_button.click()
            
            # Wait for navigation to dashboard
            print("Step 4: Waiting for dashboard to load...")
            page.wait_for_url('**/dashboard', timeout=10000)
            page.wait_for_load_state('networkidle')
            
            # Take screenshot of dashboard
            page.screenshot(path='dashboard_page.png')
            print("Screenshot saved: dashboard_page.png")
            
            # Wait a moment for API calls to complete
            time.sleep(2)
            
            # Check if donations are displayed
            print("Step 5: Checking for donation data on page...")
            page_content = page.content()
            
            # Look for donation indicators
            if 'Rp' in page_content or '500000' in page_content or 'donation' in page_content.lower():
                print("SUCCESS: Found donation-related content on page!")
                # Look for specific donation amounts
                if '500.000' in page_content or '500000' in page_content:
                    print("Found Rp 500,000 donation amount!")
                if '1.500.000' in page_content or '1500000' in page_content:
                    print("Found total Rp 1,500,000!")
            else:
                print("WARNING: No donation content found on dashboard")
                print("Checking for error messages...")
                if 'error' in page_content.lower() or 'gagal' in page_content.lower():
                    print("Found error message on page")
            
            # Try to get network logs
            print("\nChecking browser local storage for auth token...")
            token = page.evaluate("() => localStorage.getItem('supabase.auth.token')")
            if token:
                print(f"Token found: {token[:50]}...")
            else:
                print("No supabase.auth.token in localStorage")
                
            # List all localStorage keys
            all_keys = page.evaluate("() => Object.keys(localStorage)")
            print(f"LocalStorage keys: {all_keys}")
            
        except Exception as e:
            print(f"ERROR: {e}")
            page.screenshot(path='error_page.png')
            print("Error screenshot saved: error_page.png")
        
        finally:
            browser.close()
            print("\nTest complete!")

if __name__ == "__main__":
    test_donor_dashboard()
