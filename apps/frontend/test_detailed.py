from playwright.sync_api import sync_playwright
import time
import json

def test_donor_dashboard():
    """Test donor login and verify dashboard shows donations"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        
        # Track all console messages
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        
        # Track all network requests
        network_requests = []
        page.on("requestfinished", lambda req: network_requests.append({
            "url": req.url,
            "status": req.response().status if req.response() else None,
            "method": req.method
        }))
        
        try:
            print("=" * 70)
            print("STEP 1: Navigate to login page")
            print("=" * 70)
            page.goto('http://localhost:5173/login')
            page.wait_for_load_state('networkidle')
            page.screenshot(path='01_login_page.png')
            print("Screenshot: 01_login_page.png")
            
            print("\n" + "=" * 70)
            print("STEP 2: Fill in credentials")
            print("=" * 70)
            page.fill('input[type="email"]', 'demo-donor@gmail.com')
            page.fill('input[type="password"]', 'Demo123!')
            print("Filled: demo-donor@gmail.com / Demo123!")
            
            print("\n" + "=" * 70)
            print("STEP 3: Click login and wait")
            print("=" * 70)
            page.click('button[type="submit"]')
            
            # Wait for navigation or error
            try:
                page.wait_for_url(lambda url: '/dashboard' in url, timeout=15000)
                print(f"Navigated to: {page.url}")
            except:
                print(f"URL after click: {page.url}")
                print("Warning: Did not navigate to dashboard")
            
            page.wait_for_load_state('networkidle')
            time.sleep(3)  # Give time for everything to load
            page.screenshot(path='02_after_login.png', full_page=True)
            print("Screenshot: 02_after_login.png")
            
            print("\n" + "=" * 70)
            print("STEP 4: Check localStorage for auth token")
            print("=" * 70)
            
            # Try to get Supabase token
            token_keys = page.evaluate("""
                () => {
                    const keys = Object.keys(localStorage);
                    const authKeys = keys.filter(k => k.includes('auth') || k.includes('supabase') || k.includes('token'));
                    return authKeys.map(k => ({ key: k, length: localStorage.getItem(k)?.length || 0 }));
                }
            """)
            print(f"Auth-related keys found: {token_keys}")
            
            # Get the full token
            for key_info in token_keys:
                if 'auth-token' in key_info['key']:
                    token_data = page.evaluate(f'() => localStorage.getItem("{key_info["key"]}")')
                    if token_data:
                        try:
                            parsed = json.loads(token_data)
                            if 'access_token' in parsed:
                                print(f"\nToken found in {key_info['key']}")
                                print(f"Access token (first 50 chars): {parsed['access_token'][:50]}...")
                                print(f"User ID from token: {parsed.get('user', {}).get('id', 'N/A')}")
                                print(f"User email from token: {parsed.get('user', {}).get('email', 'N/A')}")
                        except:
                            print(f"Could not parse token from {key_info['key']}")
            
            print("\n" + "=" * 70)
            print("STEP 5: Analyze page content")
            print("=" * 70)
            page_html = page.content()
            
            # Check for donation data
            indicators = ['Rp', '500.000', '1.500.000', 'donasi', 'donation', '500000', '1500000']
            found_indicators = [i for i in indicators if i in page_html]
            print(f"Found donation indicators: {found_indicators}")
            
            # Check for errors
            if 'error' in page_html.lower() or 'gagal' in page_html.lower():
                print("WARNING: Error indicators found in page")
                # Try to extract error message
                error_elements = page.locator('text=/error|gagal/i').all()
                for elem in error_elements[:3]:
                    print(f"  Error text: {elem.text_content()[:100]}")
            
            print("\n" + "=" * 70)
            print("STEP 6: Check Network Requests")
            print("=" * 70)
            donation_requests = [r for r in network_requests if '/donations' in r['url']]
            print(f"Donation API requests made: {len(donation_requests)}")
            for req in donation_requests:
                print(f"  {req['method']} {req['url']} -> Status: {req['status']}")
            
            print("\n" + "=" * 70)
            print("STEP 7: Check Console Logs")
            print("=" * 70)
            for log in console_logs[-10:]:  # Last 10 logs
                print(f"  {log}")
            
        except Exception as e:
            print(f"\nERROR: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='error_screenshot.png')
        
        finally:
            print("\n" + "=" * 70)
            print("Test Complete")
            print("=" * 70)
            browser.close()

if __name__ == "__main__":
    test_donor_dashboard()
