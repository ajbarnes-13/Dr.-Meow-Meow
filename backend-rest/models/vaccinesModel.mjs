import pool from '../SQLdb/db-connection.mjs';

const VACCINE_SELECT = `
    SELECT vaccine.vaccine_id, vaccine.pet_id, pet.pet_name, vaccine.vaccine_name, vaccine.date_given, vaccine.next_due_date, vaccine.vet_id, vet.vet_name
    FROM vaccine
    JOIN pet ON vaccine.pet_id = pet.pet_id
    JOIN vet ON vaccine.vet_id = vet.vet_id`;

async function findVaccine(ownerUid, filters = {}) {
    let query = `${VACCINE_SELECT} WHERE pet.owner_uid = ?`;
    const values = [ownerUid];

    if (filters.pet) {
        query += ' AND pet.pet_name LIKE ?';
        values.push(`%${filters.pet}%`);
    }

    if (filters.pet_id) {
        query += ' AND vaccine.pet_id = ?';
        values.push(filters.pet_id);
    }

    if (filters.vaccine) {
        query += ' AND vaccine.vaccine_name LIKE ?';
        values.push(`%${filters.vaccine}%`);
    }

    if (filters.vet) {
        query += ' AND vet.vet_name LIKE ?';
        values.push(`%${filters.vet}%`);
    }

    // Search date_given by month, day, year
    if (filters.given_month) {
        query += ' AND MONTHNAME(vaccine.date_given) LIKE ?';
        values.push(`%${filters.given_month}%`);
    }

    if (filters.given_day) {
        query += ' AND DAY(vaccine.date_given) = ?';
        values.push(filters.given_day);
    }

    if (filters.given_year) {
        query += ' AND YEAR(vaccine.date_given) = ?';
        values.push(filters.given_year);
    }

    // Search next_due_date by month, day, year
    if (filters.due_month) {
        query += ' AND MONTHNAME(vaccine.next_due_date) LIKE ?';
        values.push(`%${filters.due_month}%`);
    }

    if (filters.due_day) {
        query += ' AND DAY(vaccine.next_due_date) = ?';
        values.push(filters.due_day);
    }

    if (filters.due_year) {
        query += ' AND YEAR(vaccine.next_due_date) = ?';
        values.push(filters.due_year);
    }

    const [rows] = await pool.query(query, values);
    return rows;
}

async function findVaccineById(id, ownerUid) {
    const query = `${VACCINE_SELECT} WHERE vaccine.vaccine_id = ? AND pet.owner_uid = ?`;
    const [rows] = await pool.query(query, [id, ownerUid]);
    return rows;
}

// The WHERE clause only ever matches a row whose pet already belongs to ownerUid --
// pet_id itself was independently verified against ownerUid by the caller before this runs.
async function updateVaccine(id, ownerUid, pet_id, vaccine_name, date_given, next_due_date, vet_id) {
    const query = 'UPDATE vaccine SET pet_id = ?, vaccine_name = ?, date_given = ?, next_due_date = ?, vet_id = ? WHERE vaccine_id = ? AND pet_id IN (SELECT pet_id FROM pet WHERE owner_uid = ?)';
    const values = [pet_id, vaccine_name, date_given, next_due_date, vet_id, id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function deleteVaccine(id, ownerUid) {
    const query = 'DELETE FROM vaccine WHERE vaccine_id = ? AND pet_id IN (SELECT pet_id FROM pet WHERE owner_uid = ?)';
    const values = [id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function createVaccine(ownerUid, pet_id, vaccine_name, date_given, next_due_date, vet_id) {
    const query = 'INSERT INTO vaccine SET ?';
    const values = [{pet_id, vaccine_name, date_given, next_due_date, vet_id}];
    const [result] = await pool.query(query, values);
    const rows = await findVaccineById(result.insertId, ownerUid);
    return rows[0];
}

export {findVaccine, findVaccineById, updateVaccine, deleteVaccine, createVaccine}
