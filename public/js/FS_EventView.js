function showToast(message, type = "info", timeout = 3000) {
  const toastId = "t" + Math.random().toString(36).slice(2, 9);
  const bgClass =
    type === "success"
      ? "bg-success text-white"
      : type === "danger"
      ? "bg-danger text-white"
      : "bg-light text-dark";
  const html = `
      <div id="${toastId}" class="toast ${bgClass}" role="alert" aria-live="polite" aria-atomic="true" data-bs-delay="${timeout}">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white ms-auto me-2" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;
  toastContainer.insertAdjacentHTML("beforeend", html);
  const el = document.getElementById(toastId);
  const t = new bootstrap.Toast(el);
  t.show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}

document.addEventListener("DOMContentLoaded", () => {
  const saveBtn = document.getElementById("saveAttendanceBtn");
  const viewBtn = document.getElementById("viewAttendeesBtn");
  const calenderBtn = document.getElementById("saveToCalenderBtn");
  const attendanceRadios = Array.from(
    document.querySelectorAll(".attendance-radio")
  );
  const attendanceMsg = document.getElementById("attendanceMsg");
  const toastContainer = document.getElementById("toastContainer");
  const attendeesModalEl = document.getElementById("attendeesModal");
  let attendeesModal = null;
  if (attendeesModalEl && window.bootstrap)
    attendeesModal = new bootstrap.Modal(attendeesModalEl);

  async function setAttendance(status) {
    const idMatch = window.location.pathname.match(/\/events\/(\d+)/);
    if (!idMatch) return showToast("Bad event id", "danger");
    const eventId = idMatch[1];

    try {
      const res = await fetch(`/events/${eventId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(
          "Failed to save attendance: " + (data.error || res.statusText),
          "danger"
        );
        return;
      }
      showToast("Attendance saved", "success");
      attendanceMsg.textContent = `Your status: ${status}`;
    } catch (err) {
      console.error(err);
      showToast("Network error", "danger");
    }
  }

  async function loadAttendees() {
    const idMatch = window.location.pathname.match(/\/events\/(\d+)/);
    if (!idMatch) return;
    const eventId = idMatch[1];

    const listEl = document.getElementById("attendeesList");
    if (!listEl) return;
    listEl.innerHTML = '<div class="text-center text-muted">Loading…</div>';

    try {
      const res = await fetch(`/events/${eventId}/attendees`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        listEl.innerHTML =
          '<div class="text-danger">Failed to load attendees.</div>';
        return;
      }
      const rows = json.attendees || [];
      if (rows.length === 0) {
        listEl.innerHTML = "<div class='text-muted'>No attendees yet.</div>";
        return;
      }
      // build list
      const frag = document.createDocumentFragment();
      rows.forEach((r) => {
        const div = document.createElement("div");
        div.className = "mb-2";
        const time = r.joined_at
          ? ` — ${new Date(Number(r.joined_at)).toLocaleString()}`
          : "";
        div.innerHTML = `<strong>${escapeHtml(
          r.username
        )}</strong> <small class="text-muted">(${escapeHtml(
          r.status
        )})${time}</small>`;
        frag.appendChild(div);
      });
      listEl.innerHTML = "";
      listEl.appendChild(frag);
    } catch (err) {
      console.error(err);
      listEl.innerHTML = '<div class="text-danger">Network error</div>';
    }
  }

  // simple escape (small)
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const sel = attendanceRadios.find((r) => r.checked);
      if (!sel) {
        showToast("Choose a status first", "warning");
        return;
      }
      setAttendance(sel.value);
    });
  }

  if (viewBtn) {
    viewBtn.addEventListener("click", async () => {
      await loadAttendees();
      if (attendeesModal) attendeesModal.show();
    });
  }

  if (calenderBtn) {
    calenderBtn.addEventListener("click", async () => {
      //get Data for calender entry
      let titleText = document.getElementById("txt_eventTitle");
      let dateStartText = document.getElementById("txt_eventDateStart");
      let dateEndText = document.getElementById("txt_eventDateEnd");
      let locationText = document.getElementById("txt_eventLocation");
      let descriptionText = document.getElementById("txt_eventDescription");

      let date = "";

      if (titleText) titleText = titleText.innerText;

      //add start time to date
      if (dateStartText) {
        let start = new Date(dateStartText.innerText)
          .toISOString()
          .replace(/-|:|\.\d\d\d/g, ""); //regex van stack overflow https://stackoverflow.com/questions/10488831/link-to-add-to-google-calendar

        date = start + "/";
      }

      //if an end time exists, add end time to date. Else, add the end of the day of the start time as end time to date
      if (dateEndText) {
        if (dateEndText.innerText != "") {
          let end = new Date(dateEndText.innerText)
            .toISOString()
            .replace(/-|:|\.\d\d\d/g, ""); //regex van stack overflow https://stackoverflow.com/questions/10488831/link-to-add-to-google-calendar

          date += end;
        } else {
          if (dateStartText) {
            end = new Date(dateStartText.innerText).setHours(23);
            end = new Date(end).setMinutes(59);
            end = new Date(end).toISOString().replace(/-|:|\.\d\d\d/g, "");

            date += end;
          }
        }
      }

      if (locationText) locationText = locationText.innerText.substring(10);

      if (descriptionText) descriptionText = descriptionText.innerText;

      //save to google calender
      window.open(
        "https://www.google.com/calendar/" +
          "render?action=TEMPLATE&text=" +
          encodeURIComponent(titleText) + //title
          "&dates=" +
          date +
          "&details=" +
          encodeURIComponent(descriptionText) + //description
          "&location=" +
          encodeURIComponent(locationText), //location
        "_blank"
      );
    });
  }
  initResourceUpload();
  fetchResources();
});

