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
  const sp_contents = document.getElementById("sp-contents");
  const sp_title = document.getElementById("sp-title");
  const sp_description = document.getElementById("sp-description");
  const tabEvents = document.getElementById("tab-events");
  const tabInfo = document.getElementById("tab-info");
  const tabPolls = document.getElementById("tab-polls");

  const events = window.eventsInfo;
  const usersInfo = window.usersInfo;
  const groupName = window.__CHAT.groupName;
  let currentUser = window.__CHAT.currentUser;

  //compute global isLurker var
  let currentUserRole = null;

  if (Array.isArray(usersInfo)) {
    const me = usersInfo.find((u) => u.email === currentUser);
    if (me) currentUserRole = me.role;
  }

  const isLurker = currentUserRole === "lurker";

  //helper om active tab te bepalen
  function setActiveTab(activeBtn) {
    [tabEvents, tabInfo, tabPolls].forEach((btn) => {
      if (btn) btn.classList.remove("active");
    });
    if (activeBtn) activeBtn.classList.add("active");
  }

  // event tab
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

  // group tab
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
        "<div id='memberRoleBox' style='border: 3px solid; border-radius: 5px; padding: 3px;'>" +
        user.username +
        "<small " +
        "style='font-size: 14px; color: grey;'> " +
        "(" +
        user.role +
        ")" +
        "</small>";

      if (currentUserData.get("role") === "owner" && user.role != "owner") {
        contents += " | ";
        if (user.role === "member") {
          contents +=
            "<button class='btn btn-primary roleButton' name='" +
            user.id +
            "' id='admin'>Promote</button>";
          contents += " | ";
          contents +=
            "<button class='btn btn-primary roleButton' name='" +
            user.id +
            "' id='lurker'>Lurk</button>";
        } else {
          if (user.role === "admin") {
            contents +=
              "<button class='btn btn-primary roleButton' name='" +
              user.id +
              "' id='member'>Demote</button>";
            contents += " | ";
            contents +=
              "<button class='btn btn-primary roleButton' name='" +
              user.id +
              "' id='lurker'>Lurk</button>";
          } else {
            contents +=
              "<button class='btn btn-primary roleButton' name='" +
              user.id +
              "' id='member'>Delurk</button>";
          }
        }
      }

      if (
        (currentUserData.get("role") === "admin" ||
          currentUserData.get("role") === "owner") &&
        user.role != "owner" &&
        user.email != currentUserData.get("email")
      ) {
        contents += " | ";
        contents +=
          "<button class='btn btn-primary kickButton'" +
          "' id='" +
          user.id +
          "'>Kick</button>";
      }

      contents += "</div>";
    }

    if (
      currentUserData.get("role") === "owner" ||
      currentUserData.get("role") === "admin"
    ) {
      contents +=
        "<hr style='margin: 15px 0;'>" +
        "<h2>Add member (email)</h2>" +
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
    } else {
      contents +=
        "<hr style='margin: 15px 0;'>" +
        "<button class='btn btn-primary'" +
        "id='btnDelete'" +
        "style='margin-bottom: 10px;'>" +
        "Delete" +
        "</button>";
    }

    //adding the contents to the page
    sp_contents.innerHTML = contents;

    //role buttons
    let roleButtons = document.getElementsByClassName(
      "btn btn-primary roleButton"
    );

    if (roleButtons.length > 0) {
      for (const btn of roleButtons) {
        btn.addEventListener("click", () => {
          const btnId = btn.getAttribute("id");
          const btnName = btn.getAttribute("name");

          window.location.href =
            "/groups/" + groupId + "/editRole/" + btnName + "/" + btnId + "/";
        });
      }
    }

    //kick buttons
    let kickButtons = document.getElementsByClassName(
      "btn btn-primary kickButton"
    );

    if (kickButtons.length > 0) {
      for (const btn of kickButtons) {
        btn.addEventListener("click", () => {
          const userId = btn.getAttribute("id");

          window.location.href =
            "/groups/" + groupId + "/editRole/" + userId + "/" + "kick" + "/";
        });
      }
    }

    //add button
    const btnAdd = document.getElementById("btnAdd");
    if (btnAdd) {
      btnAdd.addEventListener("click", () => {
        let newUser = document.getElementById("userEmail").value;
        window.location.href = "/groups/" + groupId + "/newMember/" + newUser;
      });
    }

    //leave button
    const btnLeave = document.getElementById("btnLeave");
    if (btnLeave) {
      btnLeave.addEventListener("click", () => {
        window.location.href = "/groups/" + groupId + "/leave";
      });
    }

    //delete button
    const btnDelete = document.getElementById("btnDelete");
    if (btnDelete) {
      if (currentUserData.get("role") === "owner") {
        btnDelete.addEventListener("click", () => {
          let confirmation = prompt(
            "CAREFULL! This cannot be undone! \n" +
              "Enter the name of the group to confirm. \n" +
              "Group name: " +
              groupName
          );
          if (confirmation === groupName) {
            window.location.href = "/groups/" + groupId + "/delete";
          }
        });
      }
    }
  }

  // polls tab
  function loadPolls() {
    sp_title.innerText = "Polls";
    sp_description.innerText = "All polls in this group.";

    let contents = "";

    if (!isLurker) {
      contents += `
      <button class="btn btn-primary mb-3" id="btnCreatePoll">
        + Create poll
      </button>
    `;
    }

    const polls = window.pollsData || [];

    if (!polls.length) {
      contents += "<p>No polls yet.</p>";
      sp_contents.innerHTML = contents;
      wireCreatePollButton();
      return;
    }

    // existing poll rendering…
    polls.forEach((poll) => {
      const closed = poll.end_time && Date.now() > poll.end_time;

      contents += `
      <div class="poll mb-3" data-poll-id="${poll.id}">
        <h4>${poll.title}</h4>
        <small class="text-muted">Created by ${poll.creator}</small>
        ${
          poll.end_time
            ? `<div><small>Ends: ${new Date(
                poll.end_time
              ).toLocaleString()}</small></div>`
            : ""
        }
        <div class="mt-2">
    `;

      poll.options.forEach((opt) => {
        contents += `
        <div class="form-check d-flex gap-2">
          <input
            class="form-check-input poll-input"
            type="${poll.allow_multiple ? "checkbox" : "radio"}"
            name="poll-${poll.id}"
            value="${opt.id}"
            ${opt.voted_by_me ? "checked" : ""}
            ${closed || isLurker ? "disabled" : ""}
          />
          <label class="form-check-label flex-grow-1">
            ${opt.title}
            ${
              opt.description
                ? `<small class="text-muted"> – ${opt.description}</small>`
                : ""
            }
          </label>
          <span class="badge bg-secondary">${opt.votes}</span>
        </div>
      `;
      });

      if (closed) {
        contents += `<div class="text-danger small mt-1">Poll closed</div>`;
      }

      contents += `</div></div>`;
    });

    sp_contents.innerHTML = contents;
    wireCreatePollButton();
  }

  // handle poll inputs
  sp_contents.addEventListener("change", async (e) => {
    if (!e.target.classList.contains("poll-input")) return;

    const pollEl = e.target.closest(".poll");
    const pollId = pollEl.dataset.pollId;

    const checked = pollEl.querySelectorAll(".poll-input:checked");
    const optionIds = Array.from(checked).map((i) => Number(i.value));

    try {
      const res = await fetch(`/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIds }),
      });

      if (!res.ok) {
        console.error("Vote failed");
      }
    } catch (err) {
      console.error("Vote error", err);
    }
  });

  //poll update listener
  const evtSource = new EventSource("/polls/stream");

  evtSource.addEventListener("pollUpdate", (e) => {
    const data = JSON.parse(e.data);

    data.options.forEach((opt) => {
      const el = document.querySelector(
        `.poll-votes[data-option-id="${opt.id}"]`
      );

      if (el) {
        el.textContent = opt.votes;
      }
    });
  });

  // poll creation modal
  function ensurePollModal() {
    if (document.getElementById("pollModal")) return;

    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="modal fade" id="pollModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Create poll</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div class="modal-body">
              <div class="mb-3">
                <label class="form-label">Title</label>
                <input id="pollTitle" class="form-control" required />
              </div>

              <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="pollAllowMultiple">
                <label class="form-check-label">Allow multiple selections</label>
              </div>

              <div class="mb-3">
                <label class="form-label">End time (optional)</label>
                <input type="datetime-local" id="pollEndTime" class="form-control" />
              </div>

              <hr />
              <h6>Options</h6>
              <div id="pollOptions"></div>

              <button class="btn btn-sm btn-outline-secondary mt-2" id="btnAddOption">
                + Add option
              </button>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button class="btn btn-primary" id="btnSavePoll">
                Create poll
              </button>
            </div>
          </div>
        </div>
      </div>
      `
    );
  }

  function addPollOption(title = "", description = "") {
    const container = document.getElementById("pollOptions");
    if (container.children.length >= 10) return;

    const idx = container.children.length + 1;

    container.insertAdjacentHTML(
      "beforeend",
      `
<div class="border rounded p-2 mb-2">
  <input class="form-control mb-1 poll-option-title"
    placeholder="Option ${idx}"
    value="${title}" />
  <input class="form-control poll-option-desc"
    placeholder="Description (optional)"
    value="${description}" />
</div>
`
    );
  }

  function wireCreatePollButton() {
    const btn = document.getElementById("btnCreatePoll");
    if (!btn) return;

    btn.onclick = () => {
      ensurePollModal();

      const optionsEl = document.getElementById("pollOptions");
      optionsEl.innerHTML = "";
      addPollOption();
      addPollOption();

      document.getElementById("btnAddOption").onclick = () => addPollOption();

      document.getElementById("btnSavePoll").onclick = submitPoll;

      new bootstrap.Modal(document.getElementById("pollModal")).show();
    };
  }

  //submit created poll
  async function submitPoll() {
    const title = document.getElementById("pollTitle").value.trim();
    if (!title) return alert("Poll title is required");

    const allowMultiple = document.getElementById("pollAllowMultiple").checked;

    const endTimeValue = document.getElementById("pollEndTime").value;

    const end_time = endTimeValue ? new Date(endTimeValue).getTime() : null;

    const options = Array.from(document.querySelectorAll(".poll-option-title"))
      .map((el, i) => ({
        title: el.value.trim(),
        description: document
          .querySelectorAll(".poll-option-desc")
          [i].value.trim(),
      }))
      .filter((o) => o.title);

    if (options.length < 2) {
      return alert("At least 2 options required");
    }

    try {
      const res = await fetch(`/polls/${groupId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          allow_multiple: allowMultiple,
          end_time,
          options,
        }),
      });

      if (!res.ok) throw new Error("Create poll failed");

      location.reload(); // simple + safe
    } catch (err) {
      console.error(err);
      alert("Failed to create poll");
    }
  }

  //wiring tab buttons
  tabEvents.addEventListener("click", () => {
    setActiveTab(tabEvents);
    loadEvents();
  });

  tabInfo.addEventListener("click", () => {
    setActiveTab(tabInfo);
    loadGroupInfo();
  });

  tabPolls.addEventListener("click", () => {
    setActiveTab(tabPolls);
    loadPolls();
  });

  //load event tab on page loads
  addEventListener("load", () => {
    setActiveTab(tabEvents);
    loadEvents();
  });
})();
