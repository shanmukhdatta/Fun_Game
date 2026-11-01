import subprocess
import time
import json
import urllib.request
import websocket

def test_scoring():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        "--remote-debugging-port=9223",
        "--remote-allow-origins=*",
        "--window-size=540,800",
        "about:blank"
    ])

    time.sleep(1.5)

    try:
        targets = json.loads(urllib.request.urlopen("http://localhost:9223/json").read().decode())
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

        cdp_send("Runtime.enable")
        cdp_send("Page.enable")
        cdp_send("Page.navigate", {"url": "http://localhost:8080/index.html"})
        time.sleep(1.5)

        # Start game
        evaluate("window.__gameDebug.startGame()")
        print("Game started! Obstacles active instantly.")

        # Keep hero hovering at the opening height for 5 seconds to clear obstacle
        for step in range(50):
            time.sleep(0.1)
            # Find the first obstacle opening
            obs = evaluate("window.__gameDebug.getObstacles()")
            if obs and len(obs) > 0:
                first_obs = obs[0]
                target_y = (first_obs['topEnd'] + first_obs['bottomStart']) / 2
                # Flap if below target
                curr_y = evaluate("window.__gameDebug.getHeroY()")
                if curr_y > target_y + 10:
                    evaluate("window.__gameDebug.flap()")

        score = evaluate("window.__gameDebug.getScore()")
        hud_score = evaluate("document.getElementById('hudScore').textContent")
        print(f"Verified Score: {score}, HUD Score: {hud_score}")
        assert int(hud_score) >= 1 or score >= 1, "Score should have incremented"
        print("SCORING VERIFIED SUCCESSFULLY!")
    finally:
        proc.terminate()

if __name__ == "__main__":
    test_scoring()
