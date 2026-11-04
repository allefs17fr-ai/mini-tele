/**
 * Headless checks for the kid page and the admin page.
 * Run: npm test
 */
import { chromium } from "playwright-core";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const artifacts = "/opt/cursor/artifacts";
const chrome = "/usr/local/bin/google-chrome";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json"
};

function startServer() {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://127.0.0.1");
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith("/")) pathname += "index.html";
    const filePath = normalize(join(root, pathname));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      const body = await readFile(filePath);
      res.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function decodeB64(b64) {
  return Buffer.from(b64, "base64").toString("utf8");
}

await mkdir(artifacts, { recursive: true });
const server = await startServer();
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"]
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const failures = [];

function check(name, ok, detail) {
  if (!ok) failures.push(name + (detail ? `: ${detail}` : ""));
  else console.log("ok", name);
}

try {
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForSelector(".card");
  const titles = await page.locator(".card .title").allTextContents();
  check("grid renders starter videos", titles.length === 12, String(titles.length));
  check("first card is Tchoupi", /cache-cache/i.test(titles[0]), titles[0]);
  const outbound = await page.locator('a[href*="youtube"], a[href*="admin"]').count();
  check("no links out to YouTube or admin", outbound === 0, String(outbound));

  await page.waitForFunction(() => document.activeElement && document.activeElement.classList.contains("card"));
  const before = await page.evaluate(() => document.activeElement.dataset.id);
  await page.keyboard.press("ArrowRight");
  const after = await page.evaluate(() => document.activeElement.dataset.id);
  const ids = await page.locator(".card").evaluateAll((els) => els.map((el) => el.dataset.id));
  check("d-pad moves focus to the next card", after === ids[1] && after !== before, `${before} -> ${after}`);
  await page.screenshot({ path: join(artifacts, "screenshot_kid_page.png") });

  await page.click('[data-lang="pt-BR"]');
  await page.waitForFunction(() => document.querySelector(".subtitle").textContent.includes("Seus desenhos"));
  await page.waitForFunction(() => {
    const img = document.querySelector(".card img");
    return img && img.complete && img.naturalWidth > 0;
  });
  check("language toggle switches to Portuguese", true);
  await page.screenshot({ path: join(artifacts, "screenshot_kid_portuguese.png") });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".card");
  const remembered = await page.evaluate(() => ({
    lang: localStorage.getItem("minitele.lang"),
    subtitle: document.querySelector(".subtitle").textContent
  }));
  check("language is remembered", remembered.lang === "pt-BR" && remembered.subtitle.includes("Seus desenhos"), JSON.stringify(remembered));
  await page.click('[data-lang="fr"]');
  await page.waitForFunction(() => document.querySelector(".subtitle").textContent.includes("dessins"));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(artifacts, "screenshot_kid_phone.png") });
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.route(/youtube\.com\/iframe_api/, async (route) => {
    await route.fulfill({
      contentType: "text/javascript",
      body: `
        window.YT = {
          PlayerState: { ENDED: 0, PLAYING: 1, PAUSED: 2 },
          Player: function (id, opts) {
            window.__lastPlayerVars = opts.playerVars;
            var time = 12;
            var duration = 180;
            var state = 1;
            var self = this;
            this.playVideo = function () { state = 1; opts.events.onStateChange({ data: 1, target: self }); };
            this.pauseVideo = function () { state = 2; opts.events.onStateChange({ data: 2, target: self }); };
            this.seekTo = function (t) { time = t; };
            this.getCurrentTime = function () { return time; };
            this.getDuration = function () { return duration; };
            this.getPlayerState = function () { return state; };
            this.getIframe = function () { return document.getElementById("yt-slot"); };
            this.destroy = function () {};
            setTimeout(function () { opts.events.onReady({ target: self }); }, 30);
          }
        };
        if (window.onYouTubeIframeAPIReady) window.onYouTubeIframeAPIReady();
      `
    });
  });

  await page.locator(".card").first().click();
  await page.waitForSelector("#player-layer:not([hidden])");
  await page.waitForFunction(() => document.querySelector("#time-elapsed").textContent === "0:12" && document.querySelector("#time-total").textContent === "3:00");
  const shield = await page.locator(".player-shield").count();
  const nativeOff = await page.evaluate(() => window.__lastPlayerVars && window.__lastPlayerVars.controls === 0 && window.__lastPlayerVars.rel === 0);
  check("player opens with a shield over the end screen", shield === 1);
  check("native youtube controls stay off", nativeOff);
  check("pause control and times are visible", (await page.locator("#player-toggle").innerText()).includes("Pause"));
  await page.screenshot({ path: join(artifacts, "screenshot_player_controls.png") });

  await page.click("#player-toggle");
  await page.waitForFunction(() => document.querySelector("#player-toggle").textContent.includes("Lecture"));
  check("pause button switches to play", true);
  await page.screenshot({ path: join(artifacts, "screenshot_player_paused.png") });

  await page.focus("#seek");
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => document.querySelector("#time-elapsed").textContent === "0:22");
  check("right arrow on the bar seeks 10 seconds", true);
  await page.locator("#seek").evaluate((el) => {
    el.value = "500";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.waitForFunction(() => document.querySelector("#time-elapsed").textContent === "1:30");
  check("dragging the bar seeks within the episode", true);
  await page.screenshot({ path: join(artifacts, "screenshot_player_seek.png") });
  await page.focus("#seek");
  await page.keyboard.press("ArrowDown");
  const below = await page.evaluate(() => document.activeElement && document.activeElement.id);
  check("down from the bar reaches a button", below === "player-toggle" || below === "player-back", below);
  await page.keyboard.press("ArrowUp");
  check("up from the buttons reaches the bar", await page.evaluate(() => document.activeElement && document.activeElement.id) === "seek");

  await page.evaluate(() => I18N.toggle("pt-BR"));
  await page.waitForFunction(() => document.querySelector("#player-toggle").textContent.includes("Tocar"));
  check("player labels follow the Portuguese toggle", (await page.locator("#seek").getAttribute("aria-label")) === "Posição no vídeo");
  await page.evaluate(() => I18N.toggle("fr"));

  await page.waitForTimeout(4800);
  await page.waitForFunction(() => document.getElementById("player-layer").classList.contains("controls-hidden"));
  check("controls hide after a few seconds", true);
  await page.keyboard.press("ArrowUp");
  await page.waitForFunction(() => !document.getElementById("player-layer").classList.contains("controls-hidden"));
  check("a key brings the controls back", true);

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.getElementById("player-layer").hidden);
  check("back key returns to the grid", true);

  let putBody = null;
  await page.route(/api\.github\.com/, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const authorization = request.headers().authorization || "";
    if (!authorization.startsWith("Bearer github_pat_test_token_value")) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "missing token" })
      });
      return;
    }
    if (request.method() === "GET" && path.endsWith("/contents/data/videos.json")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ sha: "starter-sha", encoding: "base64", content: "" })
      });
      return;
    }
    if (request.method() === "PUT" && path.endsWith("/contents/data/videos.json")) {
      putBody = request.postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ content: { sha: "new-sha" } })
      });
      return;
    }
    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ message: "unexpected" }) });
  });
  await page.route(/youtube\.com\/oembed/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        title: "Vidéo de test Mini Télé",
        author_name: "T'choupi",
        author_url: "https://www.youtube.com/@tchoupi",
        thumbnail_url: "https://i.ytimg.com/vi/testvideo01/hqdefault.jpg"
      })
    });
  });

  await page.evaluate(async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((reg) => reg.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
  });
  await page.route("**/data/config.json", async (route) => {
    const json = JSON.parse(await readFile(join(root, "data/config.json"), "utf8"));
    json.passwordSha256 = "2a95c2b33abb03ffb12ee2b775b4320f5a4c27ff33f6caff6975fb87f4bc86ce";
    await route.fulfill({ contentType: "application/json", body: JSON.stringify(json) });
  });
  await page.goto(base + "/admin.html", { waitUntil: "domcontentloaded" });
  await page.fill("#password", "errado");
  await page.click("#login-form button[type=submit]");
  await page.waitForFunction(() => document.querySelector("#login-error").textContent.length > 0);
  check("wrong password is rejected", true);
  await page.fill("#password", "minitele");
  await page.click("#login-form button[type=submit]");
  await page.waitForSelector("#approved-list .row");
  const starter = await page.locator(".row").first().innerText();
  check("admin lists the starter set", /Kit de départ|cache-cache/i.test(starter), starter.slice(0, 120));
  await page.screenshot({ path: join(artifacts, "screenshot_admin.png") });

  await page.click('[data-tab="add"]');
  await page.fill("#video-url", "https://www.youtube.com/watch?v=testvideo01");
  await page.click("#lookup");
  await page.waitForFunction(() => document.querySelector("#preview-title").textContent.includes("Vidéo de test"));
  check("oEmbed preview warns that embedding is allowed", (await page.locator("#preview-warn").innerText()).includes("autorisée"));
  await page.click("#approve");
  await page.waitForSelector('#approved-list [data-video-id="testvideo01"]');
  check("approved video appears in the list", true);
  await page.screenshot({ path: join(artifacts, "screenshot_admin_added.png") });

  await page.click('[data-tab="settings"]');
  await page.fill("#token", "github_pat_test_token_value");
  await page.click("#save-token");
  await page.click("#save-videos");
  await page.waitForFunction(() => document.querySelector("#status").textContent.includes("Enregistré"));
  const saved = JSON.parse(decodeB64(putBody.content));
  const added = saved.videos.find((video) => video.id === "testvideo01");
  check("mocked GitHub write contains the new video", Boolean(added) && added.starter === false && saved.videos.length === 13, JSON.stringify(added));
  check("save kept the starter episodes", saved.videos.some((video) => video.id === "iQufE_nUjpw" && video.starter === true));
  check("revision incremented", saved.revision === 2, String(saved.revision));
  const auth = putBody && putBody.message;
  check("commit message is present", typeof auth === "string" && auth.includes("Mini Télé"));
} catch (error) {
  failures.push(error.stack || String(error));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  console.error("FAILED");
  failures.forEach((failure) => console.error(failure));
  process.exit(1);
}
console.log("all checks passed");
