import subprocess

# Execute a Python script and wait for it to finish
result = subprocess.run(['python', 'scrape.py'], text=True)

# Check if the script executed successfully
if result.returncode == 0:
    print("Scraped successfully")
    # Now run the second script
    result2 = subprocess.run(['python', 'parse.py'], text=True)
    if result2.returncode == 0:
        print("Parsed successfully")
    else:
        print(f"Parsed failed with error: {result2.stderr}")
else:
    print(f"Scraped failed with error: {result.stderr}")