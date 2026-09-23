import pool from '../SQLdb/db-connection.mjs';

const APPOINTMENT_SELECT = `
    SELECT appointment.appointment_id, appointment.pet_id, pet.pet_name,
       appointment.vet_id, vet.vet_name,
       appointment.office_name_id, vet_office.office_name,
       vet_office.office_address, vet_office.address_2, vet_office.city, vet_office.office_state, vet_office.zip_code,
       vet.phone_number, vet.website,
       appointment.reason, appointment.appointment_date, appointment.appointment_time, appointment.summary
FROM appointment
JOIN pet ON appointment.pet_id = pet.pet_id
JOIN vet ON appointment.vet_id = vet.vet_id
JOIN vet_office ON appointment.office_name_id = vet_office.vet_office_id`

async function findAppointment(ownerUid, filters = {}) {
    let query = `${APPOINTMENT_SELECT} WHERE pet.owner_uid = ?`;
    const values = [ownerUid];

    if (filters.pet) {
        query += ' AND pet.pet_name LIKE ?'; // the ? prevents a malicious user from changing my code. it tells SQL to treat the inputs non-code
        values.push(`%${filters.pet}%`); // this means user input
    }

    if (filters.pet_id) {
        query += ' AND appointment.pet_id = ?';
        values.push(filters.pet_id);
    }

    if (filters.vet) {
        query += ' AND vet.vet_name LIKE ?';
        values.push(`%${filters.vet}%`);
    }

    if (filters.office) {
        query += ' AND vet_office.office_name LIKE ?';
        values.push(`%${filters.office}%`);
    }

    if (filters.reason) {
        query += ' AND appointment.reason LIKE ?';
        values.push(`%${filters.reason}%`);
    }

    // Search appintment date by month, date, year
    if (filters.month) {
        query += ' AND MONTHNAME(appointment.appointment_date) LIKE ?';
        values.push(`%${filters.month}%`);
    }

    if (filters.day) {
        query += ' AND DAY(appointment.appointment_date) = ?';
        values.push(filters.day);
    }

    if (filters.year) {
        query += ' AND YEAR(appointment.appointment_date) = ?';
        values.push(filters.year);
    }

    if (filters.appointment_time) {
        query += ' AND appointment.appointment_time LIKE ?';
        values.push(`%${filters.appointment_time}%`);
    }

    if (filters.summary) {
        query += ' AND appointment.summary LIKE ?';
        values.push(`%${filters.summary}%`);
    }

    const [rows] = await pool.query(query, values);
    return rows;
}

async function findAppointmentById(id, ownerUid) {
    const query = `${APPOINTMENT_SELECT} WHERE appointment.appointment_id = ? AND pet.owner_uid = ?`;
    const [rows] = await pool.query(query, [id, ownerUid]);
    return rows;
}

async function updateAppointment(id, ownerUid, pet_id, vet_id, office_name_id, reason, appointment_date, appointment_time, summary) {
    const query = 'UPDATE appointment SET pet_id = ?, vet_id = ?, office_name_id = ?, reason = ?, appointment_date = ?, appointment_time = ?, summary = ? WHERE appointment_id = ? AND pet_id IN (SELECT pet_id FROM pet WHERE owner_uid = ?)';
    const values = [pet_id, vet_id, office_name_id, reason, appointment_date, appointment_time, summary, id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function deleteAppointment(id, ownerUid) {
    const query = 'DELETE FROM appointment WHERE appointment_id = ? AND pet_id IN (SELECT pet_id FROM pet WHERE owner_uid = ?)';
    const values = [id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function createAppointment(ownerUid, pet_id, vet_id, office_name_id, reason, appointment_date, appointment_time, summary) {
    const query = 'INSERT INTO appointment SET ?';
    const values = [{pet_id, vet_id, office_name_id, reason, appointment_date, appointment_time, summary}];
    const [result] = await pool.query(query, values);
    const rows = await findAppointmentById(result.insertId, ownerUid);
    return rows[0];
}

export {findAppointment, findAppointmentById, updateAppointment, deleteAppointment, createAppointment}
