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
      {
        email: "yara@example.com",
        username: "Yara van HOI",
        password: "password5",
        last_login: now,
      },
      {
        email: "maria@example.com",
        username: "Rob",
        password: "password6",
        last_login: now,
      },
      {
        email: "linux@example.com",
        username: "Michael",
        password: "password7",
        last_login: now,
      },
      {
        email: "rooster@example.com",
        username: "Joost",
        password: "password8",
        last_login: now,
      },
      {
        email: "ranjot@example.com",
        username: "Ronny",
        password: "password9",
        last_login: now,
      },
      {
        email: "vanshpreet@example.com",
        username: "Vansh",
        password: "password10",
        last_login: now,
      },
      {
        email: "lone@wolf.com",
        username: "Lone wolf",
        password: "iamsolonely",
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
        owner_id: users[1].id, //John Doe
        name: "Test Group",
        description: "A test group",
      },
      {
        owner_id: users[1].id, //John Doe
        name: "New York trip",
        description: "Planning for NYC",
      },
      {
        owner_id: users[3].id, //Merlijn
        name: "Uitstap Hasselt",
        description: "Daguitstap naar Hasselt",
      },
      {
        owner_id: users[4].id, //Elric
        name: "Kroegentocht scherpenheuvel (titel extra lang maken met onnodige tekst :D)AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        description:
          "We gaan te voet naar scherpenheuvel, jaja te voet naar scherpenheuvel. En wanneer komen wij daar aan, met al die kroegen langs de baan?AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      },
      {
        owner_id: users[2].id, //Gerben
        name: "Roadtrip Riemst",
        description: "Moak kennis mit ut bürendurp Riems",
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
      //testgroup
      { group_id: groups[0].id, user_id: users[1].id, role: "owner" }, //John
      { group_id: groups[0].id, user_id: users[0].id, role: "admin" }, //admin
      { group_id: groups[0].id, user_id: users[2].id, role: "admin" }, //Gerben
      { group_id: groups[0].id, user_id: users[3].id, role: "admin" }, //Merlijn
      { group_id: groups[0].id, user_id: users[5].id, role: "member" }, //Yara
      { group_id: groups[0].id, user_id: users[9].id, role: "lurker" }, //Ronny

      //new york trip
      { group_id: groups[1].id, user_id: users[1].id, role: "owner" }, //John
      { group_id: groups[1].id, user_id: users[0].id, role: "admin" }, //admin
      { group_id: groups[1].id, user_id: users[2].id, role: "member" }, //Gerben
      { group_id: groups[1].id, user_id: users[3].id, role: "member" }, //Merlijn
      { group_id: groups[1].id, user_id: users[5].id, role: "lurker" }, //Yara

      //uitstap hasselt
      { group_id: groups[2].id, user_id: users[3].id, role: "owner" }, //Merlijn
      { group_id: groups[2].id, user_id: users[0].id, role: "admin" }, //admin
      { group_id: groups[2].id, user_id: users[9].id, role: "admin" }, //Ronny
      { group_id: groups[2].id, user_id: users[10].id, role: "admin" }, //Vansh
      { group_id: groups[2].id, user_id: users[2].id, role: "member" }, //Gerben
      { group_id: groups[2].id, user_id: users[4].id, role: "member" }, //Elric
      { group_id: groups[2].id, user_id: users[5].id, role: "member" }, //Yara
      { group_id: groups[2].id, user_id: users[6].id, role: "member" }, //Rob
      { group_id: groups[2].id, user_id: users[7].id, role: "member" }, //Michael
      { group_id: groups[2].id, user_id: users[8].id, role: "member" }, //Joost
      { group_id: groups[2].id, user_id: users[1].id, role: "lurker" }, //John

      //kroegentocht scherpenheuvel
      { group_id: groups[3].id, user_id: users[4].id, role: "owner" }, //Elric
      { group_id: groups[3].id, user_id: users[0].id, role: "admin" }, //admin
      { group_id: groups[3].id, user_id: users[2].id, role: "admin" }, //Gerben
      { group_id: groups[3].id, user_id: users[3].id, role: "member" }, //Merlijn
      { group_id: groups[3].id, user_id: users[7].id, role: "member" }, //Michael
      { group_id: groups[3].id, user_id: users[8].id, role: "member" }, //Joost
      { group_id: groups[3].id, user_id: users[6].id, role: "lurker" }, //Rob
      { group_id: groups[3].id, user_id: users[10].id, role: "lurker" }, //Vansh

      //roadtrip riemst
      { group_id: groups[4].id, user_id: users[2].id, role: "owner" }, //Gerben
      { group_id: groups[4].id, user_id: users[0].id, role: "admin" }, //admin
      { group_id: groups[4].id, user_id: users[3].id, role: "admin" }, //Merlijn
      { group_id: groups[4].id, user_id: users[6].id, role: "admin" }, //Rob
      { group_id: groups[4].id, user_id: users[4].id, role: "member" }, //Elric
      { group_id: groups[4].id, user_id: users[7].id, role: "member" }, //Michael
      { group_id: groups[4].id, user_id: users[8].id, role: "member" }, //Joost
      { group_id: groups[4].id, user_id: users[9].id, role: "member" }, //Ronny
      { group_id: groups[4].id, user_id: users[10].id, role: "member" }, //Vansh
      { group_id: groups[4].id, user_id: users[1].id, role: "lurker" }, //John
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

    const oneHour = 1000 * 60 * 60;
    const oneDay = 24 * oneHour;

    const exampleEvents = [
      //testgroup
      {
        creator_id: users[1].id, //John
        group_id: groups[0].id,
        title: "Test Group meetup",
        description: "Short meetup to test the app.",
        start_time: now,
        end_time: now + oneHour * 2,
        status: "planned",
        location: "Community Center, Test City",
        location_lat: null,
        location_lng: null,
      },
      {
        creator_id: users[2].id, //Gerben
        group_id: groups[0].id,
        title: "Event in the very distant future",
        description: "Guys I don't think this will ever take place",
        start_time: now + oneDay * 100,
        end_time: now + oneDay * 101,
        status: "planned",
        location: "Community Center, Test City",
        location_lat: null,
        location_lng: null,
      },
      {
        creator_id: users[3].id, //Merlijn
        group_id: groups[0].id,
        title: "Event in the very distant past",
        description: "Guys I can't even remember this happening",
        start_time: now - oneDay * 100,
        end_time: now - oneDay * 29,
        status: "planned",
        location: "Community Center, Test City",
        location_lat: null,
        location_lng: null,
      },

      //new york trip
      {
        creator_id: users[1].id, //John
        group_id: groups[1].id,
        title: "Central Park picknick",
        description: "Bring food and blankets.",
        start_time: now,
        end_time: now + oneDay,
        status: "planned",
        location: "The Great Lawn, Central Park, Manhattan, NY",
        location_lat: 40.785091,
        location_lng: -73.968285,
      },
      {
        creator_id: users[2].id, //Gerben
        group_id: groups[1].id,
        title: "Guys we should eat here",
        description: "Jamaican blessing",
        start_time: now,
        end_time: now + oneHour,
        status: "planned",
        location: "Jamaica Breeze",
        location_lat: 40.7611692,
        location_lng: -73.8662092,
      },

      //uitstap hasselt
      {
        creator_id: users[3].id, //Merlijn
        group_id: groups[2].id,
        title: "Hasselt uitstap lunch",
        description: "Lunch in Hasselt followed by a walk.",
        start_time: now,
        end_time: now + oneDay,
        status: "planned",
        location: "Dusartplein Hasselt, Hasselt, BE",
        location_lat: 50.9327603,
        location_lng: 5.3429212,
      },
      {
        creator_id: users[2].id, //Gerben
        group_id: groups[2].id,
        title: "Friet in Rooierheide",
        description:
          "Dit is een heeeeeeeeeeeeeeeeel lange beschrijving om de voorstelling in de eventview uit te testen. Wist je dat de Michelin sterren uitgevonden zijn door het bedrijf dat de banden maakt van dezelfde naam? Ze gaven meer sterren aan restaurants buiten de stad zodat men meer heen en weer reed en ze sneller nieuwe banden moesten kopen. Crazy!",
        start_time: now,
        end_time: now + oneHour,
        status: "planned",
        location: "Frituur Passerel",
        location_lat: 50.9369045,
        location_lng: 5.4185441,
      },

      //kroegentocht scherpenheuvel
      {
        creator_id: users[4].id, //Elric
        group_id: groups[3].id,
        title: "Te voet naar scherpenheuvel",
        description:
          "En wanneer komen wij daar aan, met al die kroegen langs de baan?",
        start_time: now,
        end_time: now + oneDay * 10,
        status: "planned",
        location: "Basiliek scherpenheuvel",
        location_lat: null,
        location_lng: null,
      },

      //roadtrip riemst
      {
        creator_id: users[2].id, //Gerben
        group_id: groups[4].id,
        title: "Riemsters drupke",
        description: "Bokke laaie met de manne",
        start_time: now,
        end_time: now + oneHour * 8,
        status: "planned",
        location: "Barry's sportbar",
        location_lat: null,
        location_lng: null,
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
    const users = db.prepare("SELECT id FROM users ORDER BY id").all();
    const events = db.prepare("SELECT id FROM events ORDER BY id").all();

    const exampleEventUsers = [
      //test group meetup
      { event_id: events[0].id, user_id: users[1].id, status: "going" }, //John
      { event_id: events[0].id, user_id: users[2].id, status: "interested" }, //Gerben
      { event_id: events[0].id, user_id: users[9].id, status: "declined" }, //Ronny
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
    let floor = Math.floor;

    const exampleMessages = [
      {
        group_id: floor(groups[1].id),
        user_name: "Gerben Geurts",
        content: "Who will bring plates?",
      },
      {
        group_id: floor(groups[1].id),
        user_name: "Merlijn van Suetendael",
        content: "I can take blankets!",
      },
      {
        group_id: floor(groups[1].id),
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

  // ---------------------------
  // POLLS
  // ---------------------------
  if (isTableEmpty("polls")) {
    const users = db
      .prepare("SELECT id, username FROM users ORDER BY id")
      .all();
    const groups = db.prepare("SELECT id, name FROM groups ORDER BY id").all();

    const testGroup = groups.find((g) => g.name === "Test Group");
    const john = users.find((u) => u.username === "John Doe");

    const twoDays = 1000 * 60 * 60 * 24 * 2;

    // create poll
    const pollResult = db
      .prepare(
        `
        INSERT INTO polls (group_id, creator_id, title, allow_multiple, end_time)
        VALUES (?, ?, ?, ?, ?)
      `
      )
      .run(
        testGroup.id,
        john.id,
        "Where should we eat?",
        0, // single choice
        now + twoDays
      );

    const pollId = pollResult.lastInsertRowid;

    // create poll options
    const insertOption = db.prepare(
      `
      INSERT INTO poll_options (poll_id, title, description)
      VALUES (?, ?, ?)
    `
    );

    const optionResults = [
      insertOption.run(pollId, "Pizza", "Italian classics"),
      insertOption.run(pollId, "Burgers", "Greasy & good"),
      insertOption.run(pollId, "Sushi", "Fresh fish"),
    ];

    const optionIds = optionResults.map((r) => r.lastInsertRowid);

    // voters: exclude John (creator) and lurkers
    const eligibleVoters = db
      .prepare(
        `
        SELECT u.id
        FROM users u
        JOIN groupusers gu ON gu.user_id = u.id
        WHERE gu.group_id = ?
          AND gu.role != 'lurker'
          AND u.id != ?
      `
      )
      .all(testGroup.id, john.id)
      .map((u) => u.id);

    const insertVote = db.prepare(
      `
      INSERT INTO poll_votes (poll_id, poll_option_id, user_id)
      VALUES (?, ?, ?)
    `
    );

    // distribute votes:
    // option 1 -> 1 vote
    // option 2 -> 2 votes
    // option 3 -> 3 votes
    let voterIndex = 0;

    optionIds.forEach((optionId, optionIndex) => {
      const votesForThisOption = optionIndex + 1;
      for (let i = 0; i < votesForThisOption; i++) {
        if (voterIndex >= eligibleVoters.length) break;
        insertVote.run(pollId, optionId, eligibleVoters[voterIndex]);
        voterIndex++;
      }
    });

    console.log("Inserted example poll for Test Group.");

    // ---------------------------
    // MULTIPLE CHOICE POLL (EXAMPLE)
    // ---------------------------

    // create multiple-choice poll
    const multiPollResult = db
      .prepare(
        `
    INSERT INTO polls (group_id, creator_id, title, allow_multiple, end_time)
    VALUES (?, ?, ?, ?, ?)
  `
      )
      .run(
        testGroup.id,
        john.id,
        "Multiple choice",
        1, // multiple choice
        now + twoDays
      );

    const multiPollId = multiPollResult.lastInsertRowid;

    // poll options
    const insertMultiOption = db.prepare(
      `
  INSERT INTO poll_options (poll_id, title, description)
  VALUES (?, ?, ?)
`
    );

    const multiOptionResults = [
      insertMultiOption.run(multiPollId, "Bowling", "Fun & competitive"),
      insertMultiOption.run(multiPollId, "Escape Room", "Brains required"),
      insertMultiOption.run(multiPollId, "Movie Night", "Relaxing"),
      insertMultiOption.run(multiPollId, "Board Games", "Casual fun"),
    ];

    const multiOptionIds = multiOptionResults.map((r) => r.lastInsertRowid);

    // eligible voters: exactly 5 non-lurkers (excluding John)
    const multiVoters = db
      .prepare(
        `
    SELECT u.id
    FROM users u
    JOIN groupusers gu ON gu.user_id = u.id
    WHERE gu.group_id = ?
      AND gu.role != 'lurker'
      AND u.id != ?
    LIMIT 5
  `
      )
      .all(testGroup.id, john.id)
      .map((u) => u.id);

    // insert votes (each user picks 2 options)
    const insertMultiVote = db.prepare(
      `
  INSERT INTO poll_votes (poll_id, poll_option_id, user_id)
  VALUES (?, ?, ?)
`
    );

    multiVoters.forEach((userId, index) => {
      // rotate options so results look realistic
      const firstOption = multiOptionIds[index % multiOptionIds.length];
      const secondOption = multiOptionIds[(index + 1) % multiOptionIds.length];

      insertMultiVote.run(multiPollId, firstOption, userId);
      insertMultiVote.run(multiPollId, secondOption, userId);
    });

    console.log("Inserted example multiple-choice poll for Test Group.");
  }

  console.log("Seeding complete.");
}
