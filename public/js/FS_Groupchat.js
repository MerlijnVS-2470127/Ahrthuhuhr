(function () {
  const groupId = window.__CHAT?.groupId || "testgroup";
  let lastFetch = window.__CHAT?.lastFetch || 0;

  const messagesEl = document.getElementById("messages");
  const contentInput = document.getElementById("content");
  const userInput = document.getElementById("user_name");
  const sendBtn = document.getElementById("sendBtn");

  messagesEl.scrollTop = messagesEl.scrollHeight;

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function renderMessage(msg) {
    const div = document.createElement("div");
    div.className = "message";
    div.dataset.id = msg.id;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `<strong>${escapeHtml(
      msg.user_name
    )}</strong> — ${new Date(msg.created_at).toLocaleString()}`;
    const content = document.createElement("div");
    content.className = "content";
    content.textContent = msg.content;
    div.appendChild(meta);
    div.appendChild(content);
    messagesEl.appendChild(div);
    // keep scroll at bottom
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function fetchNewMessages() {
    try {
      const res = await fetch(
        `/groups/${encodeURIComponent(groupId)}/messages?since=${lastFetch}`
      );
      if (!res.ok) throw new Error("Network error");
      const rows = await res.json();
      if (rows.length) {
        rows.forEach((r) => renderMessage(r));
        lastFetch = rows[rows.length - 1].created_at;
      }
    } catch (err) {
      console.error("Fetch messages error", err);
    }
  }

  sendBtn.addEventListener("click", async (ev) => {
    ev.preventDefault();
    const content = contentInput.value.trim();
    if (!content) return;
    const user_name = userInput.value.trim() || "Anonymous";

    try {
      const res = await fetch(
        `/groups/${encodeURIComponent(groupId)}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_name, content }),
        }
      );

      if (!res.ok) {
        console.error(
          "Send failed",
          await res.json().catch(() => ({ error: "unknown" }))
        );
        return;
      }
      const msg = await res.json();
      renderMessage(msg);
      lastFetch = msg.created_at;
      contentInput.value = "";
      contentInput.focus();
    } catch (err) {
      console.error("Send message failed", err);
    }
  });

  // poll every 2.5s for new messages
  //setInterval(fetchNewMessages, 2500);
  // initial attempt to fetch new messages beyond server-rendered ones
  fetchNewMessages();

  //-----------//
  //Side panel //
  //-----------//
  let btn_changeSidePanel = document.getElementById("btn_changeSidePanel");
  let loaded = "";
  let sp_contents = document.getElementById("sp-contents");
  const events = window.eventsInfo;
  const groupName = window.__CHAT.groupName;

  function loadEvents() {
    sp_contents.innerHTML = "";
    if (Array.isArray(events) && events.length) {
      events.forEach(function (ev) {
        var statusClass = (ev.status || "planned")
          .replace(/\s+/g, "-")
          .toLowerCase();
        sp_contents.innerHTML +=
          "<div" +
          'class="event-tile"' +
          'aria-labelledby="ev-' +
          ev.id +
          '-title"' +
          'data-status="' +
          ev.status +
          '"' +
          'data-group-id="' +
          ev.group_id +
          '" style="">' +
          '<div class="event-content">' +
          "<h2" +
          'id="ev-' +
          ev.id +
          '-title"' +
          'class="event-title status-' +
          statusClass +
          '"' +
          'title="' +
          ev.title +
          '"' +
          ">" +
          ev.title + //title
          "</h2>" +
          "<!-- Group name above date -->";

        if (ev.end) {
          sp_contents.innerHTML +=
            '<div class="event-date" aria-hidden="true">' +
            ev.start +
            "—" +
            ev.end +
            "</div>";
        } else {
          sp_contents.innerHTML +=
            '<div class="event-date" aria-hidden="true">' + ev.start + "</div>";
        }

        if (ev.location) {
          sp_contents.innerHTML +=
            '<div class="event-location-block">' +
            '<span class="" style="font-size: 18px;">Location: ' +
            ev.location +
            "</span>" +
            "</div>";
        }

        sp_contents.innerHTML += "</div>";

        if (ev.description) {
          sp_contents.innerHTML +=
            '<p class="event-description" style="margin-bottom: 20px">' +
            ev.description +
            "</p>";
        }

        sp_contents.innerHTML += "</div>" + "</div>";
      });

      sp_contents.innerHTML +=
        "<div>" +
        '<p id="noMatchMsg" style="display: none">' +
        "No events match your filters." +
        "</p>" +
        "</div>";
    } else {
      sp_contents.innerHTML += '<p id="noEventsServer">No events found.</p>';
    }
  }

  function loadGroupInfo() {}

  addEventListener("load", () => {
    loaded = "events";
    loadEvents();
  });

  btn_changeSidePanel.addEventListener("click", () => {
    if (loaded === "events") {
      loaded = "groups";
      loadGroupInfo();
    } else {
      loaded = "events";
      loadEvents();
    }
  });
})();
