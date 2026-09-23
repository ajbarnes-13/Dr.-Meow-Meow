import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    onAuthStateChanged,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updateProfile,
    getAdditionalUserInfo,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import './login.css';

// A password has to clear this bar before we'll send it to Firebase -- Firebase itself
// only enforces a 6-character minimum, which still lets something like "123456" through.
function isPasswordStrongEnough(pw) {
    return pw.length >= 6 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);
}

function loginPage() {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [mode, setMode] = React.useState('');
    const [error, setError] = React.useState('');
    const [resetMessage, setResetMessage] = React.useState('');
    const [rememberMe, setRememberMe] = React.useState(true);
    // TERMS OF SERVICE / PRIVACY POLICY CHECKBOX -- commented out (along with the validation
    // check in HandleEmailSubmit and the checkbox in the form below) because there's no actual
    // Terms of Service or Privacy Policy written yet (privacyPolicy.jsx is still a placeholder
    // page). Having users agree to legal documents that don't exist is meaningless at best and
    // misleading at worst, so this stays disabled until those pages have real content.
    // const [agreedToTerms, setAgreedToTerms] = React.useState(false);

    const navigate = useNavigate();
    // Set the moment we detect a brand-new account (signup or a Google sign-in that just
    // created one), so the redirect effect below can send that one visitor to pet setup
    // instead of straight to /home.
    const justSignedUpRef = React.useRef(false);

    // Sends the user to the home page as soon as Firebase confirms they're signed in
    // (covers Google popup sign-in, email/password sign-in, and already being logged in).
    // A brand-new account goes to Add Pet first so they aren't dropped on an empty home page.
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) return;
            if (justSignedUpRef.current) {
                justSignedUpRef.current = false;
                navigate('/addPet', { state: { welcome: true } });
            } else {
                navigate('/home');
            }
        });

        return unsubscribe;
    }, [navigate]);

        // "Remember me" controls whether Firebase keeps the session in local storage
        // (survives closing the browser) or session storage (cleared when the browser/tab
        // closes). It has to be set right before whichever sign-in call actually runs --
        // it applies the same way to Google sign-in as it does to email/password, since
        // both go through the same Firebase Auth session.
        async function applyPersistence() {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        }

        async function handleGoogleLogin() {
            setError('');
            try {
                await applyPersistence();
                const credential = await signInWithPopup(auth, googleProvider);
                justSignedUpRef.current = getAdditionalUserInfo(credential)?.isNewUser ?? false;
            } catch (err) {
                setError(err.message);
            }
        }

        async function handleResetPassword() {
            setError('');
            setResetMessage('');
            if (!email) {
                setError('Enter your email above first, then click reset.');
                return;
            }
            try {
                await sendPasswordResetEmail(auth, email);
                setResetMessage('If an account was found with the email you entered, an email with a password reset link was sent. Check your inbox.');
            } catch (err) {
                setError(err.message);
            }
        }

        async function HandleEmailSubmit(e) {
            e.preventDefault();
            setError('');
            try {
                if (mode === 'signup') {
                    if (!isPasswordStrongEnough(password)) {
                        setError('Password must be at least 6 characters and include both a letter and a number.');
                        return;
                    }
                    // See the commented-out agreedToTerms state above -- re-enable this
                    // check once there's a real Terms of Service / Privacy Policy to agree to.
                    // if (!agreedToTerms) {
                    //     setError('You must accept the Terms of Service and Privacy Policy to create an account.');
                    //     return;
                    // }
                    await applyPersistence();
                    const credential = await createUserWithEmailAndPassword(auth, email, password);
                    await updateProfile(credential.user, { displayName: name });
                    justSignedUpRef.current = true;
                } else {
                    await applyPersistence();
                    await signInWithEmailAndPassword(auth, email, password);
                }
            } catch (err) {
                setError(err.message);
            }
        }
    
    return (
        <div className="login-form">
            <h2>Sign in or create an account</h2>
            <button type="button" className="google-login" onClick={handleGoogleLogin}>
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.92c1.7-1.57 2.68-3.88 2.68-6.64z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.27c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.34C2.44 15.98 5.48 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.97 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.96H.96C.35 6.18 0 7.55 0 9s.35 2.82.96 4.04l3.01-2.34z"/>
                    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58z"/>
                </svg>
                Log in with Google
            </button>

            <label className='spacer'>or</label>

            <form onSubmit={HandleEmailSubmit}>
                {mode === 'signup' && (
                    <>
                        <p>Preferred Name</p>
                        <input type="name"
                        placeholder="Dr. Meow Meow"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required />
                    </>
                )}

                <p>Email</p>
                <input type="email"
                placeholder={mode === 'signup' ? 'name@domain.com' : 'Enter your email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required />
                
                <p>Password</p>
                <input type ="password"
                placeholder={mode === 'signup' ? 'Must be at least six characters' : 'Enter your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required />
                {mode === 'signup' && (
                    <small className="password-hint">Must be at least 6 characters, with at least one letter and one number.</small>
                )}

                <label className="checkbox-row">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    Remember me for faster sign-in
                </label>

                {/* Commented out along with the agreedToTerms state above and its check in
                    HandleEmailSubmit -- there's no real Terms of Service or Privacy Policy
                    written yet, so there's nothing real for the user to be agreeing to. Re-enable
                    all three once those pages exist. */}
                {/* {mode === 'signup' && (
                    <label className="checkbox-row">
                        <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} required />
                        <span>By clicking "Create account", you accept Dr. Meow-Meow's Terms of Service and Privacy Policy.</span>
                    </label>
                )} */}

                <p></p>

                <button type="submit">
                    {mode === 'signup' ? 'Create account' : 'Log in'}
                </button>
            </form>

            <button type="button" onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
                {mode === 'signup' ? 'Already have an account? Log in' : "Sign up"}
            </button>

            {error && <p style={{color: 'red'}}>{error}</p>}
            {resetMessage && <p style={{color: 'green'}}>{resetMessage}</p>}

            <p className="forgot-login">
                Forgot your login? {' '}
                <button type="button" className="link-button" onClick={handleResetPassword}>
                    Reset it here
                </button>
            </p>
            </div>

    );
}

export default loginPage;