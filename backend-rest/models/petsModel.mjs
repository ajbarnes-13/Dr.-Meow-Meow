import pool from '../SQLdb/db-connection.mjs';

const PET_SELECT = `
    SELECT pet.pet_id, pet.owner_uid, pet.pet_photo_url, pet.pet_name, pet.pet_type, pet.breed, pet.age, pet.birthdate, pet.adoption_date, pet.deceased_date, pet.color, pet.fur_type, pet.fur_marking, pet.eye_color, pet.whisker_color, pet.vocal_level, pet.sex, pet.intact, pet.spay_neuter_date, pet.came_from, pet.primary_vet_id, vet.vet_name AS primary_vet_name, pet.play_style, pet.temperament, pet.pet_weight, pet.microchip_number, pet.date_microchipped, pet.microchip_company, pet.microchip_url
    FROM pet
    LEFT JOIN vet ON pet.primary_vet_id = vet.vet_id`;

async function findPet(ownerUid, filters = {}) {
    let query = `${PET_SELECT} WHERE pet.owner_uid = ?`;
    const values = [ownerUid];

    if (filters.pet_name) {
        query += ' AND pet.pet_name LIKE ?';
        values.push(`%${filters.pet_name}%`);
    }

    if (filters.pet_id) {
        query += ' AND pet.pet_id = ?';
        values.push(filters.pet_id);
    }

    if (filters.pet_type) {
        query += ' AND pet.pet_type LIKE ?';
        values.push(`%${filters.pet_type}%`);
    }

    if (filters.color) {
        query += ' AND pet.color LIKE ?';
        values.push(`%${filters.color}%`);
    }

    if (filters.sex) {
        query += ' AND pet.sex LIKE ?';
        values.push(`%${filters.sex}%`);
    }

    if (filters.came_from) {
        query += ' AND pet.came_from LIKE ?';
        values.push(`%${filters.came_from}%`);
    }

    if (filters.vet) {
        query += ' AND vet.vet_name LIKE ?';
        values.push(`%${filters.vet}%`);
    }

    // Search birthdate by month, day, year
    if (filters.birth_month) {
        query += ' AND MONTHNAME(pet.birthdate) LIKE ?';
        values.push(`%${filters.birth_month}%`);
    }

    if (filters.birth_day) {
        query += ' AND DAY(pet.birthdate) = ?';
        values.push(filters.birth_day);
    }

    if (filters.birth_year) {
        query += ' AND YEAR(pet.birthdate) = ?';
        values.push(filters.birth_year);
    }

    // Search adoption_date by month, day, year
    if (filters.adopted_month) {
        query += ' AND MONTHNAME(pet.adoption_date) LIKE ?';
        values.push(`%${filters.adopted_month}%`);
    }

    if (filters.adopted_day) {
        query += ' AND DAY(pet.adoption_date) = ?';
        values.push(filters.adopted_day);
    }

    if (filters.adopted_year) {
        query += ' AND YEAR(pet.adoption_date) = ?';
        values.push(filters.adopted_year);
    }

    const [rows] = await pool.query(query, values);
    return rows;
}

async function findPetById(id, ownerUid) {
    const query = `${PET_SELECT} WHERE pet.pet_id = ? AND pet.owner_uid = ?`;
    const [rows] = await pool.query(query, [id, ownerUid]);
    return rows;
}

