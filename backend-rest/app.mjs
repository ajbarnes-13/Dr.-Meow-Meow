import 'dotenv/config';
import express from 'express';
import cors from 'cors';
// Each of these is a mini router that owns one resource's routes (e.g. GET/POST /behaviors).
// Importing it here just gives us a name to plug into the app below -- it doesn't run anything yet.
import behaviorsRouter from './controllers/behaviorsController.mjs';
import appointmentsRouter from './controllers/appointmentsController.mjs';
import petsRouter from './controllers/petsController.mjs';
import vaccinesRouter from './controllers/vaccinesController.mjs';
import vetsRouter from './controllers/vetsController.mjs';
import foodRouter from './controllers/foodController.mjs';
import healthConditionsRouter from './controllers/healthConditionsController.mjs';
import medicationsRouter from './controllers/medicationsController.mjs';
import vetOfficeRouter from './controllers/vetOfficeController.mjs';

const app = express();
app.use(cors());
app.use(express.json());
// app.use() is what actually turns a router "on" -- without this line, the routes inside
// it exist in code but Express never listens for them, so every request to them 404s.
app.use(behaviorsRouter);
app.use(appointmentsRouter);
app.use(petsRouter);
app.use(vaccinesRouter);
app.use(vetsRouter);
app.use(foodRouter);
app.use(healthConditionsRouter);
app.use(medicationsRouter);
app.use(vetOfficeRouter);

// No route above matched -- respond JSON instead of Express's default HTML 404 page.
app.use((req, res) => {
    res.status(404).json({error: 'Not found'});
});

// asyncHandler forwards thrown/rejected errors here instead of crashing the process.
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({error: 'Internal server error'});
});

app.listen(process.env.PORT, () => {
    console.log(`Server is listening on port ${process.env.PORT}...`);
});