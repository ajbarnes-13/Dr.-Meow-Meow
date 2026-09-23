import 'dotenv/config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import * as vetOffice from '../models/vetOfficeModel.mjs';
import requireAuth from '../middleware/requireAuth.mjs';

const router = express.Router();
router.use(requireAuth);

const isOptionalString = (value) => value === undefined || value === null || typeof value === 'string';
const isPresent = (value) => typeof value === 'string' && value.trim() !== '';

const isValidVetOffice = (office_name, office_address, address_2, city, office_state, zip_code) => {
    if (typeof office_name !== 'string' || office_name.trim() === '') {
        return false;
    }

    if (!isOptionalString(office_address) || !isOptionalString(address_2) || !isOptionalString(city) || !isOptionalString(office_state) || !isOptionalString(zip_code)) {
        return false;
    }

    // An office can be created with just a name, or with a full street/city/state address --
    // no partial addresses (e.g. a city with no street) are allowed. Zip is optional either way.
    const addressFieldsGiven = [office_address, city, office_state].filter(isPresent).length;
    if (addressFieldsGiven !== 0 && addressFieldsGiven !== 3) {
        return false;
    }

    return true;
};

router.post('/vet_offices', asyncHandler(async(req, res) => {
    const {office_name, office_address, address_2, city, office_state, zip_code} = req.body;

    if (!isValidVetOffice(office_name, office_address, address_2, city, office_state, zip_code)) {
        return res.status(400).json({error: 'Invalid data'});
    }

    const newVetOffice = await vetOffice.createVetOffice(req.uid, office_name, office_address, address_2, city, office_state, zip_code);
    res.status(201).json(newVetOffice);
}));

router.get('/vet_offices', asyncHandler(async(req, res) => {
    const vetOffices = await vetOffice.findVetOffice(req.uid, req.query);
    res.status(200).json(vetOffices);
}));

router.get('/vet_offices/:id', asyncHandler(async(req, res) => {
    const vetOfficeEntry = await vetOffice.findVetOfficeById(req.params.id, req.uid);

    if (vetOfficeEntry.length > 0) {
        res.status(200).json(vetOfficeEntry[0]);
    } else {
        res.status(404).json({error: 'Vet office not found'});
    }
}));

router.put('/vet_offices/:id', asyncHandler(async(req, res) => {
    const {office_name, office_address, address_2, city, office_state, zip_code} = req.body;

    if (!isValidVetOffice(office_name, office_address, address_2, city, office_state, zip_code)) {
        return res.status(400).json({error: 'Invalid request'});
    }

    const result = await vetOffice.updateVetOffice(req.params.id, req.uid, office_name, office_address, address_2, city, office_state, zip_code);

    if (result.affectedRows > 0) {
        const updated = await vetOffice.findVetOfficeById(req.params.id, req.uid);
        res.status(200).json(updated[0]);
    } else {
        res.status(404).json({error: 'Vet office not found'});
    }
}));

router.delete('/vet_offices/:id', asyncHandler(async(req, res) => {
    const deletedVetOffice = await vetOffice.deleteVetOffice(req.params.id, req.uid);

    if (deletedVetOffice.affectedRows > 0) {
        res.status(204).send();
    } else {
        res.status(404).json({error: 'Vet office not found'});
    }
}));

export default router;
