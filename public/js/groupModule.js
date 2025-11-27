//--------------------------------------------//
// Module for retrieving data used for groups //
//--------------------------------------------//
"use strict";

export function getGroupData(db, email, dataType) {

    const users = db
    .prepare(`SELECT id FROM users WHERE email = ?`)
    .all(email);

    let groups;

    let groupIDs = db
    .prepare(`SELECT groupusers.group_id FROM groupusers WHERE user_id = ?`)
    .all(users[0].id);

    let groupData = [];

    for (let i = 0; i < groupIDs.length; i++) {
        groups = db
        .prepare(`SELECT id, name FROM groups WHERE id = ?`)
        .all(groupIDs[i].group_id);

        if (dataType === "id") {
            groupData.push(groups[0].id);
        }
        else{
            groupData.push(groups[0].name);
        }

        groups = "";
    }

    return groupData;
}