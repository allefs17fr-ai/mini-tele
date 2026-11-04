/* Parent page. Writes go through the GitHub Contents API with a token kept in localStorage. */
(function () {
  var DEFAULT_HASH = "2a95c2b33abb03ffb12ee2b775b4320f5a4c27ff33f6caff6975fb87f4bc86ce";
  var SESSION_KEY = "minitele.adminOk";
  var ID_RE = /^[\w-]{11}$/;
  var CHANNEL_RE = /^UC[\w-]{22}$/;

  var config = null;
  var videosDoc = null;
  var channelsDoc = null;
  var feedsDoc = null;
  var dirtyVideos = false;
  var dirtyChannels = false;
  var draft = null;
  var confirmKey = "";

  var gate = document.getElementById("gate");
  var app = document.getElementById("app");
  var statusEl = document.getElementById("status");
  var loginError = document.getElementById("login-error");

  function t(key) { return I18N.t(key); }

  function setStatus(text, kind) {
    statusEl.textContent = text || "";
    statusEl.className = "status" + (kind ? " " + kind : "");
  }

  async function sha256(text) {
    var data = new TextEncoder().encode(text);
    var buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function parseVideoId(input) {
    var value = String(input || "").trim();
    if (ID_RE.test(value)) return value;
    try {
      var url = new URL(value);
      var host = url.hostname.replace(/^www\./, "");
      if (host === "youtu.be") {
        var shortId = url.pathname.split("/").filter(Boolean)[0] || "";
        return ID_RE.test(shortId) ? shortId : "";
      }
      if (host.indexOf("youtube.com") !== -1 || host.indexOf("youtube-nocookie.com") !== -1) {
        var fromQuery = url.searchParams.get("v") || "";
        if (ID_RE.test(fromQuery)) return fromQuery;
        var match = url.pathname.match(/\/(?:embed|shorts|live|v)\/([\w-]{11})/);
        if (match) return match[1];
      }
    } catch (error) { /* not a URL */ }
    var loose = value.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return loose ? loose[1] : "";
  }

  function formatDuration(seconds) {
    if (seconds == null || seconds === "" || Number.isNaN(Number(seconds))) return t("durationUnknown");
    var total = Math.round(Number(seconds));
    var minutes = Math.floor(total / 60);
    var remain = total % 60;
    if (minutes >= 60) {
      var hours = Math.floor(minutes / 60);
      minutes = minutes % 60;
      return hours + " h " + String(minutes).padStart(2, "0") + " min";
    }
    return minutes + ":" + String(remain).padStart(2, "0");
  }

  function thumb(id) {
    return ID_RE.test(id) ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : "";
  }

  function approvedIds() {
    var set = {};
    (videosDoc.videos || []).forEach(function (video) { set[video.id] = true; });
    return set;
  }

  function markVideosDirty() {
    dirtyVideos = true;
    renderSaveBar();
  }

  function markChannelsDirty() {
    dirtyChannels = true;
    renderSaveBar();
  }

  function renderSaveBar() {
    var bar = document.getElementById("save-bar");
    var note = document.getElementById("dirty-note");
    note.hidden = !(dirtyVideos || dirtyChannels);
    bar.hidden = !(dirtyVideos || dirtyChannels);
    document.getElementById("save-videos").disabled = !dirtyVideos;
    document.getElementById("save-channels").disabled = !dirtyChannels;
  }

  function requireToken() {
    if (GitHubStore.token()) return true;
    setStatus(t("needToken"), "bad");
    return false;
  }

  async function saveFile(path, value, message) {
    if (!requireToken()) return false;
    try {
      await GitHubStore.saveJson(config, path, value, message);
      setStatus(t("saved") + " " + t("saveHint"), "ok");
      return true;
    } catch (error) {
      setStatus(error.status === 409 ? t("conflict") : (t("saveError") + " " + (error.message || "")), "bad");
      return false;
    }
  }

  function switchTab(name) {
    document.querySelectorAll("[data-tab]").forEach(function (button) {
      var on = button.getAttribute("data-tab") === name;
      button.setAttribute("aria-selected", on ? "true" : "false");
      button.classList.toggle("is-on", on);
    });
    document.querySelectorAll("[data-panel]").forEach(function (panel) {
      panel.hidden = panel.getAttribute("data-panel") !== name;
    });
  }

  function button(className, label, attrs) {
    var el = document.createElement("button");
    el.type = "button";
    el.className = className;
    el.textContent = label;
    if (attrs) Object.keys(attrs).forEach(function (key) { el.setAttribute(key, attrs[key]); });
    return el;
  }

  function renderApproved() {
    var list = document.getElementById("approved-list");
    var note = document.getElementById("starter-note");
    list.textContent = "";
    var lang = I18N.getLang();
    var notes = (videosDoc && videosDoc.notes) || {};
    var text = lang === "pt-BR" ? notes.pt : notes.fr;
    note.textContent = videosDoc && videosDoc.starterSet && text ? text : "";
    note.hidden = !note.textContent;
    document.getElementById("revision").textContent =
      t("revisionLabel") + " " + ((videosDoc && videosDoc.revision) || 1);
    var videos = (videosDoc && videosDoc.videos) || [];
    document.getElementById("remove-starter").hidden = !videos.some(function (video) { return video.starter; });
    if (!videos.length) {
      var empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = t("emptyApproved");
      list.appendChild(empty);
      return;
    }
    videos.forEach(function (video, index) {
      var row = document.createElement("article");
      row.className = "row";
      row.dataset.videoId = video.id;
      var img = document.createElement("img");
      img.alt = "";
      img.src = thumb(video.id);
      var body = document.createElement("div");
      body.className = "row-body";
      var title = document.createElement("strong");
      title.textContent = video.label || video.title;
      body.appendChild(title);
      var meta = document.createElement("p");
      meta.className = "muted";
      var bits = [video.channelName || ""];
      if (video.durationSeconds != null) bits.push(formatDuration(video.durationSeconds));
      if (video.starter) bits.push(t("starterBadge"));
      meta.textContent = bits.filter(Boolean).join(" · ");
      body.appendChild(meta);
      if (video.label && video.title && video.label !== video.title) {
        var official = document.createElement("p");
        official.className = "muted small";
        official.textContent = video.title;
        body.appendChild(official);
      }
      var actions = document.createElement("div");
      actions.className = "row-actions";
      var up = button("btn", t("moveUp"));
      up.disabled = index === 0;
      up.addEventListener("click", function () { moveVideo(index, -1); });
      var down = button("btn", t("moveDown"));
      down.disabled = index === videos.length - 1;
      down.addEventListener("click", function () { moveVideo(index, 1); });
      var removeKey = "video:" + video.id;
      var remove = button("btn danger", confirmKey === removeKey ? t("confirmRemove") : t("remove"));
      remove.addEventListener("click", function () {
        if (confirmKey !== removeKey) {
          confirmKey = removeKey;
          renderApproved();
          return;
        }
        videosDoc.videos.splice(index, 1);
        if (!videosDoc.videos.some(function (item) { return item.starter; })) videosDoc.starterSet = false;
        confirmKey = "";
        markVideosDirty();
        setStatus(t("removedLocal"), "");
        renderApproved();
        renderFeeds();
      });
      actions.appendChild(up);
      actions.appendChild(down);
      actions.appendChild(remove);
      row.appendChild(img);
      row.appendChild(body);
      row.appendChild(actions);
      list.appendChild(row);
    });
  }

  function moveVideo(index, delta) {
    var videos = videosDoc.videos;
    var next = index + delta;
    if (next < 0 || next >= videos.length) return;
    var item = videos[index];
    videos.splice(index, 1);
    videos.splice(next, 0, item);
    markVideosDirty();
    renderApproved();
    var row = document.querySelector('[data-video-id="' + item.id + '"] button');
    if (row) row.focus();
  }

  function addVideo(video) {
    videosDoc.videos = videosDoc.videos || [];
    if (videosDoc.videos.some(function (item) { return item.id === video.id; })) {
      setStatus(t("alreadyApproved"), "");
      return;
    }
    videosDoc.videos.push(video);
    markVideosDirty();
    setStatus(t("addedLocal"), "ok");
    renderApproved();
    renderFeeds();
    switchTab("approved");
  }

  function matchChannel(authorUrl, authorName) {
    var channels = (channelsDoc && channelsDoc.channels) || [];
    var url = String(authorUrl || "").replace(/\/$/, "");
    for (var i = 0; i < channels.length; i += 1) {
      var channel = channels[i];
      var channelUrl = String(channel.url || "").replace(/\/$/, "");
      if ((url && channelUrl && url === channelUrl) || (url && url.indexOf(channel.channelId) !== -1)) return channel;
    }
    if (authorName) {
      for (var j = 0; j < channels.length; j += 1) {
        if (channels[j].name === authorName || channels[j].shortName === authorName) return channels[j];
      }
    }
    return null;
  }

  async function lookup() {
    var input = document.getElementById("video-url");
    var id = parseVideoId(input.value);
    var box = document.getElementById("preview");
    var warn = document.getElementById("preview-warn");
    var approve = document.getElementById("approve");
    draft = null;
    approve.disabled = true;
    box.hidden = true;
    warn.textContent = "";
    warn.className = "warn-text";
    if (!id) {
      warn.textContent = t("badUrl");
      return;
    }
    if (/\/shorts\//.test(input.value)) warn.textContent = t("shortWarning");
    box.hidden = false;
    document.getElementById("preview-img").src = thumb(id);
    document.getElementById("preview-title").textContent = t("loading");
    var endpoint = "https://www.youtube.com/oembed?format=json&url=" +
      encodeURIComponent("https://www.youtube.com/watch?v=" + id);
    try {
      var response = await fetch(endpoint);
      if (response.status === 401 || response.status === 403) {
        warn.textContent = t("embedDisabled");
        document.getElementById("preview-title").textContent = id;
        draft = baseDraft(id, id, "", "");
        approve.disabled = false;
        return;
      }
      if (!response.ok) {
        warn.textContent = t("lookupError");
        return;
      }
      var data = await response.json();
      var channel = matchChannel(data.author_url, data.author_name);
      draft = baseDraft(id, data.title || id, channel, data.author_name || "");
      document.getElementById("preview-title").textContent = draft.title;
      document.getElementById("preview-meta").textContent = draft.channelName || "";
      if (!warn.textContent) warn.textContent = t("embedOk");
      warn.className = warn.textContent === t("embedOk") ? "ok-text" : "warn-text";
      approve.disabled = approvedIds()[id] === true;
      if (approvedIds()[id]) warn.textContent = t("alreadyApproved");
    } catch (error) {
      warn.textContent = t("embedCheckFailed");
      warn.className = "warn-text";
      document.getElementById("preview-title").textContent = id;
      draft = baseDraft(id, id, null, "");
      approve.disabled = false;
    }
  }

  function baseDraft(id, title, channel, authorName) {
    return {
      id: id,
      title: title,
      label: title,
      channelId: channel ? channel.channelId : "",
      channelName: channel ? channel.name : authorName,
      thumbnail: thumb(id),
      durationSeconds: null,
      publishedAt: null,
      approvedAt: new Date().toISOString(),
      starter: false
    };
  }

  function renderFeeds() {
    var root = document.getElementById("feed-list");
    root.textContent = "";
    if (!feedsDoc || !feedsDoc.channels) {
      var empty = document.createElement("p");
      empty.textContent = t("noFeeds");
      root.appendChild(empty);
      return;
    }
    var when = document.getElementById("feeds-when");
    when.textContent = feedsDoc.generatedAt ? (t("feedsUpdated") + " " + feedsDoc.generatedAt.replace("T", " ").replace("+00:00", " UTC").replace("Z", " UTC")) : "";
    var hideShort = document.getElementById("hide-shorts").checked;
    var hideLong = document.getElementById("hide-long").checked;
    var hideLive = document.getElementById("hide-live").checked;
    var known = approvedIds();
    feedsDoc.channels.forEach(function (channel) {
      var section = document.createElement("section");
      section.className = "feed-channel";
      var heading = document.createElement("h3");
      heading.textContent = channel.name || channel.channelId;
      section.appendChild(heading);
      if (!channel.ok && channel.error) {
        var err = document.createElement("p");
        err.className = "warn-text";
        err.textContent = t("feedError") + " — " + channel.error;
        section.appendChild(err);
      }
      var shown = 0;
      (channel.videos || []).forEach(function (video) {
        if (hideShort && video.likelyShort) return;
        if (hideLong && video.likelyLong) return;
        if (hideLive && video.likelyLive) return;
        shown += 1;
        var row = document.createElement("article");
        row.className = "row";
        var img = document.createElement("img");
        img.alt = "";
        img.src = thumb(video.id);
        var body = document.createElement("div");
        body.className = "row-body";
        var title = document.createElement("strong");
        title.textContent = video.title;
        body.appendChild(title);
        var meta = document.createElement("p");
        meta.className = "muted";
        var bits = [];
        if (video.durationSeconds != null) bits.push(formatDuration(video.durationSeconds));
        if (video.publishedAt) bits.push(String(video.publishedAt).slice(0, 10));
        meta.textContent = bits.join(" · ");
        body.appendChild(meta);
        var badges = document.createElement("p");
        badges.className = "badges";
        if (video.likelyShort) badges.appendChild(badge(t("badgeShort")));
        if (video.likelyLong) badges.appendChild(badge(t("badgeLong")));
        if (video.likelyLive) badges.appendChild(badge(t("badgeLive")));
        if (badges.childNodes.length) body.appendChild(badges);
        var approve = button("btn primary", known[video.id] ? t("alreadyApproved") : t("approve"));
        approve.disabled = !!known[video.id];
        approve.addEventListener("click", function () {
          addVideo({
            id: video.id,
            title: video.title,
            label: video.title,
            channelId: channel.channelId,
            channelName: channel.name,
            thumbnail: thumb(video.id),
            durationSeconds: video.durationSeconds,
            publishedAt: video.publishedAt || null,
            approvedAt: new Date().toISOString(),
            starter: false
          });
        });
        row.appendChild(img);
        row.appendChild(body);
        row.appendChild(approve);
        section.appendChild(row);
      });
      if (!shown) {
        var none = document.createElement("p");
        none.className = "muted";
        none.textContent = t("filterEmpty");
        section.appendChild(none);
      }
      root.appendChild(section);
    });
  }

  function badge(text) {
    var span = document.createElement("span");
    span.className = "badge";
    span.textContent = text;
    return span;
  }

  function renderChannels() {
    var list = document.getElementById("channel-list");
    list.textContent = "";
    var lang = I18N.getLang();
    (channelsDoc.channels || []).forEach(function (channel, index) {
      var row = document.createElement("article");
      row.className = "row";
      var icon = document.createElement("div");
      icon.className = "emoji-lg";
      icon.textContent = channel.emoji || "📺";
      if (channel.color) icon.style.background = channel.color;
      var body = document.createElement("div");
      body.className = "row-body";
      var title = document.createElement("strong");
      title.textContent = channel.shortName || channel.name;
      body.appendChild(title);
      var meta = document.createElement("p");
      meta.className = "muted";
      meta.textContent = (channel.name || "") + " · " + channel.channelId;
      body.appendChild(meta);
      var description = lang === "pt-BR" ? channel.description_pt : channel.description_fr;
      if (description) {
        var desc = document.createElement("p");
        desc.className = "muted small";
        desc.textContent = description;
        body.appendChild(desc);
      }
      var note = lang === "pt-BR" ? channel.note_pt : channel.note_fr;
      if (note) {
        var noteEl = document.createElement("p");
        noteEl.className = "warn-text";
        noteEl.textContent = note;
        body.appendChild(noteEl);
      }
      var removeKey = "channel:" + channel.channelId;
      var remove = button("btn danger", confirmKey === removeKey ? t("confirmRemove") : t("channelRemove"));
      remove.addEventListener("click", function () {
        if (confirmKey !== removeKey) {
          confirmKey = removeKey;
          renderChannels();
          return;
        }
        channelsDoc.channels.splice(index, 1);
        confirmKey = "";
        markChannelsDirty();
        renderChannels();
      });
      row.appendChild(icon);
      row.appendChild(body);
      row.appendChild(remove);
      list.appendChild(row);
    });
  }

  function renderToken() {
    var current = GitHubStore.token();
    var label = document.getElementById("token-state");
    label.textContent = current ? (t("tokenSaved") + " …" + current.slice(-4)) : "";
    document.getElementById("repo-label").textContent =
      t("repoLabel") + " : " + config.github.owner + "/" + config.github.repo + " (" + config.github.branch + ")";
    var banner = document.getElementById("default-banner");
    banner.hidden = config.passwordSha256 !== DEFAULT_HASH;
  }

  function renderAll() {
    renderApproved();
    renderFeeds();
    renderChannels();
    renderToken();
    renderSaveBar();
    I18N.apply(app);
    /* Re-apply dynamic bits that apply() would wipe if they used data-i18n. They don't. */
    renderToken();
    document.getElementById("revision").textContent =
      t("revisionLabel") + " " + ((videosDoc && videosDoc.revision) || 1);
  }

  async function loadPublished() {
    var responses = await Promise.all([
      fetch("data/videos.json", { cache: "no-cache" }),
      fetch("data/channels.json", { cache: "no-cache" }),
      fetch("data/feeds.json", { cache: "no-cache" })
    ]);
    if (!responses[0].ok || !responses[1].ok) throw new Error("data");
    videosDoc = await responses[0].json();
    channelsDoc = await responses[1].json();
    videosDoc.videos = videosDoc.videos || [];
    channelsDoc.channels = channelsDoc.channels || [];
    if (responses[2].ok) feedsDoc = await responses[2].json();
    if (GitHubStore.token()) {
      try {
        var fresh = await GitHubStore.readJson(config, "data/feeds.json");
        if (fresh.json) feedsDoc = fresh.json;
      } catch (error) { /* published copy remains */ }
    }
  }

  async function enterApp() {
    sessionStorage.setItem(SESSION_KEY, "1");
    gate.hidden = true;
    app.hidden = false;
    setStatus(t("loading"), "");
    try {
      await loadPublished();
      setStatus("", "");
      renderAll();
      switchTab("approved");
    } catch (error) {
      setStatus(t("loadError"), "bad");
    }
  }

  document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    loginError.textContent = "";
    var password = document.getElementById("password").value;
    var hash = await sha256(password);
    if (hash !== String(config.passwordSha256 || "").toLowerCase()) {
      loginError.textContent = t("loginError");
      return;
    }
    document.getElementById("password").value = "";
    enterApp();
  });

  document.getElementById("logout").addEventListener("click", function () {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  document.querySelectorAll("[data-tab]").forEach(function (button) {
    button.addEventListener("click", function () { switchTab(button.getAttribute("data-tab")); });
  });

  document.querySelectorAll("[data-lang]").forEach(function (button) {
    button.addEventListener("click", function () {
      I18N.toggle(button.getAttribute("data-lang"));
      if (!app.hidden && videosDoc) renderAll();
      else I18N.apply();
    });
  });

  document.getElementById("save-token").addEventListener("click", function () {
    var value = document.getElementById("token").value.trim();
    if (!value) return;
    GitHubStore.setToken(value);
    document.getElementById("token").value = "";
    renderToken();
    setStatus(t("tokenSaved"), "ok");
    if (videosDoc) {
      GitHubStore.readJson(config, "data/feeds.json").then(function (fresh) {
        if (fresh.json) {
          feedsDoc = fresh.json;
          renderFeeds();
        }
      }).catch(function () { /* keep published feeds */ });
    }
  });

  document.getElementById("forget-token").addEventListener("click", function () {
    GitHubStore.setToken("");
    renderToken();
  });

  document.getElementById("test-token").addEventListener("click", async function () {
    if (!requireToken()) return;
    try {
      await GitHubStore.testToken(config);
      setStatus(t("tokenOk"), "ok");
    } catch (error) {
      setStatus(t("tokenBad"), "bad");
    }
  });

  document.getElementById("lookup").addEventListener("click", lookup);
  document.getElementById("video-url").addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      lookup();
    }
  });

  document.getElementById("approve").addEventListener("click", function () {
    if (!draft) return;
    addVideo(draft);
    draft = null;
    document.getElementById("approve").disabled = true;
    document.getElementById("video-url").value = "";
  });

  document.getElementById("remove-starter").addEventListener("click", function () {
    videosDoc.videos = (videosDoc.videos || []).filter(function (video) { return !video.starter; });
    videosDoc.starterSet = false;
    videosDoc.notes = { fr: "", pt: "" };
    markVideosDirty();
    renderApproved();
  });

  ["hide-shorts", "hide-long", "hide-live"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", renderFeeds);
  });

  document.getElementById("channel-form").addEventListener("submit", function (event) {
    event.preventDefault();
    var channelId = document.getElementById("new-channel-id").value.trim();
    if (!CHANNEL_RE.test(channelId)) {
      setStatus(t("channelIdInvalid"), "bad");
      return;
    }
    if ((channelsDoc.channels || []).some(function (channel) { return channel.channelId === channelId; })) {
      setStatus(t("channelDuplicate"), "bad");
      return;
    }
    var name = document.getElementById("new-channel-name").value.trim();
    channelsDoc.channels.push({
      name: name,
      shortName: document.getElementById("new-channel-short").value.trim() || name,
      url: document.getElementById("new-channel-url").value.trim(),
      channelId: channelId,
      category: document.getElementById("new-channel-category").value,
      emoji: document.getElementById("new-channel-emoji").value.trim() || "📺",
      color: "#ffd166",
      description_fr: "",
      description_pt: ""
    });
    event.target.reset();
    markChannelsDirty();
    renderChannels();
    setStatus("", "");
  });

  document.getElementById("save-videos").addEventListener("click", async function () {
    videosDoc.revision = Number(videosDoc.revision || 1) + 1;
    videosDoc.updatedAt = new Date().toISOString();
    var ok = await saveFile("data/videos.json", videosDoc, "Mini Télé : mettre à jour les vidéos approuvées");
    if (!ok) {
      videosDoc.revision -= 1;
      return;
    }
    dirtyVideos = false;
    renderSaveBar();
    renderApproved();
  });

  document.getElementById("save-channels").addEventListener("click", async function () {
    var ok = await saveFile("data/channels.json", channelsDoc, "Mini Télé : mettre à jour les chaînes sources");
    if (!ok) return;
    dirtyChannels = false;
    renderSaveBar();
  });

  document.getElementById("password-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    var first = document.getElementById("new-password").value;
    var second = document.getElementById("confirm-password").value;
    if (first.length < 6) {
      setStatus(t("passwordShort"), "bad");
      return;
    }
    if (first !== second) {
      setStatus(t("passwordMismatch"), "bad");
      return;
    }
    var next = Object.assign({}, config, { passwordSha256: await sha256(first) });
    var ok = await saveFile("data/config.json", next, "Mini Télé : changer le mot de passe parent");
    if (!ok) return;
    config = next;
    document.getElementById("new-password").value = "";
    document.getElementById("confirm-password").value = "";
    renderToken();
    setStatus(t("passwordChanged"), "ok");
  });

  window.addEventListener("beforeunload", function (event) {
    if (dirtyVideos || dirtyChannels) {
      event.preventDefault();
      event.returnValue = "";
    }
  });

  Dpad.install();

  async function boot() {
    I18N.apply();
    try {
      var response = await fetch("data/config.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("config");
      config = await response.json();
    } catch (error) {
      loginError.textContent = t("loadError");
      return;
    }
    if (sessionStorage.getItem(SESSION_KEY) === "1") enterApp();
  }

  boot();
})();
