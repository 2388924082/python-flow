import json
import sys


def main(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)

    config = input_data.get("config", {})
    inputs = input_data.get("inputs", {})

    threshold = config.get("threshold", 0.5)
    field = config.get("field", "score")

    data = inputs.get("data", [])

    if isinstance(data, list):
        result = [item for item in data if item.get(field, 0) >= threshold]
    elif isinstance(data, dict):
        result = data if data.get(field, 0) >= threshold else {}
    else:
        result = data

    output_data = {
        "config": config,
        "inputs": inputs,
        "outputs": {
            "result": result
        }
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"Filter completed: {len(result) if isinstance(result, list) else 1} items passed")


if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    main(input_path, output_path)
