import 'dotenv/config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import * as food from '../models/foodModel.mjs';
import * as pet from '../models/petsModel.mjs';
import requireAuth from '../middleware/requireAuth.mjs';

const router = express.Router();
router.use(requireAuth);

const isOptionalString = (value) => value === undefined || value === null || typeof value === 'string';

const isValidFood = (food_type, brand, flavor, how_often, how_much, health_consideration, date_started, date_stopped, pet_id) => {
    if (food_type === undefined || brand === undefined || flavor === undefined || how_often === undefined || how_much === undefined || date_started === undefined || pet_id === undefined) {
        return false;
    }

    if (typeof food_type !== 'string' || food_type.trim() === '') {
        return false;
    }

    if (typeof brand !== 'string' || brand.trim() === '') {
        return false;
    }

    if (typeof flavor !== 'string' || flavor.trim() === '') {
        return false;
    }

    if (typeof how_often !== 'string' || how_often.trim() === '') {
        return false;
    }

    if (typeof how_much !== 'string' || how_much.trim() === '') {
        return false;
    }

    // Not every food has a health consideration attached to it, so this is optional.
    if (!isOptionalString(health_consideration)) {
        return false;
    }

    if (typeof date_started !== 'string' || date_started.trim() === '') {
        return false;
    }

    // A food currently being fed has no stop date yet, so this is optional.
    if (!isOptionalString(date_stopped)) {
        return false;
    }

    if (!Number.isInteger(pet_id)) {
        return false;
    }

    return true;
}

router.post('/foods', asyncHandler(async(req, res) => {
    const {food_type, brand, flavor, how_often, how_much, health_consideration, date_started, date_stopped, pet_id} = req.body;

    if (!isValidFood(food_type, brand, flavor, how_often, how_much, health_consideration, date_started, date_stopped, pet_id)) {
        return res.status(400).json({error: 'Invalid data'});
    }

    if (!await pet.isPetOwner(pet_id, req.uid)) {
        return res.status(404).json({error: 'Pet not found'});
    }

    const newFood = await food.createFood(req.uid, food_type, brand, flavor, how_often, how_much, health_consideration, date_started, date_stopped, pet_id);
    res.status(201).json(newFood);
}));

router.get('/foods', asyncHandler(async(req, res) => {
    const foodEntries = await food.findFood(req.uid, req.query);
    res.status(200).json(foodEntries);
}));

router.get('/foods/:id', asyncHandler(async(req, res) => {
    const foodEntry = await food.findFoodById(req.params.id, req.uid);

    if (foodEntry.length > 0) {
        res.status(200).json(foodEntry[0]);
    } else {
        res.status(404).json({error: 'Food not found'});
    }
}));

router.put('/foods/:id', asyncHandler(async(req, res) => {
    const {food_type, brand, flavor, how_often, how_much, health_consideration, date_started, date_stopped, pet_id} = req.body;

    if (!isValidFood(food_type, brand, flavor, how_often, how_much, health_consideration, date_started, date_stopped, pet_id)) {
        return res.status(400).json({error: 'Invalid request'});
    }

    if (!await pet.isPetOwner(pet_id, req.uid)) {
        return res.status(404).json({error: 'Pet not found'});
    }

    const result = await food.updateFood(req.params.id, req.uid, food_type, brand, flavor, how_often, how_much, health_consideration, date_started, date_stopped, pet_id);

    if (result.affectedRows > 0) {
        const updated = await food.findFoodById(req.params.id, req.uid);
        res.status(200).json(updated[0]);
    } else {
        res.status(404).json({error: 'Food not found'});
    }
}));

router.delete('/foods/:id', asyncHandler(async(req, res) => {
    const deletedFood = await food.deleteFood(req.params.id, req.uid);

    if (deletedFood.affectedRows > 0) {
        res.status(204).send();
    } else {
        res.status(404).json({error: 'Food not found'});
    }
}));

export default router;
