import csv
import json
from tqdm import tqdm

if __name__ == "__main__":
    # Load CSV file
    all_entries = []
    with open('property-parcel-polygons.csv', newline='') as csvFile:
        with open('scraped_data.json', 'r', encoding='utf-8') as jsonData:
            arrayDev = json.load(jsonData)
            # Iterate through the scrape file
            for develop in tqdm(arrayDev):
                csvFile.seek(0)
                reader = csv.reader(csvFile, delimiter=';')
                stringy = ""
                try: 
                    # --- Parsing address string to match one in CSV
                    if "(" in develop['address']:
                        stringy = develop['address'].split("(")[0].strip().lower()
                    elif "rezoning" in develop['address']:
                        stringy = develop['address'].split("rezoning")[0].strip().lower()
                    else:
                        continue
                    if " and " in stringy:
                        stringy = stringy.split("and")[1].strip()
                    stringy2 = ""
                    
                    if "-" in stringy:
                        if "formerly" in stringy:
                            stringy = stringy.split(" - formerly ")[1]
                        elif "former " in stringy:
                            stringy = stringy.split(" - former ")[0]
                        else: 
                            parts = stringy.split(' ', 1)
                            numbers = parts[0].split('-')
                            street = parts[1] if len(parts) > 1 else ''
                            result = numbers + [street]
                            stringy = result[0] + " " + result[2]
                            stringy2 = result[1] + " " + result[2]

                    if "ave" in stringy:
                        stringy = stringy[:len(stringy)-1]
                    if "ave" in stringy2:
                        stringy2 = stringy2[:len(stringy2)-1]

                    # Loop through CSV
                    # print(stringy)
                    for i, row in enumerate(reader):
                        if i == 0:
                            continue
                        address = row[0] +" "+ row[1] .strip()
                        address = address.lower()
                        # print(stringy)
                            
                        if address == stringy or address == stringy2:
                            print(f"\nCSV address matches with development address: {address} | {stringy} | {stringy2}")
                            entry = {
                                "address": "",
                                "categories": [],
                                "href": "",
                                "updated": "",
                                "description": "",
                                "public_comments_data": "",
                                "points": [],
                                "middle_point": [],
                                "img": "",
                                "rezoning": False,
                                "development": False
                            }
                            middlePoints = row[-1].split(",")
                            points = json.loads(row[4])['coordinates'][0]
                            entry['address'] = develop['address']
                            entry['description'] = develop['description']
                            entry['href'] = develop['href']
                            entry['middle_point'] = middlePoints
                            entry['points'] = points
                            entry['public_comments_data'] = develop['public_comments_data']
                            entry['updated'] = develop['updated']
                            entry['development'] = develop['development']
                            entry['rezoning'] = develop['rezoning']
                            entry['img'] = develop['img']
                            
                            all_entries.append(entry)
                except:
                    continue

    with open('processed_data.json', 'w', encoding='utf-8') as f:
        json.dump(all_entries, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(all_entries)} entries to processed_data.json")