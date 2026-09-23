import 'dotenv/config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import * as appointment from '../models/appointmentsModel.mjs';
import * as pet from '../models/petsModel.mjs';
import requireAuth from '../middleware/requireAuth.mjs';

const router = express.Router();
router.use(requireAuth);

const isValidAppointment = (pet_id, vet_id, office_name_id, reason, appointment_date, appointment_time, summary) => {
    if (pet_id === undefined || vet_id === undefined || office_name_id === undefined || reason === undefined || appointment_date === undefined || appointment_time === undefined) {
        return false;
    }

    if (!Number.isInteger(pet_id)) {
        return false;
    }

    if (!Number.isInteger(vet_id)) {
        return false;
    }

    if (!Number.isInteger(office_name_id)) {
        return false;
    }

    if (typeof reason !== 'string' || reason.trim() === '') {
        return false;
    }

    if (typeof appointment_date !== 'string' || appointment_date.trim() === '') {
        return false;
    }

    if (typeof appointment_time !== 'string' || appointment_time.trim() === '') {
        return false;
    }

    if (summary !== undefined && typeof summary !== 'string') {
        return false;
    }

    return true;

};

router.post('/appointments', asyncHandler(async(req, res) => {
    const {pet_id, vet_id, office_name_id, reason, appointment_date, appointment_time, summary} = req.body;

    if (!isValidAppointment(pet_id, vet_id, office_name_id, reason, appointment_date, appointment_time, summary)) {
        return res.status(400).json({error: 'Invalid data'});
    }

    if (!await pet.isPetOwner(pet_id, req.uid)) {
        return res.status(404).json({error: 'Pet not found'});
    }

    const newAppointment = await appointment.createAppointment(req.uid, pet_id, vet_id, office_name_id, reason, appointment_date, appointment_time, summary);
    res.status(201).json(newAppointment);
}));

router.get('/appointments', asyncHandler(async(req, res) => {
    const appointments = await appointment.findAppointment(req.uid, req.query);
    res.status(200).json(appointments);
}));

router.get('/appointments/:id', asyncHandler(async(req, res) => {
    const appointmentEntry = await appointment.findAppointmentById(req.params.id, req.uid);

    if (appointmentEntry.length > 0) {
        res.status(200).json(appointmentEntry[0]);
    } else {
        res.status(404).json({error: 'Appointment not found'});
    }
}));

router.put('/appointments/:id', asyncHandler(async(req, res) => {
    const {pet_id, vet_id, office_name_id, reason, appointment_date, appointment_time, summary} = req.body;

    if (!isValidAppointment(pet_id, vet_id, office_name_id, reason, appointment_date, appointment_time, summary)) {
        return res.status(400).json({error: 'Invalid request'});
    }

    if (!await pet.isPetOwner(pet_id, req.uid)) {
        return res.status(404).json({error: 'Pet not found'});
    }

    const result = await appointment.updateAppointment(req.params.id, req.uid, pet_id, vet_id, office_name_id, reason, appointment_date, appointment_time, summary);

    if (result.affectedRows > 0) {
        const updated = await appointment.findAppointmentById(req.params.id, req.uid);
        res.status(200).json(updated[0]);
    } else {
        res.status(404).json({error: 'Appointment not found'});
    }
}));

router.delete('/appointments/:id', asyncHandler(async(req, res) => {
    const deletedAppointment = await appointment.deleteAppointment(req.params.id, req.uid);
    
    if (deletedAppointment.affectedRows > 0) {
        res.status(204).send();
    } else {
        res.status(404).json({error: 'Appointment not found'});
    }
}));

export default router;
