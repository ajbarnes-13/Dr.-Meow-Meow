import pool from '../SQLdb/db-connection.mjs';

const BEHAVIOR_SELECT = `
    SELECT behavior.behavior_id, pet.pet_id, behavior.behavior, behavior.date_started, behavior.frequency, behavior.total_occurrences, behavior.date_stopped
FROM behavior
JOIN pet ON behavior.pet_id = pet.pet_id`;

async function findBehavior(ownerUid, filters = {}) {
    let query = `${BEHAVIOR_SELECT} WHERE pet.owner_uid = ?`;
    const values = [ownerUid];

    if (filters.behavior) {
        query += ' AND behavior.behavior LIKE ?'; // the ? prevents a malicious user from changing the meaning of my code -- it tells the SQL to treat the inputs as non-code
        values.push(`%${filters.behavior}%`); // this means user input
    }

    if (filters.pet) {
        query += ' AND pet.pet_name LIKE ?';
        values.push(`%${filters.pet}%`);
    }

    if (filters.pet_id) {
        query += ' AND behavior.pet_id = ?';
        values.push(filters.pet_id);
    }

    // Search behavior start date by month, date, year
    if (filters.month) {
        query += ' AND MONTHNAME(behavior.date_started) LIKE ?';
        values.push(`%${filters.month}%`);
    }

    if (filters.day) {
        query += ' AND DAY(behavior.date_started) = ?';
        values.push(filters.day);
    }

    if (filters.year) {
        query += ' AND YEAR(behavior.date_started) = ?';
        values.push(filters.year);
    }

    if (filters.frequency) {
        query += ' AND behavior.frequency LIKE ?';
        values.push(`%${filters.frequency}%`);
    }

    if (filters.total_occurrences) {
        query += ' AND behavior.total_occurrences LIKE ?';
        values.push(`%${filters.total_occurrences}%`);
    }

    const [rows] = await pool.query(query, values);
    return rows;
}

async function findBehaviorById(id, ownerUid) {
    const query = `${BEHAVIOR_SELECT} WHERE behavior.behavior_id = ? AND pet.owner_uid = ?`;
    const [rows] = await pool.query(query, [id, ownerUid]);
    return rows;
}

async function updateBehavior(id, ownerUid, pet_id, behavior, date_started, frequency, total_occurrences, date_stopped) {
    const query = 'UPDATE behavior SET pet_id = ?, behavior = ?, date_started = ?, frequency = ?, total_occurrences = ?, date_stopped = ? WHERE behavior_id = ? AND pet_id IN (SELECT pet_id FROM pet WHERE owner_uid = ?)';
    // "|| null" (not "?? null") so an empty string from a cleared date field
    // becomes SQL NULL too, instead of trying to insert "" into a DATE column.
    const values = [pet_id, behavior, date_started, frequency, total_occurrences, date_stopped || null, id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function deleteBehavior(id, ownerUid) {
    const query = 'DELETE FROM behavior WHERE behavior_id = ? AND pet_id IN (SELECT pet_id FROM pet WHERE owner_uid = ?)';
    const values = [id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function createBehavior(ownerUid, pet_id, behavior, date_started, frequency, total_occurrences, date_stopped) {
    const query = 'INSERT INTO behavior SET ?';
    const values = [{pet_id, behavior, date_started, frequency, total_occurrences, date_stopped: date_stopped || null}];
    const [result] = await pool.query(query, values);
    const rows = await findBehaviorById(result.insertId, ownerUid);
    return rows[0];
}

export {findBehavior, findBehaviorById, updateBehavior, deleteBehavior, createBehavior}
