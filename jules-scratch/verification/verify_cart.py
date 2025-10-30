from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000/shop")
    page.click('button:has-text("Add to Cart")')
    page.click('button:has-text("Shopping Cart")')
    page.screenshot(path="jules-scratch/verification/cart_dropdown.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
