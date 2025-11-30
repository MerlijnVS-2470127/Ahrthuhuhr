import { db } from "../db.js";

function updateStatuses() {
  try {
    const now = Date.now();

    // planned -> happening now (start <= now < end OR end IS NULL)
    const res1 = db
      .prepare(
        `UPDATE events
       SET status = 'happening now'
       WHERE status = 'planned'
         AND start_time <= ?
         AND (end_time IS NULL OR end_time > ?)`
      )
      .run(now, now);

    // planned|happening now -> ended when end_time <= now
    const res2 = db
      .prepare(
        `UPDATE events
       SET status = 'ended'
       WHERE status IN ('planned', 'happening now')
         AND end_time IS NOT NULL
         AND end_time <= ?`
      )
      .run(now);

    // Optionally log if changes happened
    if (res1.changes || res2.changes) {
      console.info(
        `[eventStatusChecker] updated statuses: planned->happening=${
          res1.changes
        }, ->ended=${res2.changes} @ ${new Date(now).toISOString()}`
      );
    }
  } catch (err) {
    console.error("eventStatusChecker error", err);
  }
}

// run once immediately, then every 60s
updateStatuses();
setInterval(updateStatuses, 60_000);

export { updateStatuses };
