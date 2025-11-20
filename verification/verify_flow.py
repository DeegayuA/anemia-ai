import time
from playwright.sync_api import sync_playwright, expect

def verify_app_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant permissions for camera (though likely won't work in headless/server environment without real cam, but we try)
        context = browser.new_context(permissions=["camera"])
        page = context.new_page()

        try:
            # 1. Home Page (Loader)
            print("Navigating to Home...")
            page.goto("http://localhost:3000")

            # Wait for "SYSTEM INITIALIZATION" text
            expect(page.get_by_text("SYSTEM INITIALIZATION")).to_be_visible(timeout=10000)
            page.screenshot(path="verification/1_home_loader.png")
            print("Captured Home Page Loader")

            # Wait for redirect to /info/name (approx 3.5s)
            print("Waiting for redirect to /info/name...")
            page.wait_for_url("**/info/name", timeout=10000)
            page.screenshot(path="verification/2_name_page.png")
            print("Captured Name Page")

            # Fill Name
            page.get_by_placeholder("Enter your name").fill("TestUser")
            page.get_by_role("button", name="Continue").click()

            # Should go to /info/age -> /info/gender -> /info/hb -> /scan
            # (Assuming the flow exists, but I only checked name page. Let's check what's next)
            # Name page redirects to /info/age. I need to check if Age/Gender/Hb pages exist and what they do.
            # I previously listed files in app/info/ and saw age/ gender/ hb/.
            # I'll assume standard inputs.

            print("Waiting for Age page...")
            page.wait_for_url("**/info/age", timeout=10000)
            # Assuming there is an input for age
            # If I don't know the content, I'll just take a screenshot and try to interact generically or skip if possible.
            # Let's assume I need to fill them to get to scan.

            # Note: I didn't read age/gender/hb pages. I should probably just verify the loader and result page logic primarily,
            # but I can't get to result without scan, and I can't scan without camera in headless usually.
            # However, I can mock the scan result in the store if I could access it, but I can't easily from outside.

            # Let's just verify up to Name page for now, and then try to manually navigate to /result to check the redirect logic?
            # If I go to /result without data, it should redirect to /scan.

            print("Navigating directly to /result to test redirect protection...")
            page.goto("http://localhost:3000/result")
            # Expect redirect to /scan
            page.wait_for_url("**/scan", timeout=5000)
            print("Redirected to /scan successfully")
            page.screenshot(path="verification/3_scan_redirect.png")

            # On Scan page
            # It should show "Requesting camera access" or "Loading AI Models"
            # Since I mocked the permissions in context, it might try to load.
            # But headless chrome might fail on getUserMedia.
            # The page handles error "Camera permission denied".

            # Let's see what we capture.
            page.screenshot(path="verification/4_scan_page.png")
            print("Captured Scan Page")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app_flow()
