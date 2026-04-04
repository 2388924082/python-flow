import json
import sys

def main(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)

    config = input_data.get("config", {})
    inputs = input_data.get("inputs", {})
    format_type = config.get("format", "pretty")

    data_str = inputs.get("data", "{}")

    try:
        parsed = json.loads(data_str) if isinstance(data_str, str) else data_str
    except:
        parsed = {"error": "Invalid JSON"}

    if format_type == "pretty":
        result = json.dumps(parsed, ensure_ascii=False, indent=2)
    elif format_type == "compact":
        result = json.dumps(parsed, ensure_ascii=False, separators=(',', ':'))
    else:
        result = parsed

    output_data = {
        "config": config,
        "inputs": inputs,
        "outputs": {
            "result": result
        }
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"JSON parsed with format: {format_type}")

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    main(input_path, output_path)
