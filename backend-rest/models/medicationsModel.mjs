import pool from '../SQLdb/db-connection.mjs';

const MEDICATION_SELECT = `
SELECT medication.medication_id, medication.medication_name, medication.pet_id, medication.reason, medication.date_prescribed, medication.date_stopped, medication.dosage, medication.time_to_take, medication.times_per_day, medication.with_food, medication.next_dose_due, medication.vet_prescribed_by_id, vet.vet_name AS vet_prescribed_by
FROM medication
JOIN pet ON medication.pet_id = pet.pet_id
JOIN vet ON medication.vet_prescribed_by_id = vet.vet_id`;

async function findMedication(ownerUid, filters = {}) {
    let query = `${MEDICATION_SELECT} WHERE pet.owner_uid = ?`;
    const values = [ownerUid];

    if (filters.medication) {
        query += ' AND medication.medication_name LIKE ?';
        values.push(`%${filters.medication}%`);
    }

    if (filters.pet_id) {
        query += ' AND medication.pet_id = ?';
        values.push(filters.pet_id);
    }

    if (filters.reason) {
        query += ' AND medication.reason LIKE ?';
        values.push(`%${filters.reason}%`);
    }

    // Search date_prescribed by month, day, year
    if (filters.month) {
        query += ' AND MONTHNAME(medication.date_prescribed) LIKE ?';
        values.push(`%${filters.month}%`);
    }

    if (filters.day) {
        query += ' AND DAY(medication.date_prescribed) LIKE ?';
        values.push(`%${filters.date_prescribed}%`);
    }

    if (filters.year) {
        query += ' AND YEAR(medication.date_prescribed) LIKE ?';
        values.push(`%${filters.year}%`);
    }

    // SEarch date_stopped by month, day, year
    if (filters.month) {
        query += ' AND MONTHNAME(medication.date_stopped) LIKE ?';
        values.push(`%${filters.date_stopped}%`);
    }

    if (filters.day) {
        query += ' AND DAY(medication.date_stopped) LIKE ?';
        values.push(`%${filters.day}%`);
    }

    if (filters.year) {
        query += ' AND YEAR(medication.date_stopped) LIKE ?';
        values.push(`%${filters.year}%`);
    }

    if (filters.dosage) {
        query += ' AND medication.dosage LIKE ?';
        values.push(`%${filters.dosage}%`);
    }

    if (filters.time_to_take) {
        query += ' AND medication.time_to_take LIKE ?';
        values.push(`%${filters.time_to_take}%`);
    }

    if (filters.times_per_day) {
        query += ' AND medication.times_per_day LIKE ?';
        values.push(`%${filters.time_to_take}%`);
    }

    if (filters.with_food) {
        query += ' AND medication.with_food LIKE ?';
        values.push(`%${filters.with_food}%`);
    }

    if (filters.month) {
        query += ' AND MONTHNAME(medication.next_dose_due) LIKE ?';
        values.push(`%${filters.month}%`);
    }

    if (filters.day) {
        query += ' AND DAY(medication.next_dose_due) LIKE ?';
        values.push(`%${filters.day}%`);
    }

    if (filters.year) {
        query += ' AND YEAR(medication.next_dose_due) LIKE ?';
        values.push(`%${filters.year}%`);
    }

    if (filters.vet_prescribed_by) {
        query += ' AND medication.vet_prescribed_by LIKE ?';
        values.push(`%${filters.vet_prescribed_by}%`);
    }

    const [rows] = await pool.query(query, values);
    return rows;
}

async function findMedicationById(id, ownerUid) {
    const query = `${MEDICATION_SELECT} WHERE medication.medication_id = ? AND pet.owner_uid = ?`;
    const [rows] = await pool.query(query, [id, ownerUid]);
    return rows;
}

async function updateMedication(id, ownerUid, medication_name, pet_id, reason, date_prescribed, date_stopped, dosage, time_to_take, times_per_day, with_food, next_dose_due, vet_prescribed_by_id) {
    const query = 'UPDATE medication SET medication_name = ?, pet_id = ?, reason = ?, date_prescribed = ?, date_stopped = ?, dosage = ?, time_to_take = ?, times_per_day = ?, with_food = ?, next_dose_due = ?, vet_prescribed_by_id = ? WHERE medication_id = ? AND pet_id IN (SELECT pet_id FROM pet WHERE owner_uid = ?)';
    // "|| null" so a blank optional field becomes SQL NULL instead of an empty
    // string in a DATE/TIME/INT column.
    const values = [medication_name, pet_id, reason, date_prescribed || null, date_stopped || null, dosage, time_to_take || null, times_per_day || null, with_food, next_dose_due || null, vet_prescribed_by_id, id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function deleteMedication(id, ownerUid) {
    const query = 'DELETE FROM medication WHERE medication_id = ? AND pet_id IN (SELECT pet_id FROM pet WHERE owner_uid = ?)';
    const values = [id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

async function createMedication(ownerUid, medication_name, pet_id, reason, date_prescribed, date_stopped, dosage, time_to_take, times_per_day, with_food, next_dose_due, vet_prescribed_by_id) {
    const query = 'INSERT INTO medication SET ?';
    const values = [{medication_name, pet_id, reason, date_prescribed: date_prescribed || null, date_stopped: date_stopped || null, dosage, time_to_take: time_to_take || null, times_per_day: times_per_day || null, with_food, next_dose_due: next_dose_due || null, vet_prescribed_by_id}];
    const [result] = await pool.query(query, values);
    const rows = await findMedicationById(result.insertId, ownerUid);
    return rows[0];
}

export {findMedication, findMedicationById, updateMedication, deleteMedication, createMedication}
