"""Browser smoke test and documentation screenshot capture.

Requires Playwright + Chromium (developer dependency only; the app itself has
no third-party runtime dependencies). Run against a live server:

    python3 server.py &
    python3 tests/browser_smoke.py
"""
import asyncio
import os
import sys
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parent.parent
ARTIFACTS = ROOT / "tests" / "artifacts"
SCREENSHOTS = ROOT / "docs" / "screenshots"


async def main():
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    SCREENSHOTS.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        launch = {
            "headless": True,
            "timeout": 240000,
            "args": [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-proxy-server",
                "--proxy-bypass-list=*",
            ],
        }
        executable = os.environ.get("COCOLOOP_CHROMIUM")
        if executable:
            launch["executable_path"] = executable
        browser = await pw.chromium.launch(**launch)
        page = await browser.new_page(viewport={"width": 1600, "height": 1000}, device_scale_factor=1)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        await page.goto(os.environ.get("COCOLOOP_URL", "http://127.0.0.1:38475"), wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        assert "CL Studio" in await page.title()
        assert await page.locator(".rack-row").count() == 7
        assert await page.locator("#metronome").count() == 1
        assert await page.locator("[data-master-fader]").count() == 1
        await page.screenshot(path=str(SCREENSHOTS / "studio.png"))

        await page.locator('.step[data-step="2"]').first.click()
        await page.wait_for_timeout(250)
        assert "on" in (await page.locator('.step[data-step="2"]').first.get_attribute("class"))
        await page.locator("#metronome").click()
        assert "on" in (await page.locator("#metronome").get_attribute("class"))
        await page.locator("#metronome").click()

        await page.get_by_role("button", name="Add instrument / channel").click()
        await page.locator('[data-instrument="pad"]').click()
        assert await page.locator(".rack-row").count() == 8
        await page.locator("#undo").click()
        assert await page.locator(".rack-row").count() == 7
        await page.locator("#redo").click()
        assert await page.locator(".rack-row").count() == 8
        await page.locator("#undo").click()

        # Show a melodic track with notes in the Piano Roll screenshot.
        await page.wait_for_timeout(3300)  # let the "Soft Pad added" toast clear
        await page.locator(".rack-row").nth(5).locator(".channel-name").click()
        await page.wait_for_timeout(200)
        for view, name in (("piano", "piano-roll"), ("mixer", "mixer"), ("agents", "agents")):
            await page.locator(f'.nav-link[data-view="{view}"]').click()
            await page.wait_for_timeout(350)
            await page.screenshot(path=str(SCREENSHOTS / f"{name}.png"))
        await page.locator('.nav-link[data-view="library"]').click()
        await page.wait_for_timeout(700)
        assert await page.locator(".library-item").count() >= 20
        await page.screenshot(path=str(SCREENSHOTS / "library.png"))
        await page.locator('[data-library-item="mix-balance"]').click()
        await page.wait_for_timeout(450)
        assert "Balance Mix aplicado" in await page.locator("#toast").inner_text()
        await page.locator('.nav-link[data-view="studio"]').click()

        await page.locator("#agent-allowed").check()
        await page.wait_for_timeout(1200)
        assert not errors, errors
        print("PASS: browser UI, transport, undo/redo, views, agent consent")
        sys.stdout.flush()
        try:
            await browser.close()
        except Exception as error:  # Chromium can drop the pipe after writing files.
            print("close warning:", error)
        # Screenshots are already flushed; do not mask a pass with a close race.
        os._exit(0)


if __name__ == "__main__":
    asyncio.run(main())
