import 'dotenv/config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import * as vaccine from '../models/vaccinesModel.mjs';
import * as pet from '../models/petsModel.mjs';
import requireAuth from '../middleware/requireAuth.mjs';

const router = express.Router();
router.use(requireAuth);

const isValidVaccine = (pet_id, vaccine_name, date_given, next_due_date, vet_id) => {
    if (pet_id === undefined || vaccine_name === undefined || date_given === undefined || next_due_date === undefined || vet_id === undefined) {
        return false;
    }

    if (!Number.isInteger(pet_id)) {
        return false;
    }

    if (typeof vaccine_name !== 'string' || vaccine_name.trim() === '') {
        return false;
    }

    if (typeof date_given !== 'string' || date_given.trim() === '') {
        return false;
    }

    if (typeof next_due_date !== 'string' || next_due_date.trim() === '') {
        return false;
    }

    if (!Number.isInteger(vet_id)) {
        return false;
    }

    return true;
};

router.post('/vaccines', asyncHandler(async(req, res) => {
    const {pet_id, vaccine_name, date_given, next_due_date, vet_id} = req.body;

    if (!isValidVaccine(pet_id, vaccine_name, date_given, next_due_date, vet_id)) {
        return res.status(400).json({error: 'Invalid data'});
    }

    if (!await pet.isPetOwner(pet_id, req.uid)) {
        return res.status(404).json({error: 'Pet not found'});
    }

    const newVaccine = await vaccine.createVaccine(req.uid, pet_id, vaccine_name, date_given, next_due_date, vet_id);
    res.status(201).json(newVaccine);
}));

router.get('/vaccines', asyncHandler(async(req, res) => {
    const vaccines = await vaccine.findVaccine(req.uid, req.query);
    res.status(200).json(vaccines);
}));

router.get('/vaccines/:id', asyncHandler(async(req, res) => {
    const vaccineEntry = await vaccine.findVaccineById(req.params.id, req.uid);

    if (vaccineEntry.length > 0) {
        res.status(200).json(vaccineEntry[0]);
    } else {
        res.status(404).json({error: 'Vaccine not found'});
    }
}));

router.put('/vaccines/:id', asyncHandler(async(req, res) => {
    const {pet_id, vaccine_name, date_given, next_due_date, vet_id} = req.body;

    if (!isValidVaccine(pet_id, vaccine_name, date_given, next_due_date, vet_id)) {
        return res.status(400).json({error: 'Invalid request'});
    }

    if (!await pet.isPetOwner(pet_id, req.uid)) {
        return res.status(404).json({error: 'Pet not found'});
    }

    const result = await vaccine.updateVaccine(req.params.id, req.uid, pet_id, vaccine_name, date_given, next_due_date, vet_id);

    if (result.affectedRows > 0) {
        const updated = await vaccine.findVaccineById(req.params.id, req.uid);
        res.status(200).json(updated[0]);
    } else {
        res.status(404).json({error: 'Vaccine not found'});
    }
}));

router.delete('/vaccines/:id', asyncHandler(async(req, res) => {
    const deletedVaccine = await vaccine.deleteVaccine(req.params.id, req.uid);

    if (deletedVaccine.affectedRows > 0) {
        res.status(204).send();
    } else {
        res.status(404).json({error: 'Vaccine not found'});
    }
}));

export default router;
