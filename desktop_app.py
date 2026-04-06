import multiprocessing
import webview
import sys
import os
import time
import socket

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, "frontend-vue", "dist")

DEFAULT_PORT = int(os.environ.get('API_PORT', '8766'))


def find_available_port(start_port=DEFAULT_PORT, max_attempts=10):
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"Could not find available port after {max_attempts} attempts")


def run_server(port):
    from backend.main import app
    if os.path.exists(DIST_DIR):
        from fastapi.staticfiles import StaticFiles
        app.mount("/", StaticFiles(directory=DIST_DIR, html=True), name="static")
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


if __name__ == "__main__":
    # port = find_available_port()
    port = 8000
    if port != DEFAULT_PORT:
        print(f"Port {DEFAULT_PORT} in use, using port {port}")

    ctx = multiprocessing.get_context("spawn")
    server_process = ctx.Process(target=run_server, args=(port,), daemon=True)
    server_process.start()
    # time.sleep(2)

    webview.create_window(
        title="Python Workflow",
        url=f"http://127.0.0.1:{port}",
        width=1000,
        height=800,
        resizable=True,
        min_size=(800, 600),
        background_color='#1e1e1e'
    )

    webview.start()
    server_process.terminate()