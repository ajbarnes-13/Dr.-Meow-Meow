import pool from '../SQLdb/db-connection.mjs';

const VET_SELECT = `
    SELECT vet.vet_id, vet.vet_name, vet.office_name_id, vet_office.office_name,
           vet_office.office_address, vet_office.address_2, vet_office.city, vet_office.office_state, vet_office.zip_code,
           vet.phone_number, vet.website
    FROM vet
    JOIN vet_office ON vet.office_name_id = vet_office.vet_office_id`;

async function findVet(ownerUid, filters = {}) {
    let query = `${VET_SELECT} WHERE vet_office.owner_uid = ?`;
    const values = [ownerUid];

    if (filters.vet_name) {
        query += ' AND vet.vet_name LIKE ?';
        values.push(`%${filters.vet_name}%`);
    }

    if (filters.pet_id) {
        query += ' AND vet.pet_id = ?';
        values.push(filters.pet_id);
    }

    if (filters.office) {
        query += ' AND vet_office.office_name LIKE ?';
        values.push(`%${filters.office}%`);
    }

    if (filters.city) {
        query += ' AND vet_office.city LIKE ?';
        values.push(`%${filters.city}%`);
    }

    if (filters.office_state) {
        query += ' AND vet_office.office_state LIKE ?';
        values.push(`%${filters.office_state}%`);
    }

    if (filters.zip_code) {
        query += ' AND vet_office.zip_code LIKE ?';
        values.push(`%${filters.zip_code}%`);
    }

    if (filters.phone_number) {
        query += ' AND vet.phone_number LIKE ?';
        values.push(`%${filters.phone_number}%`);
    }

    const [rows] = await pool.query(query, values);
    return rows;
}

async function findVetById(id, ownerUid) {
    const query = `${VET_SELECT} WHERE vet.vet_id = ? AND vet_office.owner_uid = ?`;
    const [rows] = await pool.query(query, [id, ownerUid]);
    return rows;
}

async function updateVet(id, ownerUid, vet_name, office_name_id, phone_number, website) {
    const query = 'UPDATE vet SET vet_name = ?, office_name_id = ?, phone_number = ?, website = ? WHERE vet_id = ? AND office_name_id IN (SELECT vet_office_id FROM vet_office WHERE owner_uid = ?)';
    const values = [vet_name, office_name_id, phone_number, website, id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function deleteVet(id, ownerUid) {
    const query = 'DELETE FROM vet WHERE vet_id = ? AND office_name_id IN (SELECT vet_office_id FROM vet_office WHERE owner_uid = ?)';
    const values = [id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function createVet(ownerUid, vet_name, office_name_id, phone_number, website) {
    const query = 'INSERT INTO vet SET ?';
    const values = [{vet_name, office_name_id, phone_number, website}];
    const [result] = await pool.query(query, values);
    const rows = await findVetById(result.insertId, ownerUid);
    return rows[0];
}

export {findVet, findVetById, updateVet, deleteVet, createVet}
