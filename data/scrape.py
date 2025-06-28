from selenium import webdriver
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException, TimeoutException
import time
import json

PAGE = 22

options = Options()
options.add_argument('--disable-logging')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--log-level=3')
options.add_argument("--headless")
driver = webdriver.Edge(options)
driver.implicitly_wait(3)
# Load into development page
driver.get("https://www.shapeyourcity.ca/hub-page/rezoning-and-development")
print(driver.title)

# Click on all tag and select approved 
main_hub=driver.find_element(By.ID, "hubpage-main")
# Pagination
all_entries = []    
print("--- Storing development and rezoning ---")
for i in range(PAGE):
    # A list of development and rezoning as WebElement
    wait = WebDriverWait(main_hub, 10)
    wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".css-wazyag")))
    name_entries = main_hub.find_elements(By.CSS_SELECTOR, ".css-wazyag")
    # Loop through each div element you found
    for card_element in name_entries:
        # Get the text from the entire card
        entry = {
            "address": "",
            "href": "",
            "updated": "",
            "description": "",
            "public_comments_data": "",
            "img": "",
            "rezoning": False,
            "development": False,
        }
        card_text = card_element.text

        link_tag = card_element.find_element(By.TAG_NAME, 'a')

        href_link = link_tag.get_attribute('href')

        cleaned_text = card_text.split("\n")
        entry['address'] = cleaned_text[1]
        if "development" in cleaned_text[1]:
            entry['development'] = True
        if "rezoning" in cleaned_text[1]:
            entry['rezoning'] = True
        entry['updated'] = cleaned_text[0]
        entry['href'] = href_link
        all_entries.append(entry)

    pagination = main_hub.find_element(By.CLASS_NAME,"pagination")
    button_click = pagination.find_elements(By.TAG_NAME,"li")[-1]
    button_click.click()

print("--- Loading pages for description, hearing date, and image ---")
for entry in all_entries:
    if entry['href']:

        # Store current window handle
        original_window = driver.current_window_handle
        
        # Open link in new tab
        driver.execute_script(f"window.open('{entry['href']}', '_blank');")
        
        # Switch to the new tab
        driver.switch_to.window(driver.window_handles[-1])
        
        # Wait for page to load
        wait = WebDriverWait(driver, 10)
        wait.until(EC.presence_of_element_located((By.TAG_NAME, "body")))
        
        # Example: Get page title
        descrip = driver.find_element(By.CLASS_NAME, "truncated-description")
        try:
            image = descrip.find_element(By.TAG_NAME, "img")
            entry['img'] = image.get_attribute("src")
        except NoSuchElementException:
            pass
        entry['description'] = descrip.text

        print(entry['address'])
        try:
            key_data = wait.until(EC.presence_of_element_located(
                (By.XPATH, '//div[contains(@id, "KeyDateWidget")]/ul/li[2]/div[2]')
            ))
            entry['public_comments_data'] = key_data.text
        except (NoSuchElementException,TimeoutException):
            pass
        
            
        # Close the new tab and switch back
        driver.close()
        driver.switch_to.window(original_window)
        
        # Small delay between requests
        time.sleep(1)

with open('scraped_data.json', 'w', encoding='utf-8') as f:
    json.dump(all_entries, f, indent=2, ensure_ascii=False)
print(f"Saved {len(all_entries)} entries to scraped_data.json")
driver.quit()