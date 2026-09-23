import pool from '../SQLdb/db-connection.mjs';

const CONDITION_SELECT = `
    SELECT health_condition.condition_id, health_condition.\`condition\`, pet.pet_id, health_condition.date_diagnosed, vet.vet_id, vet.vet_name AS vet_diagnosed_by, health_condition.treatment
    FROM health_condition
    JOIN pet ON health_condition.pet_id = pet.pet_id
    JOIN vet ON health_condition.vet_diagnosed_by_id = vet.vet_id`;

async function findCondition(ownerUid, filters = {}) {
    let query = `${CONDITION_SELECT} WHERE pet.owner_uid = ?`;
    const values = [ownerUid];

    if (filters.condition) {
        query += ' AND health_condition.`condition` LIKE ?';
        values.push(`%${filters.condition}%`);
    }

    if (filters.pet_id) {
        query += ' AND health_condition.pet_id = ?';
        values.push(filters.pet_id);
    }

    // Search date_diagnosed by month, day, year
    if (filters.month) {
        query += ' AND MONTHNAME(health_condition.date_diagnosed) LIKE ?';
        values.push(`%${filters.month}%`);
    }

    if (filters.day) {
        query += ' AND DAY(health_condition.date_diagnosed) LIKE ?';
        values.push(`%${filters.date_diagnosed}%`);
    }

    if (filters.year) {
        query += ' AND YEAR(health_condition.date_diagnosed) LIKE ?';
        values.push(`%${filters.year}%`);
    }

    if (filters.treatment) {
        query += ' AND health_condition.treatment LIKE ?';
        values.push(`%${filters.treatment}%`);
    }

    const [rows] = await pool.query(query, values);
    return rows;
}

async function findConditionById(id, ownerUid) {
    const query = `${CONDITION_SELECT} WHERE health_condition.condition_id = ? AND pet.owner_uid = ?`;
    const [rows] = await pool.query(query, [id, ownerUid]);
    return rows;
}

async function updateCondition(id, ownerUid, condition, pet_id, date_diagnosed, vet_diagnosed_by_id, treatment) {
    const query = 'UPDATE health_condition SET `condition` = ?, pet_id = ?, date_diagnosed = ?, vet_diagnosed_by_id = ?, treatment = ? WHERE condition_id = ? AND pet_id IN (SELECT pet_id FROM pet WHERE owner_uid = ?)';
    const values = [condition, pet_id, date_diagnosed, vet_diagnosed_by_id, treatment, id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function deleteCondition(id, ownerUid) {
    const query = 'DELETE FROM health_condition WHERE condition_id = ? AND pet_id IN (SELECT pet_id FROM pet WHERE owner_uid = ?)';
    const values = [id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function createCondition(ownerUid, condition, pet_id, date_diagnosed, vet_diagnosed_by_id, treatment) {
    const query = 'INSERT INTO health_condition SET ?';
    const values = [{condition, pet_id, date_diagnosed, vet_diagnosed_by_id, treatment}];
    const [result] = await pool.query(query, values);
    const rows = await findConditionById(result.insertId, ownerUid);
    return rows[0];
}

export {findCondition, findConditionById, updateCondition, deleteCondition, createCondition}
