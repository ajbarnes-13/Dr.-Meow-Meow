import 'dotenv/config';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}

// Verifies the Firebase ID token on the request and attaches the caller's uid.
// req.uid is the only trustworthy source of "who is making this request" --
// never read an owner/user id out of req.body or req.query, since those come
// straight from the client and can be set to anything.
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({error: 'Missing or invalid Authorization header'});
    }

    try {
        const decoded = await getAuth().verifyIdToken(token);
        req.uid = decoded.uid;
        next();
    } catch (err) {
        res.status(401).json({error: 'Invalid or expired token'});
    }
}

export default requireAuth;
