import json
import sys

def main(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)

    config = input_data.get("config", {})
    inputs = input_data.get("inputs", {})

    strategy = config.get("strategy", "merge")
    data1 = inputs.get("data1", {})
    data2 = inputs.get("data2", {})

    if strategy == "merge":
        result = {**data1, **data2}
    elif strategy == "concat":
        result = [data1, data2]
    elif strategy == "zip":
        result = {"data1": data1, "data2": data2}
    else:
        result = data1

    output_data = {
        "config": config,
        "inputs": inputs,
        "outputs": {
            "result": result
        }
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"Aggregation completed with strategy: {strategy}")

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    main(input_path, output_path)
