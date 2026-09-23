import 'dotenv/config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import * as medication from '../models/medicationsModel.mjs';
import * as pet from '../models/petsModel.mjs';
import requireAuth from '../middleware/requireAuth.mjs';

const router = express.Router();
router.use(requireAuth);

const isOptionalString = (value) => value === undefined || value === null || typeof value === 'string';

// times_per_day is stored as an INT, so either a number or a numeric string
// is fine -- the frontend's shared field editor sends it as a number.
const isOptionalStringOrNumber = (value) => isOptionalString(value) || typeof value === 'number';

const isValidMedication = (medication_name, pet_id, reason, date_prescribed, date_stopped, dosage, time_to_take, times_per_day, with_food, next_dose_due, vet_prescribed_by_id) => {
    // Only Medication, Reason, Prescribed By, and Dosage are required -- everything
    // else about a medication (dates, timing, food) can be filled in later.
    if (medication_name === undefined || pet_id === undefined || reason === undefined || dosage === undefined || vet_prescribed_by_id === undefined) {
        return false;
    }

    if (typeof medication_name !== 'string' || medication_name.trim() === '') {
        return false;
    }

    if (!Number.isInteger(pet_id)) {
        return false;
    }

    if (typeof reason !== 'string' || reason.trim() === '') {
        return false;
    }

    if (!isOptionalString(date_prescribed)) {
        return false;
    }

    // A medication that's still being given has no stop date yet, so this is optional.
    if (!isOptionalString(date_stopped)) {
        return false;
    }

    if (typeof dosage !== 'string' || dosage.trim() === '') {
        return false;
    }

    if (!isOptionalString(time_to_take)) {
        return false;
    }

    if (!isOptionalStringOrNumber(times_per_day)) {
        return false;
    }

    if (typeof with_food !== 'boolean') {
        return false;
    }

    // A medication that's already stopped has no next dose coming, so this is optional.
    if (!isOptionalString(next_dose_due)) {
        return false;
    }

    if (!Number.isInteger(vet_prescribed_by_id)) {
        return false;
    }

    return true;

}

router.post('/medications', asyncHandler(async(req, res) => {
    const {medication_name, pet_id, reason, date_prescribed, date_stopped, dosage, time_to_take, times_per_day, with_food, next_dose_due, vet_prescribed_by_id} = req.body;

    if (!isValidMedication(medication_name, pet_id, reason, date_prescribed, date_stopped, dosage, time_to_take, times_per_day, with_food, next_dose_due, vet_prescribed_by_id)) {
        return res.status(400).json({error: 'Invalid data'});
    }

    if (!await pet.isPetOwner(pet_id, req.uid)) {
        return res.status(404).json({error: 'Pet not found'});
    }

    const newMedication = await medication.createMedication(req.uid, medication_name, pet_id, reason, date_prescribed, date_stopped, dosage, time_to_take, times_per_day, with_food, next_dose_due, vet_prescribed_by_id);
    res.status(201).json(newMedication);
}));

router.get('/medications', asyncHandler(async(req, res) => {
    const medications = await medication.findMedication(req.uid, req.query);
    res.status(200).json(medications);
}));

router.get('/medications/:id', asyncHandler(async(req, res) => {
    const medicationEntry = await medication.findMedicationById(req.params.id, req.uid);

    if (medicationEntry.length > 0) {
        res.status(200).json(medicationEntry[0]);
    } else {
        res.status(404).json({error: 'Medication not found'});
    }
}));

router.put('/medications/:id', asyncHandler(async(req, res) => {
    const {medication_name, pet_id, reason, date_prescribed, date_stopped, dosage, time_to_take, times_per_day, with_food, next_dose_due, vet_prescribed_by_id} = req.body;

    if (!isValidMedication(medication_name, pet_id, reason, date_prescribed, date_stopped, dosage, time_to_take, times_per_day, with_food, next_dose_due, vet_prescribed_by_id)) {
        return res.status(400).json({error: 'Invalid request'});
    }

    if (!await pet.isPetOwner(pet_id, req.uid)) {
        return res.status(404).json({error: 'Pet not found'});
    }

    const result = await medication.updateMedication(req.params.id, req.uid, medication_name, pet_id, reason, date_prescribed, date_stopped, dosage, time_to_take, times_per_day, with_food, next_dose_due, vet_prescribed_by_id);

    if (result.affectedRows > 0) {
        const updated = await medication.findMedicationById(req.params.id, req.uid);
        res.status(200).json(updated[0]);
    } else {
        res.status(404).json({error: 'Medication not found'});
    }
}));

router.delete('/medications/:id', asyncHandler(async(req, res) => {
    const deletedMedication = await medication.deleteMedication(req.params.id, req.uid);

    if (deletedMedication.affectedRows > 0) {
        res.status(204).send();
    } else {
        res.status(404).json({error: 'Medication not found'});
    }
}));

export default router;