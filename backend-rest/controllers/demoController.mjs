import 'dotenv/config';
import express from 'express';
import asyncHandler from 'express-async-handler';
import { getAuth } from 'firebase-admin/auth';
// Imported for its side effect: it initializes the Firebase Admin app.
import '../middleware/requireAuth.mjs';

const router = express.Router();

// Public on purpose: returns a Firebase custom token for the shared demo
// account, so /demo can sign a visitor straight in without a password. It
// only ever mints a token for DEMO_ACCOUNT_EMAIL; no input from the client
// decides which account is used.
router.post('/demo-session', asyncHandler(async (req, res) => {
    const demoEmail = process.env.DEMO_ACCOUNT_EMAIL;
    if (!demoEmail) {
        return res.status(404).json({error: 'Demo is not enabled'});
    }

    const demoUser = await getAuth().getUserByEmail(demoEmail);
    const token = await getAuth().createCustomToken(demoUser.uid);
    res.json({token});
}));

export default router;
