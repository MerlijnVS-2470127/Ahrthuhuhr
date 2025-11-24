import { db } from "./db.js";

function isTableEmpty(tableName) {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
  return row.count === 0;
}

export function seedExampleData() {
  const now = Date.now();

  // ---------------------------
  // USERS
  // ---------------------------
  if (isTableEmpty("users")) {
    const exampleUsers = [
      { email: "admin", username: "admin", password: "admin", last_login: now },
      {
        email: "john@example.com",
        username: "John Doe",
        password: "password1",
        last_login: now,
      },
      {
        email: "gerben@example.com",
        username: "Gerben Geurts",
        password: "password2",
        last_login: now,
      },
      {
        email: "merlijn@example.com",
        username: "Merlijn van Suetendael",
        password: "password3",
        last_login: now,
      },
      {
        email: "kitty@example.com",
        username: "Kitty2610",
        password: "password4",
        last_login: now,
      },
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (email, username, password, last_login)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction((users) => {
      users.forEach((u) =>
        insertUser.run(u.email, u.username, u.password, u.last_login)
      );
    });

    insertMany(exampleUsers);
    console.log("Inserted example users.");
  }

  // ---------------------------
  // GROUPS
  // ---------------------------
  if (isTableEmpty("groups")) {
    // Fetch user IDs for owner data
    const users = db
      .prepare("SELECT id, username FROM users ORDER BY id")
      .all();

    const exampleGroups = [
      {
        owner_id: users[0].id,
        name: "Test Group",
        description: "A test group",
      },
      {
        owner_id: users[1].id,
        name: "New York trip",
        description: "Planning for NYC",
      },
      {
        owner_id: users[2].id,
        name: "Uitstap Hasselt",
        description: "Daguitstap naar Hasselt",
      },
    ];

    const insertGroup = db.prepare(`
      INSERT INTO groups (owner_id, name, description)
      VALUES (?, ?, ?)
    `);

    const insertMany = db.transaction((groups) => {
      groups.forEach((g) => insertGroup.run(g.owner_id, g.name, g.description));
    });

    insertMany(exampleGroups);
    console.log("Inserted example groups.");
  }

  // ---------------------------
  // GROUP USERS
  // ---------------------------
  if (isTableEmpty("groupusers")) {
    const users = db.prepare("SELECT * FROM users ORDER BY id").all();
    const groups = db.prepare("SELECT * FROM groups ORDER BY id").all();

    const exampleGroupUsers = [
      { group_id: groups[0].id, user_id: users[0].id, role: "owner" },
      { group_id: groups[0].id, user_id: users[1].id, role: "member" },
      { group_id: groups[1].id, user_id: users[1].id, role: "owner" },
      { group_id: groups[1].id, user_id: users[2].id, role: "member" },
      { group_id: groups[1].id, user_id: users[3].id, role: "member" },
      { group_id: groups[2].id, user_id: users[2].id, role: "owner" },
      { group_id: groups[2].id, user_id: users[0].id, role: "member" },
    ];

    const insertGroupUser = db.prepare(`
      INSERT INTO groupusers (group_id, user_id, role)
      VALUES (?, ?, ?)
    `);

    const insertMany = db.transaction((groupusers) => {
      groupusers.forEach((g) =>
        insertGroupUser.run(g.group_id, g.user_id, g.role)
      );
    });

    insertMany(exampleGroupUsers);
    console.log("Inserted example group users.");
  }

  // ---------------------------
  // EVENTS
  // ---------------------------
  if (isTableEmpty("events")) {
    const users = db.prepare("SELECT id FROM users ORDER BY id").all();
    const groups = db.prepare("SELECT id FROM groups ORDER BY id").all();

    const cpStart = Date.UTC(2025, 5, 1, 12, 0);
    const cpEnd = Date.UTC(2025, 5, 1, 15, 0);

    const exampleEvents = [
      {
        creator_id: users[1].id,
        group_id: groups[1].id,
        title: "Central Park picknick",
        description: "Bring food and blankets.",
        start_time: cpStart,
        end_time: cpEnd,
        status: "planned",
        location: "The Great Lawn, Central Park, Manhattan, NY",
        location_lat: 40.785091,
        location_lng: -73.968285,
      },
      {
        creator_id: users[0].id,
        group_id: groups[0].id,
        title: "Test Group meetup",
        description: "Short meetup to test the app.",
        start_time: Date.UTC(2025, 6, 10, 18, 0),
        end_time: Date.UTC(2025, 6, 10, 20, 0),
        status: "planned",
        location: "Community Center, Test City",
        location_lat: null,
        location_lng: null,
      },
      {
        creator_id: users[2].id,
        group_id: groups[2].id,
        title: "Hasselt uitstap lunch",
        description: "Lunch in Hasselt followed by a walk.",
        start_time: Date.UTC(2025, 7, 5, 11, 30),
        end_time: Date.UTC(2025, 7, 5, 14, 0),
        status: "planned",
        location: "Dusartplein Hasselt, Hasselt, BE",
        location_lat: 50.9327603,
        location_lng: 5.3429212,
      },
    ];

    const insertEvent = db.prepare(`
      INSERT INTO events (creator_id, group_id, title, description, start_time, end_time, status, location, location_lat, location_lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((events) => {
      events.forEach((e) =>
        insertEvent.run(
          e.creator_id,
          e.group_id,
          e.title,
          e.description,
          e.start_time,
          e.end_time,
          e.status,
          e.location,
          e.location_lat,
          e.location_lng
        )
      );
    });

    insertMany(exampleEvents);
    console.log("Inserted example events.");
  }

  // ---------------------------
  // EVENT USERS
  // ---------------------------
  if (isTableEmpty("eventusers")) {
    const event = db.prepare("SELECT * FROM events LIMIT 1").get();
    const users = db.prepare("SELECT * FROM users ORDER BY id").all();

    const exampleEventUsers = [
      { event_id: event.id, user_id: users[1].id, status: "going" },
      { event_id: event.id, user_id: users[2].id, status: "interested" },
      { event_id: event.id, user_id: users[3].id, status: "declined" },
    ];

    const insertEventUser = db.prepare(`
      INSERT INTO eventusers (event_id, user_id, status)
      VALUES (?, ?, ?)
    `);

    const insertMany = db.transaction((userEvents) => {
      userEvents.forEach((eu) =>
        insertEventUser.run(eu.event_id, eu.user_id, eu.status)
      );
    });

    insertMany(exampleEventUsers);
    console.log("Inserted example event users.");
  }

  // ---------------------------
  // MESSAGES
  // ---------------------------
  if (isTableEmpty("messages")) {
    const groups = db.prepare("SELECT id FROM groups ORDER BY id").all();

    const exampleMessages = [
      {
        group_id: groups[1].id,
        user_name: "Gerben Geurts",
        content: "Who will bring plates?",
      },
      {
        group_id: groups[1].id,
        user_name: "Merlijn van Suetendael",
        content: "I can take blankets!",
      },
      {
        group_id: groups[1].id,
        user_name: "Kitty2610",
        content: "I will bring drinks.",
      },
    ];

    const insertMessage = db.prepare(`
      INSERT INTO messages (group_id, user_name, content, created_at)
      VALUES (?, ?, ?, ?)
    `);

    const insertMany = db.transaction((messages) => {
      messages.forEach((m) =>
        insertMessage.run(m.group_id, m.user_name, m.content, now)
      );
    });

    insertMany(exampleMessages);
    console.log("Inserted example messages.");
  }

  console.log("Seeding complete.");
}
