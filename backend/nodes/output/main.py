import json
import sys


def main(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)

    inputs = input_data.get("inputs", {})
    data = inputs.get("data", [])

    output_data = {
        "config": {},
        "inputs": inputs,
        "outputs": {}
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"Output node received: {len(data) if isinstance(data, list) else 1} items")
    print(f"Data: {json.dumps(data, ensure_ascii=False)[:200]}")


if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    main(input_path, output_path)
