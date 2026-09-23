import 'dotenv/config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import * as vet from '../models/vetsModel.mjs';
import * as vetOffice from '../models/vetOfficeModel.mjs';
import requireAuth from '../middleware/requireAuth.mjs';

const router = express.Router();
router.use(requireAuth);

const isValidVet = (vet_name, office_name_id, phone_number, website) => {
    if (vet_name === undefined || office_name_id === undefined || phone_number === undefined) {
        return false;
    }

    if (typeof vet_name !== 'string' || vet_name.trim() === '') {
        return false;
    }

    if (!Number.isInteger(office_name_id)) {
        return false;
    }

    if (typeof phone_number !== 'string' || phone_number.trim() === '') {
        return false;
    }

    if (website !== undefined && website !== null && typeof website !== 'string') {
        return false;
    }

    return true;
};

router.post('/vets', asyncHandler(async(req, res) => {
    const {vet_name, office_name_id, phone_number, website} = req.body;

    if (!isValidVet(vet_name, office_name_id, phone_number, website)) {
        return res.status(400).json({error: 'Invalid data'});
    }

    if (!await vetOffice.isOfficeOwner(office_name_id, req.uid)) {
        return res.status(404).json({error: 'Vet office not found'});
    }

    const newVet = await vet.createVet(req.uid, vet_name, office_name_id, phone_number, website);
    res.status(201).json(newVet);
}));

router.get('/vets', asyncHandler(async(req, res) => {
    const vets = await vet.findVet(req.uid, req.query);
    res.status(200).json(vets);
}));

router.get('/vets/:id', asyncHandler(async(req, res) => {
    const vetEntry = await vet.findVetById(req.params.id, req.uid);

    if (vetEntry.length > 0) {
        res.status(200).json(vetEntry[0]);
    } else {
        res.status(404).json({error: 'Vet not found'});
    }
}));

router.put('/vets/:id', asyncHandler(async(req, res) => {
    const {vet_name, office_name_id, phone_number, website} = req.body;

    if (!isValidVet(vet_name, office_name_id, phone_number, website)) {
        return res.status(400).json({error: 'Invalid request'});
    }

    if (!await vetOffice.isOfficeOwner(office_name_id, req.uid)) {
        return res.status(404).json({error: 'Vet office not found'});
    }

    const result = await vet.updateVet(req.params.id, req.uid, vet_name, office_name_id, phone_number, website);

    if (result.affectedRows > 0) {
        const updated = await vet.findVetById(req.params.id, req.uid);
        res.status(200).json(updated[0]);
    } else {
        res.status(404).json({error: 'Vet not found'});
    }
}));

router.delete('/vets/:id', asyncHandler(async(req, res) => {
    const deletedVet = await vet.deleteVet(req.params.id, req.uid);

    if (deletedVet.affectedRows > 0) {
        res.status(204).send();
    } else {
        res.status(404).json({error: 'Vet not found'});
    }
}));

export default router;
