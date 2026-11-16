import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithCustomToken, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebase';

// Visiting /demo signs straight into the shared demo account, with no login
// form. The session only lasts for this tab, so a visitor isn't left signed
// into the demo the next time they open the site.
function Demo() {
    const navigate = useNavigate();
    const [error, setError] = React.useState('');
    // StrictMode runs effects twice in dev; don't request two tokens.
    const startedRef = React.useRef(false);

    React.useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        (async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/demo-session`, { method: 'POST' });
                if (!res.ok) throw new Error('The demo is unavailable right now.');
                const { token } = await res.json();
                await setPersistence(auth, browserSessionPersistence);
                await signInWithCustomToken(auth, token);
                navigate('/home', { replace: true });
            } catch (err) {
                setError(err.message);
            }
        })();
    }, [navigate]);

    if (error) {
        return (
            <div className="login-form">
                <p style={{color: 'red'}}>{error}</p>
                <Link to="/login">Go to login</Link>
            </div>
        );
    }

    return <p>Loading the demo account…</p>;
}

export default Demo;
