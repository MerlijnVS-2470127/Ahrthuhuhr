//--------------------------------------------//
// Module for retrieving data used for groups //
//--------------------------------------------//
"use strict";

export function formatToEncodedString(arr) {
  if (arr.length <= 1) {
    return arr;
  }

  let encodedString = encodeURIComponent(arr[0]);
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] != "") {
      encodedString += "," + encodeURIComponent(arr[i]);
    } else {
      encodedString += ", ";
    }
  }

  return encodedString;
}

export function getGroupData(db, email, dataType) {
  const users = db.prepare(`SELECT id FROM users WHERE email = ?`).all(email);

  console.log(users);

  let groups;

  let groupIDs = db
    .prepare(`SELECT groupusers.group_id FROM groupusers WHERE user_id = ?`)
    .all(users[0].id);

  console.log(groupIDs);

  let groupData = [];

  for (let i = 0; i < groupIDs.length; i++) {
    groups = db
      .prepare(`SELECT id, name, description FROM groups WHERE id = ?`)
      .all(groupIDs[i].group_id);

    if (dataType === "id") {
      groupData.push(groups[0].id);
    } else {
      if (dataType === "name") {
        groupData.push(groups[0].name);
      } else {
        groupData.push(groups[0].description);
      }
    }
  }

  return groupData;
}
