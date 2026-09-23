import pool from '../SQLdb/db-connection.mjs';

const VET_OFFICE_SELECT = `
    SELECT vet_office.vet_office_id, vet_office.office_name, vet_office.office_address, vet_office.address_2, vet_office.city, vet_office.office_state, vet_office.zip_code
    FROM vet_office`;

async function findVetOffice(ownerUid, filters = {}) {
    let query = `${VET_OFFICE_SELECT} WHERE vet_office.owner_uid = ?`;
    const values = [ownerUid];

    if (filters.office_name) {
        query += ' AND vet_office.office_name LIKE ?';
        values.push(`%${filters.office_name}%`);
    }

    const [rows] = await pool.query(query, values);
    return rows;
}

async function findVetOfficeById(id, ownerUid) {
    const query = `${VET_OFFICE_SELECT} WHERE vet_office.vet_office_id = ? AND vet_office.owner_uid = ?`;
    const [rows] = await pool.query(query, [id, ownerUid]);
    return rows;
}

async function updateVetOffice(id, ownerUid, office_name, office_address, address_2, city, office_state, zip_code) {
    const query = 'UPDATE vet_office SET office_name = ?, office_address = ?, address_2 = ?, city = ?, office_state = ?, zip_code = ? WHERE vet_office_id = ? AND owner_uid = ?';
    const values = [office_name, office_address ?? null, address_2 ?? null, city ?? null, office_state ?? null, zip_code ?? null, id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function deleteVetOffice(id, ownerUid) {
    const query = 'DELETE FROM vet_office WHERE vet_office_id = ? AND owner_uid = ?';
    const values = [id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function createVetOffice(ownerUid, office_name, office_address, address_2, city, office_state, zip_code) {
    const query = 'INSERT INTO vet_office SET ?';
    const values = [{
        owner_uid: ownerUid,
        office_name,
        office_address: office_address ?? null,
        address_2: address_2 ?? null,
        city: city ?? null,
        office_state: office_state ?? null,
        zip_code: zip_code ?? null,
    }];
    const [result] = await pool.query(query, values);
    const rows = await findVetOfficeById(result.insertId, ownerUid);
    return rows[0];
}

// Used by vetsModel to confirm an office named in a vet request actually
// belongs to the caller before a vet gets created/updated to link to it.
async function isOfficeOwner(officeId, ownerUid) {
    const [rows] = await pool.query('SELECT 1 FROM vet_office WHERE vet_office_id = ? AND owner_uid = ? LIMIT 1', [officeId, ownerUid]);
    return rows.length > 0;
}

export {findVetOffice, findVetOfficeById, updateVetOffice, deleteVetOffice, createVetOffice, isOfficeOwner}
