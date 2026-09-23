import pool from '../SQLdb/db-connection.mjs';

const FOOD_SELECT = `
    SELECT food.food_id, food.food_type, food.brand, food.flavor, food.how_often, food.how_much, food.health_consideration, food.date_started, food.date_stopped, pet.pet_id
FROM food
JOIN pet ON food.pet_id = pet.pet_id`;

async function findFood(ownerUid, filters = {}) {
    let query = `${FOOD_SELECT} WHERE pet.owner_uid = ?`;
    const values = [ownerUid];

    if (filters.food_type) {
        query += ' AND food.food_type LIKE ?'; // the ? prevetns a malicious user from changing the meaning of my code. it tells the SQL to treat the input as non-code
        values.push(`%${filters.food_type}%`); // This means user input
    }

    if (filters.pet_id) {
        query += ' AND food.pet_id = ?';
        values.push(filters.pet_id);
    }

    if (filters.brand) {
        query += ' AND food.brand LIKE ?';
        values.push(`%${filters.brand}%`);
    }

    if (filters.flavor) {
        query += ' AND food.flavor LIKE ?';
        values.push(`%${filters.flavor}%`);
    }

    if (filters.how_often) {
        query += ' AND food.how_often LIKE ?';
        values.push(`%${filters.how_often}%`);
    }

    if (filters.how_much) {
        query += ' AND food.how_much LIKE ?';
        values.push(`%${filters.how_much}%`);
    }

    if (filters.health_consideration) {
        query += ' AND food.health_consideration LIKE ?';
        values.push(`%${filters.health_consideration}%`);
    }

    // Search food by start/end date month, day, year
    if (filters.month) {
        query += ' AND MONTHNAME(food.date_started) LIKE ?';
        values.push(`%${filters.month}%`);
    }

    if (filters.day) {
        query += ' AND DAY(food.date_started) LIKE ?';
        values.push(`%${filters.day}%`);
    }

    if (filters.year) {
        query += ' AND YEAR(food.date_started) LIKE ?';
        values.push(`%${filters.year}%`);
    }

    if (filters.month) {
        query += ' AND MONTHNAME(food.date_stopped) LIKE ?';
        values.push(`%${filters.month}%`);
    }

    if (filters.day) {
        query += ' AND DAY(food.date_stopped) LIKE ?';
        values.push(`%${filters.day}%`);
    }

    if (filters.year) {
        query += ' AND YEAR(food.date_stopped) LIKE ?';
        values.push(`%${filters.year}%`);
    }

    const [rows] = await pool.query(query, values);
    return rows;
}

async function findFoodById(id, ownerUid) {
    const query = `${FOOD_SELECT} WHERE food.food_id = ? AND pet.owner_uid = ?`;
    const [rows] = await pool.query(query, [id, ownerUid]);
    return rows;
}

async function updateFood(id, ownerUid, food_type, brand, flavor, how_often, how_much, health_consideration, date_started, date_stopped, pet_id) {
    const query = 'UPDATE food SET food_type = ?, brand = ?, flavor = ?, how_often = ?, how_much = ?, health_consideration = ?, date_started = ?, date_stopped = ?, pet_id = ? WHERE food_id = ? AND pet_id IN (SELECT pet_id FROM pet WHERE owner_uid = ?)';
    // "|| null" so a blank "still feeding this" field becomes SQL NULL instead of an empty string in a DATE column.
    const values = [food_type, brand, flavor, how_often, how_much, health_consideration, date_started, date_stopped || null, pet_id, id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function deleteFood(id, ownerUid) {
    const query = 'DELETE FROM food WHERE food_id = ? AND pet_id IN (SELECT pet_id FROM pet WHERE owner_uid = ?)';
    const values = [id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function createFood(ownerUid, food_type, brand, flavor, how_often, how_much, health_consideration, date_started, date_stopped, pet_id) {
    const query = 'INSERT INTO food SET ?';
    const values = [{food_type, brand, flavor, how_often, how_much, health_consideration, date_started, date_stopped: date_stopped || null, pet_id}];
    const [result] = await pool.query(query, values);
    const rows = await findFoodById(result.insertId, ownerUid);
    return rows[0];
}

export {findFood, findFoodById, updateFood, deleteFood, createFood}
