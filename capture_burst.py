import subprocess
import time
import json
import urllib.request
import base64
import websocket

def capture_burst_screenshot():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        "--remote-debugging-port=9224",
        "--remote-allow-origins=*",
        "--window-size=540,800",
        "about:blank"
    ])

    time.sleep(1.5)

    try:
        targets = json.loads(urllib.request.urlopen("http://localhost:9224/json").read().decode())
        page_target = next(t for t in targets if t.get("type") == "page")
        ws = websocket.create_connection(page_target["webSocketDebuggerUrl"])
        msg_id = 0

        def cdp_send(method, params=None):
            nonlocal msg_id
            msg_id += 1
            payload = {"id": msg_id, "method": method, "params": params or {}}
            ws.send(json.dumps(payload))
            while True:
                res = json.loads(ws.recv())
                if res.get("id") == msg_id:
                    return res.get("result", {})

        def evaluate(expr):
            res = cdp_send("Runtime.evaluate", {"expression": expr, "returnByValue": True})
            return res.get("result", {}).get("value")

        def take_screenshot(filename):
            res = cdp_send("Page.captureScreenshot", {"format": "png"})
            data = base64.b64decode(res["data"])
            with open(filename, "wb") as f:
                f.write(data)
            print(f"Screenshot saved: {filename}")

        cdp_send("Runtime.enable")
        cdp_send("Page.enable")
        cdp_send("Page.navigate", {"url": "http://localhost:8080/index.html"})
        time.sleep(1.5)

        # Start game
        evaluate("document.getElementById('btnStartGame').click()")
        time.sleep(0.5)

        # Flap twice to be in the air
        evaluate("window.__gameDebug.flap()")
        time.sleep(0.2)
        evaluate("window.__gameDebug.flap()")
        time.sleep(0.3)

        # Let it drop or trigger collision to capture mid-burst!
        # Fall to floor
        time.sleep(0.85)

        # Capture exactly during the head burst explosion animation!
        take_screenshot("screenshot_head_burst.png")
        print("Burst captured!")
    finally:
        proc.terminate()

if __name__ == "__main__":
    capture_burst_screenshot()
