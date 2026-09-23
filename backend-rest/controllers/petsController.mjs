import 'dotenv/config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import * as pet from '../models/petsModel.mjs';
import requireAuth from '../middleware/requireAuth.mjs';

const router = express.Router();
router.use(requireAuth);

const isOptionalString = (value) => value === undefined || value === null || typeof value === 'string';

const isValidPet = (pet_photo_url, pet_name, pet_type, breed, age, birthdate, adoption_date, deceased_date, color, fur_type, fur_marking, eye_color, whisker_color, vocal_level, sex, intact, spay_neuter_date, came_from, primary_vet_id, play_style, temperament, pet_weight, microchip_number, date_microchipped, microchip_company, microchip_url) => {
    if (pet_name === undefined || pet_type === undefined || age === undefined || birthdate === undefined || adoption_date === undefined || color === undefined || sex === undefined || intact === undefined || came_from === undefined || play_style === undefined || temperament === undefined || pet_weight === undefined) {
        return false;
    }

    // pet_photo_url is optional -- a pet can exist with no photo uploaded yet
    if (!isOptionalString(pet_photo_url)) {
        return false;
    }

    if (typeof pet_name !== 'string' || pet_name.trim() === '') {
        return false;
    }

    if (typeof pet_type !== 'string' || pet_type.trim() === '') {
        return false;
    }

    if (!isOptionalString(breed)) {
        return false;
    }

    if (!Number.isInteger(age)) {
        return false;
    }

    if (typeof birthdate !== 'string' || birthdate.trim() === '') {
        return false;
    }

    if (typeof adoption_date !== 'string' || adoption_date.trim() === '') {
        return false;
    }

    if (!isOptionalString(deceased_date)) {
        return false;
    }

    if (typeof color !== 'string' || color.trim() === '') {
        return false;
    }

    if (!isOptionalString(fur_type)) {
        return false;
    }

    if (!isOptionalString(fur_marking)) {
        return false;
    }

    if (!isOptionalString(eye_color)) {
        return false;
    }

    if (!isOptionalString(whisker_color)) {
        return false;
    }

    if (!isOptionalString(vocal_level)) {
        return false;
    }

    if (typeof sex !== 'string' || sex.trim() === '') {
        return false;
    }

    if (typeof intact !== 'boolean') {
        return false;
    }

    if (!isOptionalString(spay_neuter_date)) {
        return false;
    }

    if (typeof came_from !== 'string' || came_from.trim() === '') {
        return false;
    }

    if (primary_vet_id !== undefined && primary_vet_id !== null && !Number.isInteger(primary_vet_id)) {
        return false;
    }

    if (typeof play_style !== 'string' || play_style.trim() === '') {
        return false;
    }

    if (typeof temperament !== 'string' || temperament.trim() === '') {
        return false;
    }

    if (typeof pet_weight !== 'string' || pet_weight.trim() === '') {
        return false;
    }

    // A pet may not be microchipped at all -- all four fields are optional.
    if (!isOptionalString(microchip_number)) {
        return false;
    }

    if (!isOptionalString(date_microchipped)) {
        return false;
    }

    if (!isOptionalString(microchip_company)) {
        return false;
    }

    if (!isOptionalString(microchip_url)) {
        return false;
    }

    return true;
};

router.post('/pets', asyncHandler(async(req, res) => {
    const {pet_photo_url, pet_name, pet_type, breed, age, birthdate, adoption_date, deceased_date, color, fur_type, fur_marking, eye_color, whisker_color, vocal_level, sex, intact, spay_neuter_date, came_from, primary_vet_id, play_style, temperament, pet_weight, microchip_number, date_microchipped, microchip_company, microchip_url} = req.body;

    if (!isValidPet(pet_photo_url, pet_name, pet_type, breed, age, birthdate, adoption_date, deceased_date, color, fur_type, fur_marking, eye_color, whisker_color, vocal_level, sex, intact, spay_neuter_date, came_from, primary_vet_id, play_style, temperament, pet_weight, microchip_number, date_microchipped, microchip_company, microchip_url)) {
        return res.status(400).json({error: 'Invalid data'});
    }

    const newPet = await pet.createPet(req.uid, pet_photo_url, pet_name, pet_type, breed, age, birthdate, adoption_date, deceased_date, color, fur_type, fur_marking, eye_color, whisker_color, vocal_level, sex, intact, spay_neuter_date, came_from, primary_vet_id, play_style, temperament, pet_weight, microchip_number, date_microchipped, microchip_company, microchip_url);
    res.status(201).json(newPet);
}));

router.get('/pets', asyncHandler(async(req, res) => {
    const pets = await pet.findPet(req.uid, req.query);
    res.status(200).json(pets);
}));

router.get('/pets/:id', asyncHandler(async(req, res) => {
    const petEntry = await pet.findPetById(req.params.id, req.uid);

    if (petEntry.length > 0) {
        res.status(200).json(petEntry[0]);
    } else {
        res.status(404).json({error: 'Pet not found'});
    }
}));

router.put('/pets/:id', asyncHandler(async(req, res) => {
    const {pet_photo_url, pet_name, pet_type, breed, age, birthdate, adoption_date, deceased_date, color, fur_type, fur_marking, eye_color, whisker_color, vocal_level, sex, intact, spay_neuter_date, came_from, primary_vet_id, play_style, temperament, pet_weight, microchip_number, date_microchipped, microchip_company, microchip_url} = req.body;

    if (!isValidPet(pet_photo_url, pet_name, pet_type, breed, age, birthdate, adoption_date, deceased_date, color, fur_type, fur_marking, eye_color, whisker_color, vocal_level, sex, intact, spay_neuter_date, came_from, primary_vet_id, play_style, temperament, pet_weight, microchip_number, date_microchipped, microchip_company, microchip_url)) {
        return res.status(400).json({error: 'Invalid request'});
    }

    const result = await pet.updatePet(req.params.id, req.uid, pet_photo_url, pet_name, pet_type, breed, age, birthdate, adoption_date, deceased_date, color, fur_type, fur_marking, eye_color, whisker_color, vocal_level, sex, intact, spay_neuter_date, came_from, primary_vet_id, play_style, temperament, pet_weight, microchip_number, date_microchipped, microchip_company, microchip_url);

    if (result.affectedRows > 0) {
        const updated = await pet.findPetById(req.params.id, req.uid);
        res.status(200).json(updated[0]);
    } else {
        res.status(404).json({error: 'Pet not found'});
    }
}));

router.delete('/pets/:id', asyncHandler(async(req, res) => {
    const deletedPet = await pet.deletePet(req.params.id, req.uid);

    if (deletedPet.affectedRows > 0) {
        res.status(204).send();
    } else {
        res.status(404).json({error: 'Pet not found'});
    }
}));

export default router;
