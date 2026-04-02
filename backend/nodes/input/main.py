import json
import sys


def main(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)

    config = input_data.get("config", {})

    data_str = config.get("data", "[]")
    try:
        data = json.loads(data_str)
    except json.JSONDecodeError:
        data = []

    output_data = {
        "config": config,
        "inputs": {},
        "outputs": {
            "data": data
        }
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    count = len(data) if isinstance(data, list) else 1
    print(f"Input node output: {count} items")


if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    main(input_path, output_path)
