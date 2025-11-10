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
    meta.innerHTML = `<strong>${escapeHtml(msg.user_name)}</strong> — ${new Date(msg.created_at).toLocaleString()}`;
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
      const res = await fetch(`/groups/${encodeURIComponent(groupId)}/messages?since=${lastFetch}`);
      if (!res.ok) throw new Error("Network error");
      const rows = await res.json();
      if (rows.length) {
        rows.forEach(r => renderMessage(r));
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
      const res = await fetch(`/groups/${encodeURIComponent(groupId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name, content })
      });

      if (!res.ok) {
        console.error("Send failed", await res.json().catch(()=>({error:"unknown"})));
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
  setInterval(fetchNewMessages, 2500);
  // initial attempt to fetch new messages beyond server-rendered ones
  fetchNewMessages();
})();