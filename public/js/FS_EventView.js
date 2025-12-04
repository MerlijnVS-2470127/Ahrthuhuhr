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
});
