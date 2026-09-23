import 'dotenv/config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import * as behaviors from '../models/behaviorsModel.mjs';
import * as pet from '../models/petsModel.mjs';
import requireAuth from '../middleware/requireAuth.mjs';

const router = express.Router();
router.use(requireAuth);

const isOptionalString = (value) => value === undefined || value === null || typeof value === 'string';

const isValidBehavior = (pet_id, behavior, date_started, frequency, total_occurrences, date_stopped) => {
    if (pet_id === undefined || behavior === undefined || date_started === undefined || frequency === undefined) {
        return false;
    }

    if (!Number.isInteger(pet_id)) {
        return false;
    }

    if (typeof behavior !== 'string' || behavior.trim() === '') {
        return false;
    }

    if (typeof date_started !== 'string' || date_started.trim() === '') {
        return false;
    }

    if (typeof frequency !== 'string' || frequency.trim() === '') {
        return false;
    }

    // There may not be a running count of occurrences yet, so this is optional.
    if (total_occurrences !== undefined && total_occurrences !== null && !Number.isInteger(total_occurrences)) {
        return false;
    }

    // A behavior that's still ongoing has no stop date yet, so this is optional.
    if (!isOptionalString(date_stopped)) {
        return false;
    }

    return true;
}

router.post('/behaviors', asyncHandler(async(req, res) => {
    const {pet_id, behavior, date_started, frequency, total_occurrences, date_stopped} = req.body;

    if (!isValidBehavior(pet_id, behavior, date_started, frequency, total_occurrences, date_stopped)) {
        return res.status(400).json({error: 'Invalid data'});
    }

    if (!await pet.isPetOwner(pet_id, req.uid)) {
        return res.status(404).json({error: 'Pet not found'});
    }

    const newBehavior = await behaviors.createBehavior(req.uid, pet_id, behavior, date_started, frequency, total_occurrences, date_stopped);
    res.status(201).json(newBehavior);
}));

router.get('/behaviors', asyncHandler(async(req, res) => {
    const behaviorEntries = await behaviors.findBehavior(req.uid, req.query);
    res.status(200).json(behaviorEntries);
}));

router.get('/behaviors/:id', asyncHandler(async(req, res) => {
    const behaviorEntry = await behaviors.findBehaviorById(req.params.id, req.uid);

    if (behaviorEntry.length > 0) {
        res.status(200).json(behaviorEntry[0]);
    } else {
        res.status(404).json({error: 'Behavior not found'});
    }
}));

router.put('/behaviors/:id', asyncHandler(async(req, res) => {
    const {pet_id, behavior, date_started, frequency, total_occurrences, date_stopped} = req.body;

    if (!isValidBehavior(pet_id, behavior, date_started, frequency, total_occurrences, date_stopped)) {
        return res.status(400).json({error: 'Invalid request'});
    }

    if (!await pet.isPetOwner(pet_id, req.uid)) {
        return res.status(404).json({error: 'Pet not found'});
    }

    const result = await behaviors.updateBehavior(req.params.id, req.uid, pet_id, behavior, date_started, frequency, total_occurrences, date_stopped);

    if (result.affectedRows > 0) {
        const updated = await behaviors.findBehaviorById(req.params.id, req.uid);
        res.status(200).json(updated[0]);
    } else {
        res.status(404).json({error: 'Behavior not found'});
    }
}));

router.delete('/behaviors/:id', asyncHandler(async(req, res) => {
    const deletedBehavior = await behaviors.deleteBehavior(req.params.id, req.uid);

    if (deletedBehavior.affectedRows > 0) {
        res.status(204).send();
    } else {
        res.status(404).json({error: 'Behavior not found'});
    }
}));

export default router;