async function updatePet(id, ownerUid, pet_photo_url, pet_name, pet_type, breed, age, birthdate, adoption_date, deceased_date, color, fur_type, fur_marking, eye_color, whisker_color, vocal_level, sex, intact, spay_neuter_date, came_from, primary_vet_id, play_style, temperament, pet_weight, microchip_number, date_microchipped, microchip_company, microchip_url) {
    const query = 'UPDATE pet SET pet_photo_url = ?, pet_name = ?, pet_type = ?, breed = ?, age = ?, birthdate = ?, adoption_date = ?, deceased_date = ?, color = ?, fur_type = ?, fur_marking = ?, eye_color = ?, whisker_color = ?, vocal_level = ?, sex = ?, intact = ?, spay_neuter_date = ?, came_from = ?, primary_vet_id = ?, play_style = ?, temperament = ?, pet_weight = ?, microchip_number = ?, date_microchipped = ?, microchip_company = ?, microchip_url = ? WHERE pet_id = ? AND owner_uid = ?';
    const values = [pet_photo_url, pet_name, pet_type, breed, age, birthdate, adoption_date, deceased_date, color, fur_type, fur_marking, eye_color, whisker_color, vocal_level, sex, intact, spay_neuter_date, came_from, primary_vet_id, play_style, temperament, pet_weight, microchip_number || null, date_microchipped || null, microchip_company || null, microchip_url || null, id, ownerUid];
    const [rows] = await pool.query(query, values);
    return rows;
}

// Deleting a pet needs to take everything hanging off it with it (vaccines,
// medications, health conditions, appointments, food, behaviors) -- none of
// those foreign keys cascade at the database level, so a plain DELETE FROM
// pet would either fail outright (a child row still points at this pet_id)
// or, if the child tables were ever cleaned up separately, leave orphaned
// rows behind. Runs as one transaction so a failure partway through doesn't
// leave the pet gone but its records still sitting around, or vice versa.
async function deletePet(id, ownerUid) {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Confirm this pet actually belongs to the caller before deleting
        // anything -- otherwise someone could pass another owner's pet_id and
        // wipe out that pet's records below even though the final delete of
        // the pet row itself (scoped to owner_uid) would never have removed it.
        const [owned] = await connection.query('SELECT 1 FROM pet WHERE pet_id = ? AND owner_uid = ? LIMIT 1', [id, ownerUid]);
        if (owned.length === 0) {
            await connection.commit();
            return { affectedRows: 0 };
        }

        await connection.query('DELETE FROM vaccine WHERE pet_id = ?', [id]);
        await connection.query('DELETE FROM medication WHERE pet_id = ?', [id]);
        await connection.query('DELETE FROM health_condition WHERE pet_id = ?', [id]);
        await connection.query('DELETE FROM appointment WHERE pet_id = ?', [id]);
        await connection.query('DELETE FROM food WHERE pet_id = ?', [id]);
        await connection.query('DELETE FROM behavior WHERE pet_id = ?', [id]);

        const [result] = await connection.query('DELETE FROM pet WHERE pet_id = ? AND owner_uid = ?', [id, ownerUid]);

        await connection.commit();
        return result;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

async function createPet(ownerUid, pet_photo_url, pet_name, pet_type, breed, age, birthdate, adoption_date, deceased_date, color, fur_type, fur_marking, eye_color, whisker_color, vocal_level, sex, intact, spay_neuter_date, came_from, primary_vet_id, play_style, temperament, pet_weight, microchip_number, date_microchipped, microchip_company, microchip_url) {
    const query = 'INSERT INTO pet SET ?';
    const values = [{owner_uid: ownerUid, pet_photo_url, pet_name, pet_type, breed, age, birthdate, adoption_date, deceased_date, color, fur_type, fur_marking, eye_color, whisker_color, vocal_level, sex, intact, spay_neuter_date, came_from, primary_vet_id, play_style, temperament, pet_weight, microchip_number: microchip_number || null, date_microchipped: date_microchipped || null, microchip_company: microchip_company || null, microchip_url: microchip_url || null}];
    const [result] = await pool.query(query, values);
    const rows = await findPetById(result.insertId, ownerUid);
    return rows[0];
}

// Used by resources that hang off a pet_id (vaccines, medications, appointments, etc.)
// to confirm the pet named in the request actually belongs to the caller before
// touching any row linked to it.
async function isPetOwner(petId, ownerUid) {
    const [rows] = await pool.query('SELECT 1 FROM pet WHERE pet_id = ? AND owner_uid = ? LIMIT 1', [petId, ownerUid]);
    return rows.length > 0;
}

export {findPet, findPetById, updatePet, deletePet, createPet, isPetOwner}
