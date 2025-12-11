(function () {
  const groupId = window.__CHAT?.groupId || "testgroup";
  let lastFetch = Number(window.__CHAT?.lastFetch || 0);

  const messagesEl = document.getElementById("messages");
  const contentInput = document.getElementById("content");
  const sendBtn = document.getElementById("sendBtn");

  if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // lookup helper: try to match a message's user_name to a known user (by email or username)
  function lookupUserByMsgName(msgName) {
    if (!msgName || !Array.isArray(window.usersInfo)) return null;
    for (const u of window.usersInfo) {
      if (u.email === msgName) return u;
      if (u.username === msgName) return u;
    }
    return null;
  }

  // map role to class (keeps same naming as EJS)
  function roleClassFor(role) {
    if (!role) return "role-member";
    const r = String(role).toLowerCase();
    if (r === "lurker") return "role-lurker";
    if (r === "member") return "role-member";
    if (r === "admin") return "role-admin";
    if (r === "owner") return "role-owner";
    return "role-member";
  }

  function renderMessage(msg) {
    if (!messagesEl || !msg) return;

    // avoid duplicate IDs
    if (msg.id && messagesEl.querySelector(`.message[data-id="${msg.id}"]`)) {
      return;
    }

    const sender = lookupUserByMsgName(msg.user_name);
    const displayName = sender ? sender.username : msg.user_name || "Anonymous";
    const rclass = roleClassFor(sender ? sender.role : null);

    const div = document.createElement("div");
    div.className = "message";
    if (msg.id) div.dataset.id = msg.id;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `<strong class="${rclass}">${escapeHtml(
      displayName
    )}</strong> — ${new Date(msg.created_at).toLocaleString()}`;

    const content = document.createElement("div");
    content.className = "content";
    content.textContent = msg.content || "";

    div.appendChild(meta);
    div.appendChild(content);
    messagesEl.appendChild(div);

    // scroll to bottom (keep behaviour consistent)
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  async function fetchNewMessages() {
    try {
      const res = await fetch(
        `/groups/${encodeURIComponent(
          groupId
        )}/messages?since=${encodeURIComponent(lastFetch)}`
      );
      if (!res.ok) throw new Error("Network error");
      const rows = await res.json();
      if (rows && rows.length) {
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

    // use logged-in username from window.__CHAT.currentUser, fallback to Anonymous
    const user_name =
      window.__CHAT && window.__CHAT.currentUser
        ? String(window.__CHAT.currentUser).trim()
        : "Anonymous";

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

  // initial fetch to pick up new messages
  fetchNewMessages();

  //-----------//
  //Side panel //
  //-----------//
  const btn_changeSidePanel = document.getElementById("btn_changeSidePanel");
  let loaded = "";
  const sp_contents = document.getElementById("sp-contents");
  const sp_title = document.getElementById("sp-title");
  const sp_description = document.getElementById("sp-description");
  const events = window.eventsInfo;
  const usersInfo = window.usersInfo;
  const groupName = window.__CHAT.groupName;
  let currentUser = window.__CHAT.currentUser;

  function loadEvents() {
    sp_title.innerText = "Events";
    sp_description.innerText = "Events of the group.";
    contents = "";

    //declare contents
    if (Array.isArray(events) && events.length) {
      events.forEach(function (ev) {
        var statusClass = (ev.status || "planned")
          .replace(/\s+/g, "-")
          .toLowerCase();
        contents +=
          "<hr style='margin:0 0 10px 0;'>" +
          "<div class='singular-event' id='" +
          ev.id +
          "'>" +
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
          contents +=
            '<div class="event-date" aria-hidden="true">' +
            ev.start +
            "—" +
            ev.end +
            "</div>";
        } else {
          contents +=
            '<div class="event-date" aria-hidden="true">' + ev.start + "</div>";
        }

        if (ev.location) {
          contents +=
            '<div class="event-location-block">' +
            '<span class="" style="font-size: 18px;">Location: ' +
            ev.location +
            "</span>" +
            "</div>";
        }

        contents += "</div>";

        if (ev.description) {
          contents +=
            '<p class="event-description" style="margin-bottom: 15px">' +
            ev.description +
            "</p>";
        }

        contents += "</div>" + "</div>";
      });

      contents +=
        "<div>" +
        '<p id="noMatchMsg" style="display: none">' +
        "No events match your filters." +
        "</p>" +
        "</div>";
    } else {
      contents += '<p id="noEventsServer">No events found.</p>';
    }

    //adding the contents to the page
    sp_contents.innerHTML = contents;

    let eventsDivs = document.getElementsByClassName("singular-event");

    if (eventsDivs.length > 0) {
      for (const e of eventsDivs) {
        e.addEventListener("click", () => {
          window.location.href = "/events/" + e.getAttribute("id");
        });
      }
    }
  }

  function loadGroupInfo() {
    sp_title.innerText = groupName;
    sp_description.innerText = "Group details.";
    contents = "";

    //G-man
    let currentUserData;

    for (const user of usersInfo) {
      if (user.email === currentUser) {
        currentUserData = new Map();
        currentUserData.set("email", user.email);
        currentUserData.set("username", user.username);
        currentUserData.set("role", user.role);
      }
    }

    //declare contents
    contents += "<hr style='margin: 15px 0;'>" + "<h2>Members</h2>";

    for (const user of usersInfo) {
      contents +=
        "<div style='border: 3px solid; border-radius: 5px; padding: 3px;'>" +
        user.username +
        "<small " +
        "style='font-size: 14px; color: grey;'> " +
        "(" +
        user.role +
        ")" +
        "</small>";

      if (currentUserData.get("role") === "owner") {
        contents += " | ";
        if (user.role === "member") {
          contents +=
            "<button class='btn btn-primary' id='btnPromote'>Promote</button>";
          contents += " | ";
          contents +=
            "<button class='btn btn-primary' id='btnLurk'>Lurk</button>";
        } else {
          if (user.role === "admin") {
            contents +=
              "<button class='btn btn-primary' id='btnDemote'>Demote</button>";
            contents += " | ";
            contents +=
              "<button class='btn btn-primary' id='btnLurk'>Lurk</button>";
          } else {
            contents +=
              "<button class='btn btn-primary' id='btnDelurk'>Delurk</button>";
          }
        }
      }

      contents += "</div>";
    }

    const btnPromote = document.getElementsByClassName("btnPromote");
    const btnDemote = document.getElementsByClassName("btnPromote");
    const btnLurk = document.getElementsByClassName("btnPromote");
    const btnDelurk = document.getElementsByClassName("btnPromote");

    //eventlisteners moeten toegevoegd worden en de role moet aangepast worden in de backend

    if (
      currentUserData.get("role") === "owner" ||
      currentUserData.get("role") === "admin"
    ) {
      contents +=
        "<hr style='margin: 15px 0;'>" +
        "<h2>Add member</h2>" +
        "<input id='userEmail' name='userEmail' class='form-control' type='text' style='margin: 0 100px 0 0' />" +
        "<button class='btn btn-primary'" +
        "id='btnAdd'" +
        "style='margin: 20px 0 0 0;'>" +
        "Add" +
        "</button>";
    }

    if (currentUserData.get("role") != "owner") {
      contents +=
        "<hr style='margin: 15px 0;'>" +
        "<button class='btn btn-primary'" +
        "id='btnLeave'" +
        "style='margin-bottom: 10px;'>" +
        "Leave" +
        "</button>";
    }

    //adding the contents to the page
    sp_contents.innerHTML = contents;

    //leave button
    const btnLeave = document.getElementById("btnLeave");
    btnLeave.addEventListener("click", () => {
      window.location.href = "/groups/" + groupId + "/leave";
    });

    const btnAdd = document.getElementById("btnAdd");
    btnLeave.addEventListener("click", () => {
      let newUser = document.getElementById("userEmail").value;
      //hier moet code om newUser toe te voegen aan de groep als:
      //1. die nog geen lid is
      //2. die bestaat
      //
      //die wordt toegevoegd als lid
    });
  }

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
