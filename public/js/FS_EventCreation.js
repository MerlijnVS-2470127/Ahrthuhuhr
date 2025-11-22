(() => {
  const form = document.getElementById('eventCreateForm');
  const findBtn = document.getElementById('findOnMapBtn');

  // pointless button for now
  findBtn.addEventListener('click', () => {
    alert('Find on map is not implemented yet.');
  });

  function parseCoord(v) {
    if (!v && v !== 0) return null;
    const n = Number(String(v).trim());
    return Number.isFinite(n) ? n : NaN;
  }

  function showAlert(text) {
    // simple alert for now — swap for nicer UI if desired
    alert(text);
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();

    // gather values
    const location = document.getElementById('location').value.trim();
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const latRaw = document.getElementById('lat').value.trim();
    const lngRaw = document.getElementById('lng').value.trim();

    // basic required checks
    let invalid = false;
    if (!location) {
      document.getElementById('location').classList.add('is-invalid');
      invalid = true;
    } else {
      document.getElementById('location').classList.remove('is-invalid');
    }
    if (!title) {
      document.getElementById('title').classList.add('is-invalid');
      invalid = true;
    } else {
      document.getElementById('title').classList.remove('is-invalid');
    }
    if (!date) {
      document.getElementById('date').classList.add('is-invalid');
      invalid = true;
    } else {
      document.getElementById('date').classList.remove('is-invalid');
    }
    if (!startTime) {
      document.getElementById('startTime').classList.add('is-invalid');
      invalid = true;
    } else {
      document.getElementById('startTime').classList.remove('is-invalid');
    }

    if (invalid) {
      showAlert('Please fill the required fields.');
      return;
    }

    // date/time combined -> epoch ms (UTC)
    // construct an ISO string like "2025-06-01T12:00:00"
    const startIso = `${date}T${startTime}`;
    const startMs = Date.parse(startIso);
    if (Number.isNaN(startMs)) {
      document.getElementById('date').classList.add('is-invalid');
      showAlert('Invalid start date/time.');
      return;
    }

    // cannot be in the past (compare with now)
    if (startMs < Date.now()) {
      document.getElementById('date').classList.add('is-invalid');
      showAlert('Start date/time cannot be in the past.');
      return;
    }

    let endMs = null;
    if (endTime) {
      const endIso = `${date}T${endTime}`;
      endMs = Date.parse(endIso);
      if (Number.isNaN(endMs)) {
        document.getElementById('endTime').classList.add('is-invalid');
        showAlert('Invalid end time.');
        return;
      }
      // optional: ensure end is after start
      if (endMs <= startMs) {
        document.getElementById('endTime').classList.add('is-invalid');
        showAlert('End time must be after start time.');
        return;
      }
    }

    // lat/lng rule: both empty => fine; one filled => error; both filled => validate numeric range
    const lat = latRaw === '' ? null : parseCoord(latRaw);
    const lng = lngRaw === '' ? null : parseCoord(lngRaw);

    if ((lat === null) !== (lng === null)) {
      showAlert('If you provide coordinates, both latitude AND longitude must be filled.');
      return;
    }
    if (lat !== null) {
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        showAlert('Coordinates are invalid. Latitude must be between -90 and 90. Longitude between -180 and 180.');
        return;
      }
    }

    // final confirmation
    const ok = confirm('Are you sure you want to create this event?');
    if (!ok) return;

    // build payload
    const payload = {
      title,
      description,
      location,
      start_time: startMs,
      end_time: endMs,
      lat: lat,
      lng: lng
    };

    try {
      const res = await fetch('/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'server error' }));
        showAlert('Failed to create event: ' + (err.error || 'server error'));
        return;
      }
      const json = await res.json();
      showAlert('Event created successfully.');
      // redirect to events listing
      window.location.href = '/events';
    } catch (err) {
      console.error(err);
      showAlert('Network error while creating event.');
    }
  });
})();
