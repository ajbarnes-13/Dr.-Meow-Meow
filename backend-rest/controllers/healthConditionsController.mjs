import 'dotenv/config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import * as health_condition from '../models/healthConditionsModel.mjs';
import * as pet from '../models/petsModel.mjs';
import requireAuth from '../middleware/requireAuth.mjs';

const router = express.Router();
router.use(requireAuth);

const isValidCondition = (condition, pet_id, date_diagnosed, vet_diagnosed_by_id, treatment) => {
    if (condition === undefined || pet_id === undefined || date_diagnosed === undefined || vet_diagnosed_by_id === undefined || treatment === undefined) {
        return false;
    }

    if (typeof condition !== 'string' || condition.trim() === '') {
        return false;
    }

    if (!Number.isInteger(pet_id)) {
        return false;
    }

    if (typeof date_diagnosed !== 'string' || date_diagnosed.trim() === '') {
        return false;
    }

    if (!Number.isInteger(vet_diagnosed_by_id)) {
        return false;
    }

    if (typeof treatment !== 'string' || treatment.trim() === '') {
        return false;
    }

    return true;
}

router.post('/health_conditions', asyncHandler(async(req, res) => {
    const {condition, pet_id, date_diagnosed, vet_diagnosed_by_id, treatment} = req.body;

    if (!isValidCondition(condition, pet_id, date_diagnosed, vet_diagnosed_by_id, treatment)) {
        return res.status(400).json({error: 'Invalid data'});
    }

    if (!await pet.isPetOwner(pet_id, req.uid)) {
        return res.status(404).json({error: 'Pet not found'});
    }

    const newCondition = await health_condition.createCondition(req.uid, condition, pet_id, date_diagnosed, vet_diagnosed_by_id, treatment);
    res.status(201).json(newCondition);
}));

router.get('/health_conditions', asyncHandler(async(req, res) => {
    const conditionEntries = await health_condition.findCondition(req.uid, req.query);
    res.status(200).json(conditionEntries);
}));

router.get('/health_conditions/:id', asyncHandler(async(req, res) => {
    const conditionEntry = await health_condition.findConditionById(req.params.id, req.uid);

    if (conditionEntry.length > 0) {
        res.status(200).json(conditionEntry[0]);
    } else {
        res.status(404).json({error: 'Health Condition not found'});
    }
}));

router.put('/health_conditions/:id', asyncHandler(async(req, res) => {
    const {condition, pet_id, date_diagnosed, vet_diagnosed_by_id, treatment} = req.body;

    if (!isValidCondition(condition, pet_id, date_diagnosed, vet_diagnosed_by_id, treatment)) {
        return res.status(400).json({error: 'Invalid request'});
    }

    if (!await pet.isPetOwner(pet_id, req.uid)) {
        return res.status(404).json({error: 'Pet not found'});
    }

    const result = await health_condition.updateCondition(req.params.id, req.uid, condition, pet_id, date_diagnosed, vet_diagnosed_by_id, treatment);

    if (result.affectedRows > 0) {
        const updated = await health_condition.findConditionById(req.params.id, req.uid);
        res.status(200).json(updated[0]);
    } else {
        res.status(404).json({error: 'Health Condition not found'});
    }
}));

router.delete('/health_conditions/:id', asyncHandler(async(req, res) => {
    const deletedCondition = await health_condition.deleteCondition(req.params.id, req.uid);

    if (deletedCondition.affectedRows > 0) {
        res.status(204).send();
    } else {
        res.status(404).json({error: 'Health Condition not found'});
    }
}));

export default router;
