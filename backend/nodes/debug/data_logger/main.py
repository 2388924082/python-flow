import json
import sys

def main(input_path: str, output_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        input_data = json.load(f)

    config = input_data.get("config", {})
    inputs = input_data.get("inputs", {})

    level = config.get("level", "info")
    message = config.get("message", "")
    data = inputs.get("data", {})

    log_message = f"[{level.upper()}] {message}" if message else f"[{level.upper()}] Data received"
    print(log_message)
    print(f"Data: {json.dumps(data, ensure_ascii=False)}")

    output_data = {
        "config": config,
        "inputs": inputs,
        "outputs": {
            "passthrough": data
        }
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"Data logged at {level} level")

if __name__ == "__main__":
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    main(input_path, output_path)
