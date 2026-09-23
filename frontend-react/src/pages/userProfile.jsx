import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    onAuthStateChanged,
    updateProfile,
    verifyBeforeUpdateEmail,
    updatePassword,
    deleteUser,
    reauthenticateWithCredential,
    reauthenticateWithPopup,
    EmailAuthProvider,
    signOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import './userProfile.css';

// This is the "My Profile" page: account-level settings for the signed-in
// person themselves (name, email, password, deleting the account) -- not
// their pets. The pet/appointment dashboard lives on the home page instead.
function UserProfile() {
    const navigate = useNavigate();

    // Seeded straight from auth.currentUser rather than waiting on the
    // onAuthStateChanged callback below, since this page is only reachable
    // through RequireAuth, which already confirmed someone's signed in.
    const [user, setUser] = React.useState(auth.currentUser);
    const [name, setName] = React.useState(auth.currentUser?.displayName || '');
    const [nameStatus, setNameStatus] = React.useState({ error: '', success: '' });

    const [newEmail, setNewEmail] = React.useState('');
    const [emailPassword, setEmailPassword] = React.useState('');
    const [emailStatus, setEmailStatus] = React.useState({ error: '', success: '' });

    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmNewPassword, setConfirmNewPassword] = React.useState('');
    const [passwordStatus, setPasswordStatus] = React.useState({ error: '', success: '' });

    const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
    const [deletePassword, setDeletePassword] = React.useState('');
    const [deleteStatus, setDeleteStatus] = React.useState({ error: '', busy: false });

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (u) setName(u.displayName || '');
        });
        return unsubscribe;
    }, []);

    // Google accounts don't have a Firebase password, so email/password
    // changes and account deletion all need a different way to re-prove it's
    // really them: a password field for email/password accounts, a Google
    // sign-in popup for Google accounts.
    const isGoogleAccount = user?.providerData?.[0]?.providerId === 'google.com';

    const reauthenticate = async (password) => {
        if (isGoogleAccount) {
            await reauthenticateWithPopup(auth.currentUser, googleProvider);
            return;
        }
        const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
    };

    const onSaveName = async (e) => {
        e.preventDefault();
        setNameStatus({ error: '', success: '' });
        try {
            await updateProfile(auth.currentUser, { displayName: name });
            setNameStatus({ error: '', success: 'Name updated.' });
        } catch (err) {
            setNameStatus({ error: err.message, success: '' });
        }
    };

    const onSaveEmail = async (e) => {
        e.preventDefault();
        setEmailStatus({ error: '', success: '' });

        try {
            await reauthenticate(emailPassword);
            // Sends a confirmation link to the new address -- the email on the
            // account doesn't actually change until that link is clicked, which
            // is what current Firebase/Google policy requires for email changes.
            await verifyBeforeUpdateEmail(auth.currentUser, newEmail);
            setEmailStatus({ error: '', success: `Check ${newEmail} for a link to confirm the change.` });
            setNewEmail('');
            setEmailPassword('');
        } catch (err) {
            setEmailStatus({ error: err.message, success: '' });
        }
    };

    const onSavePassword = async (e) => {
        e.preventDefault();
        setPasswordStatus({ error: '', success: '' });

        if (newPassword.length < 6) {
            setPasswordStatus({ error: 'New password must be at least six characters.', success: '' });
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setPasswordStatus({ error: "New passwords don't match.", success: '' });
            return;
        }

        try {
            await reauthenticate(currentPassword);
            await updatePassword(auth.currentUser, newPassword);
            setPasswordStatus({ error: '', success: 'Password updated.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err) {
            setPasswordStatus({ error: err.message, success: '' });
        }
    };

    const onLogOut = async () => {
        await signOut(auth);
        navigate('/login');
    };

    const onDeleteAccount = async () => {
        setDeleteStatus({ error: '', busy: true });

        try {
            await reauthenticate(deletePassword);

            // Deleting the Firebase account doesn't touch anything in this
            // app's own database -- pets aren't linked to it in any way that
            // cascades. Delete this user's pets first (the API cascades each
            // pet's own vaccines/medications/health conditions/appointments/
            // food/behaviors along with it), so nothing is left behind
            // pointing at a user that no longer exists.
            const token = await auth.currentUser.getIdToken();
            const petsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const pets = petsResponse.ok ? await petsResponse.json() : [];
            const deleteResults = await Promise.all(pets.map(pet => fetch(`${import.meta.env.VITE_API_BASE_URL}/pets/${pet.pet_id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })));

            // Not expected to trigger -- deleting a pet cleans up everything
            // linked to it server-side -- but if a pet delete fails for some
            // other reason (a dropped connection, etc.), stop here rather than
            // deleting the account out from under data that's still sitting
            // in the database with no way back to it.
            if (deleteResults.some(res => !res.ok)) {
                setDeleteStatus({
                    error: "Something went wrong deleting your data. Please try again, or contact support if this keeps happening.",
                    busy: false,
                });
                return;
            }

            await deleteUser(auth.currentUser);
            navigate('/login');
        } catch (err) {
            setDeleteStatus({ error: err.message, busy: false });
        }
    };

    if (!user) return null;

    return (
        <div className="user-profile-page">
            <h1>My Profile</h1>

            <section className="user-profile-section">
                <h2>Preferred Name</h2>
                <form onSubmit={onSaveName}>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Preferred Name"
                        required
                    />
                    <button type="submit">Save</button>
                </form>
                {nameStatus.error && <p className="user-profile-error">{nameStatus.error}</p>}
                {nameStatus.success && <p className="user-profile-success">{nameStatus.success}</p>}
            </section>

            <section className="user-profile-section">
                <h2>Email</h2>
                <p>Current: {user.email}</p>
                {isGoogleAccount ? (
                    <p>Your email is managed by your Google account and can't be changed here.</p>
                ) : (
                    <form onSubmit={onSaveEmail}>
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="New email address"
                            required
                        />
                        <input
                            type="password"
                            value={emailPassword}
                            onChange={(e) => setEmailPassword(e.target.value)}
                            placeholder="Current password"
                            required
                        />
                        <button type="submit">Save</button>
                    </form>
                )}
                {emailStatus.error && <p className="user-profile-error">{emailStatus.error}</p>}
                {emailStatus.success && <p className="user-profile-success">{emailStatus.success}</p>}
            </section>

            <section className="user-profile-section">
                <h2>Password</h2>
                {isGoogleAccount ? (
                    <p>You sign in with Google, so there's no separate password to change here.</p>
                ) : (
                    <form onSubmit={onSavePassword}>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Current password"
                            required
                        />
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            required
                        />
                        <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Confirm new password"
                            required
                        />
                        <button type="submit">Save</button>
                    </form>
                )}
                {passwordStatus.error && <p className="user-profile-error">{passwordStatus.error}</p>}
                {passwordStatus.success && <p className="user-profile-success">{passwordStatus.success}</p>}
            </section>

            <section className="user-profile-section">
                <button type="button" onClick={onLogOut}>Log Out</button>
            </section>

            <section className="user-profile-section">
                <h2>Delete Account</h2>
                <p>This permanently deletes your account, along with all of your pets, appointments, and other saved data. This can't be undone.</p>
                <button type="button" className="delete-account-button" onClick={() => setDeleteConfirmOpen(true)}>Delete Account</button>
            </section>

            {deleteConfirmOpen && (
                <div className="delete-confirm-overlay">
                    <div className="delete-confirm-box">
                        <p>Are you sure you want to delete your account? All of your pets and data will be permanently deleted. This can't be undone.</p>

                        {!isGoogleAccount && (
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Current password"
                            />
                        )}

                        {deleteStatus.error && <p className="user-profile-error">{deleteStatus.error}</p>}

                        <div className="delete-confirm-actions">
                            <button type="button" onClick={() => setDeleteConfirmOpen(false)} disabled={deleteStatus.busy}>Cancel</button>
                            <button type="button" className="delete-account-button" onClick={onDeleteAccount} disabled={deleteStatus.busy}>
                                {deleteStatus.busy ? 'Deleting…' : 'Yes, Delete My Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserProfile;
