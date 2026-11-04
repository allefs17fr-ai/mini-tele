/* GitHub Contents API. The token never leaves this browser except as a Bearer header. */
(function (global) {
  var TOKEN_KEY = "minitele.githubToken";

  function token() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function setToken(value) {
    if (value) localStorage.setItem(TOKEN_KEY, value.trim());
    else localStorage.removeItem(TOKEN_KEY);
  }

  function encodeB64(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    var chunk = 0x8000;
    for (var i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  function decodeB64(b64) {
    var bin = atob(String(b64).replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  async function api(cfg, path, options) {
    var headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    var current = token();
    if (current) headers.Authorization = "Bearer " + current;
    var response = await fetch("https://api.github.com" + path, {
      method: (options && options.method) || "GET",
      headers: Object.assign(headers, (options && options.headers) || {}),
      body: options && options.body
    });
    var text = await response.text();
    var body = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (error) {
        body = { message: text };
      }
    }
    if (!response.ok) {
      var err = new Error((body && body.message) || response.statusText || "GitHub");
      err.status = response.status;
      throw err;
    }
    return body;
  }

  function contentsPath(cfg, path) {
    return "/repos/" + cfg.github.owner + "/" + cfg.github.repo + "/contents/" + path + "?ref=" + encodeURIComponent(cfg.github.branch);
  }

  async function readJson(cfg, path) {
    var data = await api(cfg, contentsPath(cfg, path));
    var text = data && data.content ? decodeB64(data.content) : "";
    return { json: text ? JSON.parse(text) : null, sha: data.sha };
  }

  async function saveJson(cfg, path, value, message) {
    var sha;
    try {
      var current = await api(cfg, contentsPath(cfg, path));
      sha = current.sha;
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    var payload = {
      message: message,
      content: encodeB64(JSON.stringify(value, null, 2) + "\n"),
      branch: cfg.github.branch
    };
    if (sha) payload.sha = sha;
    return api(cfg, "/repos/" + cfg.github.owner + "/" + cfg.github.repo + "/contents/" + path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  async function testToken(cfg) {
    return api(cfg, "/repos/" + cfg.github.owner + "/" + cfg.github.repo);
  }

  global.GitHubStore = {
    TOKEN_KEY: TOKEN_KEY,
    token: token,
    setToken: setToken,
    readJson: readJson,
    saveJson: saveJson,
    testToken: testToken
  };
})(window);
