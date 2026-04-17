from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    
    page.on("console", lambda msg: print(f"CONSOLE {msg.type}: {msg.text}"))
    page.on("pageerror", lambda err: print(f"PAGE ERROR: {err}"))
    
    page.goto("http://localhost:3000")
    
    # Click Log in
    try:
        page.click("#btn-login", timeout=2000)
    except:
        page.evaluate("document.querySelector('#btn-login').click()")
        
    page.wait_for_selector("#login-phone")
    page.fill("#login-phone", "9876543210")
    
    # Click Send OTP to Phone
    page.click("#btn-request-otp")
    page.wait_for_timeout(1000)
    
    print("Clicking demo tab...")
    page.click("#tab-demo")
    page.wait_for_timeout(500)
    
    print("Clicking Demo Worker button...")
    # The actual demo button just calls loadDemo() or something
    page.evaluate("window.loadDemo()")
    page.wait_for_timeout(1000)
    
    print("Clicking Claims & Payouts...")
    page.evaluate("window.goPage('claims')")
    page.wait_for_timeout(1000)
    
    print("Clicking Apply for Manual Payout...")
    # Find button
    page.evaluate("document.querySelector('button[onclick=\"openClaimModal()\"]').click()")
    page.wait_for_timeout(1000)
    
    # Check if modal is open
    is_open = page.evaluate("document.getElementById('claim-modal').classList.contains('open')")
    print(f"Modal opened: {is_open}")
    
    browser.close()
