import json
import sys
import csv
from io import StringIO

def main(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)

    config = input_data.get("config", {})
    inputs = input_data.get("inputs", {})

    delimiter = config.get("delimiter", ",")
    has_header = config.get("has_header", True)

    csv_str = inputs.get("csv_data", "")

    reader = csv.reader(StringIO(csv_str), delimiter=delimiter)
    rows = list(reader)

    if has_header and rows:
        headers = rows[0]
        result = []
        for row in rows[1:]:
            item = {headers[i]: row[i] if i < len(row) else "" for i in range(len(headers))}
            result.append(item)
    else:
        result = rows

    output_data = {
        "config": config,
        "inputs": inputs,
        "outputs": {
            "json_data": result
        }
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"CSV converted: {len(result)} rows")

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    main(input_path, output_path)
