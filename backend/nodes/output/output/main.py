import json
import sys


def main(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)

    inputs = input_data.get("inputs", {})
    data = inputs.get("data", {})

    print("=" * 50)
    print("Output Node - Received Data:")
    print(json.dumps(data, ensure_ascii=False, indent=2))
    print("=" * 50)

    output_data = {
        "config": input_data.get("config", {}),
        "inputs": inputs,
        "outputs": {}
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print("Output completed")


if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    main(input_path, output_path)
