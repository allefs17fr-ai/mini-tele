/* Kid page: approved videos only, remote-friendly, no way out to YouTube. */
(function () {
  var library = document.getElementById("library");
  var playerLayer = document.getElementById("player-layer");
  var playerFrame = document.querySelector(".player-frame");
  var playerBack = document.getElementById("player-back");
  var playerToggle = document.getElementById("player-toggle");
  var progressBar = document.getElementById("progress-bar");
  var playerMessage = document.getElementById("player-message");

  var channels = [];
  var videos = [];
  var player = null;
  var pollTimer = 0;
  var apiReady = false;
  var apiRequested = false;
  var pendingId = null;
  var playingId = null;
  var historyMarked = false;
  var closing = false;

  var ID_RE = /^[\w-]{11}$/;
  /* Leave before YouTube's end screen of suggested videos. */
  var END_LEAD_SECONDS = 3;

  function t(key) { return I18N.t(key); }

  function thumbFor(video) {
    if (ID_RE.test(video.id)) return "https://i.ytimg.com/vi/" + video.id + "/hqdefault.jpg";
    return "";
  }

  function channelOf(video) {
    for (var i = 0; i < channels.length; i += 1) {
      if (channels[i].channelId === video.channelId) return channels[i];
    }
    return null;
  }

  function showName(video) {
    var channel = channelOf(video);
    if (channel && channel.shortName) return channel.shortName;
    if (channel && channel.name) return channel.name;
    return video.channelName || "";
  }

  function render() {
    library.textContent = "";
    if (!videos.length) {
      var empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = t("empty");
      library.appendChild(empty);
      return;
    }
    var groups = [];
    var index = {};
    videos.forEach(function (video) {
      if (!ID_RE.test(video.id)) return;
      var key = video.channelId || video.channelName || "autre";
      if (!index[key]) {
        index[key] = { key: key, video: video, items: [] };
        groups.push(index[key]);
      }
      index[key].items.push(video);
    });
    groups.forEach(function (group) {
      var channel = channelOf(group.video);
      var section = document.createElement("section");
      section.className = "group";
      var heading = document.createElement("h2");
      var emoji = document.createElement("span");
      emoji.className = "emoji";
      emoji.setAttribute("aria-hidden", "true");
      emoji.textContent = (channel && channel.emoji) || "📺";
      if (channel && channel.color) emoji.style.background = channel.color;
      var name = document.createElement("span");
      name.textContent = showName(group.video);
      heading.appendChild(emoji);
      heading.appendChild(name);
      section.appendChild(heading);
      var grid = document.createElement("div");
      grid.className = "cards";
      group.items.forEach(function (video) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = "card";
        button.dataset.id = video.id;
        var img = document.createElement("img");
        img.alt = "";
        img.src = thumbFor(video);
        var label = document.createElement("span");
        label.className = "title";
        label.textContent = video.label || video.title || video.id;
        button.appendChild(img);
        button.appendChild(label);
        button.addEventListener("click", function () { openPlayer(video.id, button); });
        grid.appendChild(button);
      });
      section.appendChild(grid);
      library.appendChild(section);
    });
    var first = library.querySelector(".card");
    if (first && !playerOpen()) first.focus();
  }

  function playerOpen() {
    return !playerLayer.hidden;
  }

  function ensureSlot() {
    var slot = document.getElementById("yt-slot");
    if (!slot) {
      slot = document.createElement("div");
      slot.id = "yt-slot";
      playerFrame.insertBefore(slot, playerFrame.firstChild);
    }
    return slot;
  }

  function loadApi() {
    if (apiRequested) return;
    apiRequested = true;
    var script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  }

  window.onYouTubeIframeAPIReady = function () {
    apiReady = true;
    if (pendingId) {
      var id = pendingId;
      pendingId = null;
      createPlayer(id);
    }
  };

  function setToggleLabel(playing) {
    playerToggle.textContent = playing ? t("pause") : t("play");
    playerToggle.dataset.state = playing ? "playing" : "paused";
  }

  function showPlayerMessage(text) {
    playerMessage.hidden = !text;
    playerMessage.textContent = text || "";
  }

  function openPlayer(id, returnButton) {
    if (!ID_RE.test(id)) return;
    if (!navigator.onLine) {
      showPlayerMessage(t("offline"));
    }
    playingId = id;
    playerLayer.hidden = false;
    showPlayerMessage("");
    progressBar.style.width = "0%";
    setToggleLabel(true);
    document.body.classList.add("is-playing");
    if (!historyMarked) {
      history.pushState({ minitele: "player" }, "");
      historyMarked = true;
    }
    loadApi();
    if (apiReady && window.YT && window.YT.Player) createPlayer(id);
    else pendingId = id;
    playerToggle.focus();
    playerLayer.dataset.returnId = returnButton && returnButton.dataset.id || id;
  }

  function createPlayer(id) {
    destroyPlayer();
    ensureSlot();
    showPlayerMessage("");
    player = new YT.Player("yt-slot", {
      videoId: id,
      host: "https://www.youtube-nocookie.com",
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        controls: 0,
        fs: 0,
        disablekb: 1,
        iv_load_policy: 3,
        playsinline: 1,
        cc_load_policy: 0,
        origin: location.origin
      },
      events: {
        onReady: onReady,
        onStateChange: onStateChange,
        onError: onError
      }
    });
    startPoll();
  }

  function onReady(event) {
    var iframe = event.target.getIframe && event.target.getIframe();
    if (iframe) {
      iframe.removeAttribute("allowfullscreen");
      iframe.setAttribute("allow", "autoplay; encrypted-media");
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    }
    event.target.playVideo();
  }

  function onStateChange(event) {
    var YTState = window.YT && window.YT.PlayerState;
    if (!YTState) return;
    if (event.data === YTState.ENDED) {
      closePlayer();
      return;
    }
    if (event.data === YTState.PLAYING) setToggleLabel(true);
    if (event.data === YTState.PAUSED) setToggleLabel(false);
  }

  function onError(event) {
    /* 101 and 150: embedding disabled by the owner. */
    var embedBlocked = event.data === 101 || event.data === 150;
    showPlayerMessage(embedBlocked ? t("embedError") : t("playerError"));
    destroyPlayer();
  }

  function startPoll() {
    stopPoll();
    pollTimer = window.setInterval(function () {
      if (!player || !player.getDuration) return;
      var duration = Number(player.getDuration());
      var time = Number(player.getCurrentTime());
      if (!(duration > 5) || !(time >= 0)) return;
      var ratio = Math.max(0, Math.min(1, time / duration));
      progressBar.style.width = (ratio * 100).toFixed(1) + "%";
      if (time > 1 && duration - time <= END_LEAD_SECONDS) closePlayer();
    }, 400);
  }

  function stopPoll() {
    if (pollTimer) window.clearInterval(pollTimer);
    pollTimer = 0;
  }

  function destroyPlayer() {
    stopPoll();
    pendingId = null;
    if (player && player.destroy) {
      try { player.destroy(); } catch (error) { /* already gone */ }
    }
    player = null;
    var slot = document.getElementById("yt-slot");
    if (slot) slot.remove();
  }

  function closePlayer(fromHistory) {
    if (closing) return;
    if (!playerOpen() && !playingId) return;
    if (!fromHistory && historyMarked) {
      closing = true;
      history.back();
      window.setTimeout(function () {
        if (closing && !playerLayer.hidden) {
          closing = false;
          historyMarked = false;
          closePlayer(true);
        }
      }, 400);
      return;
    }
    closing = false;
    historyMarked = false;
    destroyPlayer();
    var returnId = playerLayer.dataset.returnId;
    playingId = null;
    playerLayer.hidden = true;
    document.body.classList.remove("is-playing");
    showPlayerMessage("");
    var card = returnId && library.querySelector('.card[data-id="' + returnId + '"]');
    if (card) card.focus();
  }

  window.addEventListener("popstate", function () {
    closing = false;
    historyMarked = false;
    if (playerOpen()) closePlayer(true);
  });

  function isBackKey(event) {
    return event.key === "Escape" || event.key === "Backspace" || event.key === "GoBack" ||
      event.key === "BrowserBack" || event.keyCode === 4 || event.keyCode === 461;
  }

  window.miniTeleOnBack = function () {
    if (playerOpen()) {
      closePlayer();
      return true;
    }
    return false;
  };

  document.addEventListener("keydown", function (event) {
    if (!isBackKey(event)) return;
    if (Dpad.isTyping(event.target)) return;
    if (playerOpen()) {
      event.preventDefault();
      closePlayer();
      return;
    }
    if (event.key === "Backspace") event.preventDefault();
  });

  playerBack.addEventListener("click", function () { closePlayer(); });
  playerToggle.addEventListener("click", function () {
    if (!player || !player.getPlayerState || !window.YT) return;
    var state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) player.pauseVideo();
    else player.playVideo();
  });

  document.querySelectorAll("[data-lang]").forEach(function (button) {
    button.addEventListener("click", function () {
      I18N.toggle(button.getAttribute("data-lang"));
    });
  });

  window.__miniteleOnLang = function () {
    playerBack.textContent = t("back");
    if (playerOpen()) setToggleLabel(playerToggle.dataset.state !== "paused");
    render();
  };

  Dpad.install({
    root: function () { return playerOpen() ? playerLayer : document.body; }
  });

  function registerWorker() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("sw.js").catch(function () { /* optional */ });
  }

  async function boot() {
    I18N.apply();
    library.textContent = t("loading");
    try {
      var responses = await Promise.all([
        fetch("data/videos.json", { cache: "no-cache" }),
        fetch("data/channels.json", { cache: "no-cache" })
      ]);
      if (!responses[0].ok) throw new Error("videos");
      var videoDoc = await responses[0].json();
      videos = (videoDoc && videoDoc.videos) || [];
      if (responses[1].ok) {
        var channelDoc = await responses[1].json();
        channels = (channelDoc && channelDoc.channels) || [];
      }
      render();
    } catch (error) {
      library.textContent = "";
      var message = document.createElement("p");
      message.className = "empty";
      message.textContent = navigator.onLine ? t("loadError") : t("offline");
      library.appendChild(message);
    }
    registerWorker();
  }

  boot();
})();