// ---------- resources UI & upload logic ----------

async function fetchResources() {
  const idMatch = window.location.pathname.match(/\/events\/(\d+)/);
  if (!idMatch) return;
  const eventId = idMatch[1];
  const listEl = document.getElementById("event-resources-list");
  const loadingEl = document.getElementById("resources-loading");
  if (!listEl) return;

  try {
    const res = await fetch(`/events/${eventId}/resources`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      loadingEl && (loadingEl.textContent = "Failed to load resources.");
      return;
    }
    const rows = json.resources || [];
    if (rows.length === 0) {
      listEl.innerHTML =
        "<div class='text-muted'>No resources uploaded yet.</div>";
      return;
    }

    // Build vertical cards
    listEl.innerHTML = ""; // clear
    rows.forEach((r) => {
      const card = document.createElement("div");
      card.className =
        "resource-card d-flex align-items-start gap-3 p-3 border rounded";

      // Left: thumb (constrained size)
      const imgWrap = document.createElement("div");
      imgWrap.style = "flex: 0 0 120px; max-width: 120px; cursor: pointer;";
      const img = document.createElement("img");
      img.src = `/resources/${r.id}/file`; // serves binary; server may add caching
      img.alt = r.filename || r.storage_name || "resource";
      img.style =
        "width: 100%; height: 90px; object-fit: cover; border-radius:6px; display:block;";
      // click => open big viewer
      img.addEventListener("click", () => openResourceViewer(r));
      imgWrap.appendChild(img);

      // Middle: tag + metadata
      const body = document.createElement("div");
      body.style = "flex: 1 1 auto; min-width: 0;";
      const title = document.createElement("div");
      title.className = "fw-semibold";
      title.textContent = r.tag || r.filename || "resource";
      const meta = document.createElement("div");
      meta.className = "text-muted small mt-1";
      const uploadedAt = r.uploaded_at
        ? new Date(Number(r.uploaded_at)).toLocaleString()
        : "";
      meta.textContent = `${r.filename || ""} ${
        uploadedAt ? " — " + uploadedAt : ""
      }`;

      body.appendChild(title);
      body.appendChild(meta);

      // Right: download button aligned right
      const right = document.createElement("div");
      right.style = "flex: 0 0 auto; margin-left: 12px; text-align: right;";
      const dlBtn = document.createElement("a");
      dlBtn.className = "btn btn-outline-secondary btn-sm";
      dlBtn.href = `/resources/${r.id}/file?download=1`; // server should set Content-Disposition when ?download=1
      dlBtn.textContent = "Download resource";
      right.appendChild(dlBtn);

      card.appendChild(imgWrap);
      card.appendChild(body);
      card.appendChild(right);

      listEl.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    loadingEl &&
      (loadingEl.textContent = "Network error while loading resources.");
  }
}

function openResourceViewer(resourceRow) {
  // show modal with larger image, set download link
  const imgEl = document.getElementById("resourceImageModalImg");
  const dlLink = document.getElementById("resourceImageModalDownload");
  imgEl.src = `/resources/${resourceRow.id}/file`;
  imgEl.alt = resourceRow.filename || resourceRow.storage_name || "";
  dlLink.href = `/resources/${resourceRow.id}/file?download=1`;
  // show bootstrap modal
  const modalEl = document.getElementById("resourceImageModal");
  if (modalEl && window.bootstrap) {
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  } else {
    // fallback: open in new tab
    window.open(imgEl.src, "_blank");
  }
}

// Upload modal wiring
function initResourceUpload() {
  const openBtn = document.getElementById("openUploadModalBtn");
  const form = document.getElementById("resourceUploadForm");
  const fileInput = document.getElementById("resourceFiles");
  const tagInput = document.getElementById("resourceTag");
  const uploadWarning = document.getElementById("uploadWarning");

  if (!openBtn || !form) return;

  // wire open button -> show modal
  const modalEl = document.getElementById("resourceUploadModal");
  let uploadModal = null;
  if (modalEl && window.bootstrap) uploadModal = new bootstrap.Modal(modalEl);

  openBtn.addEventListener("click", () => {
    if (uploadModal) uploadModal.show();
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    uploadWarning.style.display = "none";
    const files = Array.from(fileInput.files || []);
    const tag = (tagInput.value || "").trim();
    if (!files.length) {
      uploadWarning.textContent = "Pick one or more image files to upload.";
      uploadWarning.style.display = "block";
      return;
    }
    if (!tag) {
      uploadWarning.textContent = "Enter a tag/title for these resources.";
      uploadWarning.style.display = "block";
      return;
    }

    // build formdata
    const idMatch = window.location.pathname.match(/\/events\/(\d+)/);
    if (!idMatch) return showToast("Bad event id", "danger");
    const eventId = idMatch[1];

    const fd = new FormData();
    files.forEach((f) => fd.append("resources", f));
    fd.append("tag", tag);

    try {
      const resp = await fetch(`/events/${eventId}/resources`, {
        method: "POST",
        body: fd,
      });
      const json = await resp.json().catch(() => ({}));
      console.log("line reached: ", resp);

      if (!resp.ok) {
        showToast(
          "Upload failed: " + (json.error || resp.statusText),
          "danger"
        );
        return;
      }
      // close modal
      if (uploadModal) uploadModal.hide();
      // refresh page to show new resources (you requested refresh on success)
      window.location.reload();
    } catch (err) {
      console.error(err);
      showToast("Network error during upload", "danger");
    }
  });
}

const pdfBtn = document.getElementById("downloadPdfBtn");

if (pdfBtn) {
  pdfBtn.addEventListener("click", () => {
    const match = window.location.pathname.match(/\/events\/(\d+)/);
    if (!match) return;

    const eventId = match[1];
    window.open(`/events/${eventId}/pdf`, "_blank");
  });
}
