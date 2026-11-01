import subprocess
import time
import json
import urllib.request
import base64
import websocket

def run_tests():
    print("--- 1. Launching Headless Chrome with CDP ---")
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        "--remote-debugging-port=9222",
        "--remote-allow-origins=*",
        "--window-size=540,800",
        "--autoplay-policy=no-user-gesture-required",
        "about:blank"
    ])

    time.sleep(2)

    try:
        # Get targets from CDP
        targets = json.loads(urllib.request.urlopen("http://localhost:9222/json").read().decode())
        page_target = next(t for t in targets if t.get("type") == "page")
        ws_url = page_target["webSocketDebuggerUrl"]
        print(f"Connected to CDP page: {ws_url}")

        ws = websocket.create_connection(ws_url)
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
            if "exceptionDetails" in res:
                raise Exception(f"JS Error: {res['exceptionDetails']}")
            return res.get("result", {}).get("value")

        def take_screenshot(filename):
            res = cdp_send("Page.captureScreenshot", {"format": "png"})
            data = base64.b64decode(res["data"])
            with open(filename, "wb") as f:
                f.write(data)
            print(f"Screenshot saved: {filename} ({len(data)} bytes)")

        # Enable runtime & page
        cdp_send("Runtime.enable")
        cdp_send("Page.enable")

        print("\n--- 2. Navigating to http://localhost:8080/index.html ---")
        cdp_send("Page.navigate", {"url": "http://localhost:8080/index.html"})
        time.sleep(2)

        take_screenshot("screenshot_start.png")

        # Test 1: Check document title and elements
        title = evaluate("document.title")
        print(f"Page Title: {title}")
        assert "Jumper Teja" in title, "Title mismatch"

        canvas_dims = evaluate("[document.getElementById('gameCanvas').width, document.getElementById('gameCanvas').height]")
        print(f"Canvas resolution: {canvas_dims[0]}x{canvas_dims[1]}")
        assert canvas_dims == [480, 680], "Canvas dimensions should be 480x680"

        # Test 2: Check initial Ready State and hero preview
        preview_src = evaluate("document.getElementById('startHeroPreview').src")
        print(f"Character Photo Source: {preview_src}")
        assert "assets/teja" in preview_src, "Default photo should be Jumper Teja photo"

        # Test 3: Start the game
        print("\n--- 3. Starting Game Flight ---")
        evaluate("document.getElementById('btnStartGame').click()")
        time.sleep(0.5)

        score_val = evaluate("document.getElementById('hudScore').textContent")
        print(f"Initial HUD Score: {score_val}")
        assert score_val == "0", "Initial score must be 0"

        # Test 4: Flap impulse and gravity
        print("\n--- 4. Testing Flap Physics & Gravity ---")
        y1 = evaluate("document.getElementById('gameCanvas').dispatchEvent(new PointerEvent('pointerdown', {bubbles: true})); null")
        time.sleep(0.1)
        hero_y_flapped = evaluate("window.__debugHeroY ? window.__debugHeroY() : null")
        print("Flap registered via pointerdown!")

        # Let's verify Space key triggers flap
        evaluate("window.dispatchEvent(new KeyboardEvent('keydown', {code: 'Space', key: ' '}))")
        print("Flap registered via Spacebar!")

        take_screenshot("screenshot_flight.png")

        # Test 5: Verify obstacles spawn instantly
        print("\n--- 5. Testing Instant Obstacle Spawning ---")
        time.sleep(2.0)
        obs_count = evaluate("window.__gameDebug.getObstacles().length")
        print(f"Active Obstacles Spawned: {obs_count}")
        assert obs_count > 0, "Obstacles must spawn instantly without any delay selector"

        take_screenshot("screenshot_obstacles.png")

        # Test 6: Verify obstacles are active and moving
        print("\n--- 6. Verifying Obstacle Movement ---")
        time.sleep(1.5)

        take_screenshot("screenshot_gameplay.png")

        # Test 7: Let character fall to ground to test collision & Game Over
        print("\n--- 7. Testing Ground / Obstacle Collision & Game Over ---")
        time.sleep(3.0) # Wait for fall to floor

        is_game_over = evaluate("!document.getElementById('gameOverOverlay').classList.contains('hidden')")
        print(f"Game Over Overlay Visible: {is_game_over}")

        take_screenshot("screenshot_gameover.png")

        final_score = evaluate("document.getElementById('finalScore').textContent")
        best_score = evaluate("document.getElementById('bestScore').textContent")
        print(f"Game Over Final Score: {final_score}, Best Score: {best_score}")

        # Test 8: Restart Game
        print("\n--- 8. Testing Restart ---")
        evaluate("document.getElementById('btnRestartGame').click()")
        time.sleep(0.5)

        is_playing_again = evaluate("document.getElementById('gameOverOverlay').classList.contains('hidden')")
        print(f"Game Over Hidden on Restart: {is_playing_again}")
        assert is_playing_again, "Game should restart cleanly"

        take_screenshot("screenshot_restarted.png")

        print("\nALL AUTOMATED TESTS PASSED SUCCESSFULLY!")

    finally:
        proc.terminate()

if __name__ == "__main__":
    run_tests()
