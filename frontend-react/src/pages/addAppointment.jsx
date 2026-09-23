import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import useUnsavedChangesGuard from '../components/unsavedChangesGuard';
import './addAppointment.css';

function addAppointment () {
    const navigate = useNavigate();
    const [form, setform] = useState({});
    const [pets, setPets] = useState([]);
    const [vets, setVets] = useState([]);
    const [petId, setPetId] = useState('');
    const [assignToAll, setAssignToAll] = useState(false);
    const [error, setError] = useState('');

    // Anything typed in, picked, or checked counts as an unsaved change.
    const dirty = Object.keys(form).length > 0 || petId !== '' || assignToAll;
    const { guardedNavigate, modal } = useUnsavedChangesGuard(dirty);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) return;
            user.getIdToken().then(token => {
                const authHeaders = { Authorization: `Bearer ${token}` };

                fetch(`${import.meta.env.VITE_API_BASE_URL}/pets`, { headers: authHeaders })
                    .then(res => res.ok ? res.json() : [])
                    .then(setPets);

                fetch(`${import.meta.env.VITE_API_BASE_URL}/vets`, { headers: authHeaders })
                    .then(res => res.ok ? res.json() : [])
                    .then(setVets);
            });
        });
        return unsubscribe;
    }, []);

    const onChange = (field) => (e) => setform({...form, [field]: e.target.value});

    const onVetChange = (e) => {
        const vetId = Number(e.target.value);
        const selectedVet = vets.find(v => v.vet_id === vetId);
        setform({
            ...form,
            vet_id: vetId,
            office_name_id: selectedVet ? selectedVet.office_name_id : '',
        });
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!assignToAll && !petId) {
            setError('Please choose a pet, or check "for all my pets".');
            return;
        }
        if (!form.vet_id) {
            setError('Please choose a vet.');
            return;
        }
        if (!form.appointment_date || !form.appointment_time || !form.reason) {
            setError('Please fill in the date, time, and reason.');
            return;
        }

        try {
            const token = await auth.currentUser.getIdToken();
            const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

            // An appointment already stores which pet it belongs to (pet_id) when it's
            // created, so "for all my pets" just means creating one appointment per pet --
            // there's no separate step needed to link it back onto the pet record.
            const petIdsToAssign = assignToAll ? pets.map(p => p.pet_id) : [Number(petId)];

            const responses = await Promise.all(petIdsToAssign.map(id => fetch(`${import.meta.env.VITE_API_BASE_URL}/appointments`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    pet_id: id,
                    vet_id: Number(form.vet_id),
                    office_name_id: Number(form.office_name_id),
                    reason: form.reason,
                    appointment_date: form.appointment_date,
                    appointment_time: form.appointment_time,
                })
            })));

            const failed = responses.find(r => !r.ok);
            if (failed) {
                const body = await failed.json();
                console.error(body);
                setError(body.error || 'Could not save the appointment. Please check the form and try again.');
                return;
            }

            navigate('/home');
        } catch (err) {
            console.error(err);
            setError('Could not reach the server. Please check your connection and try again.');
        }
    };

    return (
        <form className="add-appointment-page" onSubmit={onSubmit}>
            <h1 className="add-appointment-title">Add New Appointment</h1>
            <p className="add-appointment-required-note">Fields marked * are required.</p>
            <br />
            <div className="add-appointment-form">
                <h3>Appointment Info</h3>
                <p className="staged-list-hint">Choose a pet, or check "For all my pets" if the appointment is for all your pets.</p>
                <div className="add-appointment-fields">
                    <div className="add-appointment-field">
                        <p>My Pet *</p>
                        <select value={petId} onChange={e => setPetId(e.target.value)} disabled={assignToAll}>
                            <option value="">Choose a pet:</option>
                            {pets.map(p => (
                                <option key={p.pet_id} value={p.pet_id}>{p.pet_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="add-appointment-field">
                        <label className="add-appointment-checkbox">
                            For all my pets
                            <input type="checkbox" checked={assignToAll} onChange={e => setAssignToAll(e.target.checked)} />
                        </label>
                    </div>
                    <div className="add-appointment-field">
                        <p>Vet *</p>
                        <select value={form.vet_id || ''} onChange={onVetChange}>
                            <option value="">Choose a vet:</option>
                            {vets.map(v => (
                                <option key={v.vet_id} value={v.vet_id}>{v.vet_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="add-appointment-field">
                        <p>Date *</p>
                        <input type="date" value={form.appointment_date || ''} onChange={onChange('appointment_date')} />
                    </div>
                    <div className="add-appointment-field">
                        <p>Time *</p>
                        <input type="time" value={form.appointment_time || ''} onChange={onChange('appointment_time')} />
                    </div>
                    <div className="add-appointment-field">
                        <p>Reason *</p>
                        <input value={form.reason || ''} onChange={onChange('reason')} />
                    </div>
                </div>

                {error && <p className="add-appointment-error">{error}</p>}
            </div>

            <div className="add-appointment-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => guardedNavigate('/home')}>Cancel</button>
            </div>
            {modal}
        </form>
    );
}

export default addAppointment;