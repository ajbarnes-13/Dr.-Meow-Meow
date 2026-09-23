import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import useUnsavedChangesGuard from '../components/unsavedChangesGuard';
import './addVet.css';

// This is the "Add a New Vet" page. It lets a user type in a vet's info,
// save it, and optionally attach that vet to one pet (or all their pets)
// as that pet's main vet.
function addVet () {
    const navigate = useNavigate(); // lets us send the user to a different page after saving

    const [form, setform] = useState({});        // holds everything typed into the text boxes
    const [pets, setPets] = useState([]);         // the list of this user's pets, loaded from the server
    const [petId, setPetId] = useState('');       // which single pet is picked in the dropdown
    const [assignToAll, setAssignToAll] = useState(false); // whether the "all pets" checkbox is checked

    // Anything typed in, picked, or checked counts as an unsaved change.
    const dirty = Object.keys(form).length > 0 || petId !== '' || assignToAll;
    const { guardedNavigate, modal } = useUnsavedChangesGuard(dirty);

    // When the page first loads, ask the server for this user's pets so we
    // can list them in the dropdown below.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) return; // not logged in yet, nothing to load
            user.getIdToken().then(token => {
                fetch(`${import.meta.env.VITE_API_BASE_URL}/pets`, {
                    headers: { Authorization: `Bearer ${token}` } // proves who's asking
                })
                .then(res => res.ok ? res.json() : [])
                .then(setPets);
            });
        });
        return unsubscribe;
    }, []);

    // Makes a "type into this box, update the form" handler for any field.
    // e.g. onChange('vet_name') gives an input that updates form.vet_name as you type.
    const onChange = (field) => (e) => setform({...form, [field]: e.target.value});

    // Updates one pet's record on the server so its "main vet" is the new vet
    // we just created. We have to send the pet's whole record back (not just
    // the vet field) because that's what the server requires.
    const assignVetToPet = (pet, newVetId, authHeaders) =>
        fetch(`${import.meta.env.VITE_API_BASE_URL}/pets/${pet.pet_id}`, {
            method: 'PUT',
            headers: authHeaders,
            body: JSON.stringify({
                ...pet,
                intact: Boolean(pet.intact), // the server needs true/false here, not 0/1
                primary_vet_id: newVetId,
            })
        });

    // Runs when the user clicks "Save". Creates the vet's office, then the
    // vet themselves, then (if requested) attaches the vet to pets.
    const onSubmit = async (e) => {
        e.preventDefault(); // stop the browser from doing its normal full-page form submit
        const token = await auth.currentUser.getIdToken();
        const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

        // Step 1: save the vet's office/clinic (address, phone, etc.)
        const officeResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/vet_offices`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                office_name: form.office_name,
                office_address: form.office_address,
                address_2: form.address_2,
                city: form.city,
                office_state: form.office_state,
                zip_code: form.zip_code,
            })
        });
        if (!officeResponse.ok) return; // something went wrong saving the office, stop here
        const office = await officeResponse.json();

        // Step 2: save the vet themselves, linked to the office we just created
        const vetResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/vets`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                vet_name: form.vet_name,
                office_name_id: office.vet_office_id,
                phone_number: form.phone_number,
                website: form.website,
            })
        });
        if (!vetResponse.ok) return; // something went wrong saving the vet, stop here
        const newVet = await vetResponse.json();

        // Step 3: attach the new vet to either every pet, or just the one picked
        const petsToAssign = assignToAll ? pets : pets.filter(p => p.pet_id === Number(petId));
        await Promise.all(petsToAssign.map(p => assignVetToPet(p, newVet.vet_id, authHeaders)));

        navigate(`/home`); // done — send the user back to the home page
    };

    return (
        <form className="add-vet-page" onSubmit={onSubmit}>
            <h1 className="add-vet-title">Add New Vet</h1>
            <p className="add-vet-required-note">Fields marked * are required.</p>
            <br></br>

            {/* Vet/office info, plus optionally assigning the new vet to a pet -- all one container */}
            <div className="add-vet-form">
                <h3>Vet Info</h3>
                <p className="staged-list-hint">If you fill in Address, City, or State, all three are required together.</p>
                <div className="add-vet-fields">
                    <div className="add-vet-field">
                        <p>Vet Name *</p>
                        <input value={form.vet_name || ''} onChange={onChange('vet_name')} placeholder="Dr. Meow Meow" />
                    </div>
                    <div className="add-vet-field add-vet-field-wide">
                        <p>Vet Office *</p>
                        <input value={form.office_name || ''} onChange={onChange('office_name')} placeholder="Sacred Whisker Vetrinary Hospital" />
                    </div>
                    <div className="add-vet-field">
                        <p>Address:</p>
                        <input value={form.office_address || ''} onChange={onChange('office_address')} placeholder="666 Cat Scratch Lane" />
                    </div>
                    <div className="add-vet-field">
                        <p>Address 2:</p>
                        <input value={form.address_2 || ''} onChange={onChange('address_2')} placeholder="Suite 666" />
                    </div>
                    <div className="add-vet-field">
                        <p>City:</p>
                        <input value={form.city || ''} onChange={onChange('city')} placeholder="Tabby Town" />
                    </div>
                    <div className="add-vet-field">
                        <p>State:</p>
                        <input value={form.office_state || ''} onChange={onChange('office_state')} placeholder="Kansas" />
                    </div>
                    <div className="add-vet-field">
                        <p>Zip Code:</p>
                        <input value={form.zip_code || ''} onChange={onChange('zip_code')} placeholder="66044" />
                    </div>
                    <div className="add-vet-field">
                        <p>Phone Number *</p>
                        <input value={form.phone_number || ''} onChange={onChange('phone_number')} placeholder="785-555-5555" />
                    </div>
                    <div className="add-vet-field">
                        <p>Website:</p>
                        <input value={form.website || ''} onChange={onChange('website')} placeholder="www.drmeowmeow.com" />
                    </div>
                    <div className="add-vet-field">
                        <p>Assign to Pet:</p>
                        <select value={petId} onChange={e => setPetId(e.target.value)} disabled={assignToAll}>
                            <option value="">Select a Pet:</option>
                            {pets.map(p => (
                                <option key={p.pet_id} value={p.pet_id}>{p.pet_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="add-vet-field">
                        <label className="add-vet-checkbox">
                            Assign to all my pets
                            <input type="checkbox" checked={assignToAll} onChange={e => setAssignToAll(e.target.checked)} />
                        </label>
                    </div>
                </div>

                <p className="staged-list-hint">To assign a vet to a pet, choose a pet or check "Assign to all my pets".</p>
            </div>

            <div className="add-vet-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => guardedNavigate('/home')}>Cancel</button>
            </div>
            {modal}
        </form>
    );
}

export default addVet;
