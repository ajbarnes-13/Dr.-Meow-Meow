import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import EditableFieldList, { buildFieldPayload, hasAnyValue } from '../components/editableFieldList';
import useUnsavedChangesGuard from '../components/unsavedChangesGuard';
import './editPetProfile.css';
// Reused for the same form/section "card" look as Add New Pet.
import './addPet.css';
// Reused for the pet photo/name header styling at the top of the page.
import './petProfile.css';

// FIREBASE STORAGE PHOTO UPLOAD -- on hold until Storage billing (Blaze plan) is turned on.
// To re-enable: uncomment this import and the "storage" import below, plus the
// onPhotoSelected function and the upload <label> block further down, then swap the
// plain <img> back for the version that opens the file picker.
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Picks a stand-in picture by species for pets that don't have a real photo uploaded yet.
// These files live in frontend-react/public, so they're referenced by plain root path
// (like the site mascot in App.jsx) instead of being imported.
function getDefaultPhoto(petType) {
    const type = (petType || '').toLowerCase();
    if (type === 'cat') return '/default_cat_pfp.png';
    if (type === 'dog') return '/default_dog_pfp.png';
    return '/default_other_pfp.png';
}

function calculateAge(birthdate) {
    if (!birthdate) return null;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const hadBirthdayThisYear = today.getMonth() > birth.getMonth()
        || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    if (!hadBirthdayThisYear) age -= 1;
    return age;
}

function EditPetProfile() {
    const location = useLocation();
    const navigate = useNavigate();
    const pet = location.state?.pet;

    useEffect(() => {
        if (!pet) navigate('/pets');
    }, [pet, navigate]);

    const [form, setform] = useState(pet ?? {});
    const [vets, setVets] = useState([]);
    const [medications, setMedications] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [healthConditions, setHealthConditions] = useState([]);
    const [food, setFood] = useState([]);
    const [behaviors, setBehaviors] = useState([]);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [error, setError] = useState('');

    // One blank draft per resource, for the "add new" card at the end of
    // each list -- picked up and created by onSubmit below when there's
    // anything in it, rather than each card having its own separate "+ Add".
    const [newMedication, setNewMedication] = useState({});
    const [newVaccine, setNewVaccine] = useState({});
    const [newHealthCondition, setNewHealthCondition] = useState({});
    const [newFood, setNewFood] = useState({});
    const [newBehavior, setNewBehavior] = useState({});

    const computedAge = calculateAge(form.birthdate);
    const vetOptions = vets.map(v => ({ value: v.vet_id, label: v.vet_name }));

    // Field configs for the editable-field-card sections below -- same shape
    // as Add New Pet's staged-list fields, so the two pages describe these
    // resources the same way even though one edits existing records and the
    // other stages brand new ones.
    const medicationFields = [
        { key: 'medication_name', label: 'Medication' },
        { key: 'reason', label: 'Reason' },
        { key: 'vet_prescribed_by_id', label: 'Prescribed By', type: 'select', options: vetOptions },
        { key: 'dosage', label: 'Dosage' },
        { key: 'time_to_take', label: 'Time to Take', type: 'time' },
        { key: 'times_per_day', label: 'Times Per Day', type: 'number' },
        { key: 'with_food', label: 'With Food?', type: 'checkbox' },
        { key: 'date_prescribed', label: 'Date Prescribed', type: 'date' },
        { key: 'next_dose_due', label: 'Next Dose Due', type: 'date' },
        { key: 'date_stopped', label: 'Date Stopped', type: 'date' },
    ];

    const vaccineFields = [
        { key: 'vaccine_name', label: 'Vaccine' },
        { key: 'date_given', label: 'Date Given', type: 'date' },
        { key: 'next_due_date', label: 'Next Due Date', type: 'date' },
        { key: 'vet_id', label: 'Vet', type: 'select', options: vetOptions },
    ];

    const healthConditionFields = [
        { key: 'condition', label: 'Health Condition' },
        { key: 'treatment', label: 'Treatment' },
        { key: 'date_diagnosed', label: 'Diagnosis Date', type: 'date' },
        { key: 'vet_diagnosed_by_id', label: 'Diagnosed By', type: 'select', options: vetOptions },
    ];

    const foodFields = [
        { key: 'brand', label: 'Brand' },
        { key: 'food_type', label: 'Wet or Dry' },
        { key: 'flavor', label: 'Flavor' },
        { key: 'how_much', label: 'How Much' },
        { key: 'how_often', label: 'How Often' },
        { key: 'health_consideration', label: 'Health Consideration' },
        { key: 'date_started', label: 'Date Started', type: 'date' },
        { key: 'date_stopped', label: 'Date Stopped', type: 'date' },
    ];

    const behaviorFields = [
        { key: 'behavior', label: 'Behavior' },
        { key: 'date_started', label: 'Date Started', type: 'date' },
        { key: 'frequency', label: 'Frequency' },
        { key: 'total_occurrences', label: 'Total Occurrences', type: 'number' },
        { key: 'date_stopped', label: 'Date Stopped', type: 'date' },
    ];

    // The Pet Info/Microchip fields (all part of `form`) changed from the pet's
    // original record, or any of the 5 "add new" cards actually has something
    // typed into it.
    const dirty = pet && (JSON.stringify(form) !== JSON.stringify(pet)
        || hasAnyValue(medicationFields, newMedication)
        || hasAnyValue(vaccineFields, newVaccine)
        || hasAnyValue(healthConditionFields, newHealthCondition)
        || hasAnyValue(foodFields, newFood)
        || hasAnyValue(behaviorFields, newBehavior));
    const { guardedNavigate, modal } = useUnsavedChangesGuard(dirty);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user || !pet) return;
            user.getIdToken().then(token => {
                const headers = { Authorization: `Bearer ${token}` };

                fetch(`${import.meta.env.VITE_API_BASE_URL}/vets`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setVets);

                fetch(`${import.meta.env.VITE_API_BASE_URL}/medications?pet_id=${pet.pet_id}`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setMedications);

                fetch(`${import.meta.env.VITE_API_BASE_URL}/vaccines?pet_id=${pet.pet_id}`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setVaccines);

                fetch(`${import.meta.env.VITE_API_BASE_URL}/health_conditions?pet_id=${pet.pet_id}`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setHealthConditions);

                fetch(`${import.meta.env.VITE_API_BASE_URL}/foods?pet_id=${pet.pet_id}`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setFood);

                fetch(`${import.meta.env.VITE_API_BASE_URL}/behaviors?pet_id=${pet.pet_id}`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setBehaviors);
                });
            });
            return unsubscribe;
        }, [pet]);

        // Shared by the "Save" handlers for medications/vaccines/health conditions/
        // food/behaviors below -- PUTs the edit and swaps the updated record into
        // the matching list in place. Same pattern as petProfile.jsx's tabs, minus
        // delete (that stays on the pet profile page, not here).
        const saveResource = async (resource, id, idField, data, setState) => {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/${resource}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                console.error(await response.json());
                return false;
            }

            const updated = await response.json();
            setState(prev => prev.map(item => item[idField] === id ? updated : item));
            return true;
        };

        const onSaveMedication = (id, data) => saveResource('medications', id, 'medication_id', data, setMedications);
        const onSaveVaccine = (id, data) => saveResource('vaccines', id, 'vaccine_id', data, setVaccines);
        const onSaveHealthCondition = (id, data) => saveResource('health_conditions', id, 'condition_id', data, setHealthConditions);
        const onSaveFood = (id, data) => saveResource('foods', id, 'food_id', data, setFood);
        const onSaveBehavior = (id, data) => saveResource('behaviors', id, 'behavior_id', data, setBehaviors);

        const onChange = (field) => (e) => setform({...form, [field]: e.target.value});

        const onSubmit = async (e) => {
            e.preventDefault();
            setError('');
            const token = await auth.currentUser.getIdToken();
            const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pets/${pet.pet_id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    ...form,
                    age: computedAge !== null ? computedAge : Number(form.age),
                    intact: Boolean(form.intact),
                    primary_vet_id: form.primary_vet_id ? Number(form.primary_vet_id) : null,
                })
            });

            if (!response.ok) {
                console.error(await response.json());
                setError('Could not save this pet. Please check the form and try again.');
                return;
            }

            // Any "add new" card that actually has something typed into it gets
            // created now, alongside the pet itself, instead of needing its own
            // separate "+ Add" button.
            const drafts = [
                { resource: 'medications', fields: medicationFields, draft: newMedication },
                { resource: 'vaccines', fields: vaccineFields, draft: newVaccine },
                { resource: 'health_conditions', fields: healthConditionFields, draft: newHealthCondition },
                { resource: 'foods', fields: foodFields, draft: newFood },
                { resource: 'behaviors', fields: behaviorFields, draft: newBehavior },
            ].filter(({ fields, draft }) => hasAnyValue(fields, draft));

            const results = await Promise.all(drafts.map(({ resource, fields, draft }) => fetch(`${import.meta.env.VITE_API_BASE_URL}/${resource}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(buildFieldPayload(fields, draft, pet.pet_id))
            })));

            if (results.some(res => !res.ok)) {
                setError("The pet was saved, but one of the new entries you started couldn't be added. Please check it and try again.");
                return;
            }

            navigate(`/petProfile/${pet.pet_id}`);
        };

        // Runs when the user confirms deletion in the pop-up warning below.
        const onDeletePet = async () => {
            const token = await auth.currentUser.getIdToken();
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pets/${pet.pet_id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.status === 204) {
                navigate('/pets');
            } else {
                console.error(await response.json());
                setDeleteConfirmOpen(false);
            }
        };

        if (!pet) return null;

    return (
        <>
        <form onSubmit={onSubmit}>
            <h1 className="add-pet-title">Edit {form.pet_name || 'Pet'}'s Profile</h1>
            <br></br>
            <div className="pet-profile-header">
                {/* FIREBASE STORAGE PHOTO UPLOAD -- swap this <img> for the commented-out
                    <label>/<input> block below once uploads are re-enabled. */}
                <img
                    src={form.pet_photo_url ? form.pet_photo_url : getDefaultPhoto(form.pet_type)}
                    alt={`${form.pet_name || 'Pet'}'s photo`}
                    className="pet-photo"
                />
            </div>

            <div className="add-pet-sections">
            <div className="add-pet-column">
            <div className="add-pet-form">
                <h3>Pet Info</h3>

                <div className="add-pet-fields">
                    <div className="add-pet-field">
                        <p>Pet Name:</p>
                        <input value={form.pet_name} onChange={onChange('pet_name')} placeholder="Name" />
                    </div>
                    <div className="add-pet-field">
                        <p>Type of Pet:</p>
                        <input value={form.pet_type} onChange={onChange('pet_type')} placeholder="Type" />
                    </div>
                    <div className="add-pet-field">
                        <p>Breed:</p>
                        <input value={form.breed || ''} onChange={onChange('breed')} placeholder="Breed" />
                    </div>
                    <div className="add-pet-field">
                        <p>Age:</p>
                        <input
                            type="number"
                            value={computedAge !== null ? computedAge : (form.age || '')}
                            onChange={onChange('age')}
                            placeholder="Age"
                            disabled={computedAge !== null}
                        />
                    </div>
                    <div className="add-pet-field">
                        <p>Birthdate:</p>
                        <input type="date" value={form.birthdate?.slice(0, 10) || ''} onChange={onChange('birthdate')} />
                    </div>
                    <div className="add-pet-field">
                        <p>Adoption Date:</p>
                        <input type="date" value={form.adoption_date?.slice(0, 10) || ''} onChange={onChange('adoption_date')} />
                    </div>
                    <div className="add-pet-field">
                        <p>Deceased Date:</p>
                        <input type="date" value={form.deceased_date?.slice(0, 10) || ''} onChange={onChange('deceased_date')} />
                    </div>
                    <div className="add-pet-field">
                        <p>Adopted From:</p>
                        <input value={form.came_from} onChange={onChange('came_from')} placeholder="Came From" />
                    </div>
                    <div className="add-pet-field">
                        <p>Eye Color:</p>
                        <input value={form.eye_color || ''} onChange={onChange('eye_color')} placeholder="Eye Color" />
                    </div>
                    <div className="add-pet-field">
                        <p>Whisker Color:</p>
                        <input value={form.whisker_color || ''} onChange={onChange('whisker_color')} placeholder="Whisker Color" />
                    </div>
                    <div className="add-pet-field">
                        <p>Vocal Level:</p>
                        <input value={form.vocal_level || ''} onChange={onChange('vocal_level')} placeholder="Vocal Level" />
                    </div>
                    <div className="add-pet-field">
                        <p>Sex:</p>
                        <input value={form.sex} onChange={onChange('sex')} placeholder="Sex" />
                    </div>
                    <div className="add-pet-field">
                        <p>Weight:</p>
                        <input value={form.pet_weight} onChange={onChange('pet_weight')} placeholder="Weight" />
                    </div>
                    <div className="add-pet-field">
                        <p>Spay / Neuter Date:</p>
                        <input type="date" value={form.spay_neuter_date?.slice(0, 10) || ''} onChange={onChange('spay_neuter_date')} />
                    </div>
                    <div className="add-pet-field">
                        <label className="add-pet-checkbox">
                            Intact
                            <input type="checkbox" checked={Boolean(form.intact)} onChange={e => setform({...form, intact: e.target.checked})} />
                        </label>
                    </div>
                    <div className="add-pet-field">
                        <p>Primary Vet:</p>
                        <select value={form.primary_vet_id || ''} onChange={onChange('primary_vet_id')}>
                            <option value="">No primary vet</option>
                            {vets.map(v => (
                                <option key={v.vet_id} value={v.vet_id}>{v.vet_name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/*
            <label className="pet-photo-upload">
                <img
                    src={hasRealPhoto ? pet.pet_photo_url : getDefaultPhoto(pet.pet_type)}
                    alt={hasRealPhoto ? `${pet.pet_name}'s photo` : `Default ${pet.pet_type || 'pet'} illustration`}
                    className="pet-photo"
                />
                <input type="file" accept="image/*" onChange={onPhotoSelected} hidden />
                <span className="pet-photo-upload-label">{uploading ? 'Uploading...' : 'Change photo'}</span>
            </label>
            */}

            {/* Existing vaccines can be edited right here, same as Medications/Health
                Conditions/Food/Behaviors below -- a blank card at the end of the list
                is ready for a new one, created together with the rest of this form
                when "Save Changes" is clicked. */}
            <div className="add-pet-form">
                <h3>Vaccines</h3>
                <EditableFieldList fields={vaccineFields} items={vaccines} idField="vaccine_id" petId={pet.pet_id} onSave={onSaveVaccine} draft={newVaccine} onDraftChange={setNewVaccine} />
            </div>

            <div className="add-pet-form">
                <h3>Microchip</h3>
                <div className="add-pet-fields">
                    <div className="add-pet-field">
                        <p>Microchip Number:</p>
                        <input value={form.microchip_number || ''} onChange={onChange('microchip_number')} placeholder="Microchip Number" />
                    </div>
                    <div className="add-pet-field">
                        <p>Date Microchipped:</p>
                        <input type="date" value={form.date_microchipped?.slice(0, 10) || ''} onChange={onChange('date_microchipped')} />
                    </div>
                    <div className="add-pet-field">
                        <p>Microchip Company:</p>
                        <input value={form.microchip_company || ''} onChange={onChange('microchip_company')} placeholder="Microchip Company" />
                    </div>
                    <div className="add-pet-field">
                        <p>Website:</p>
                        <input value={form.microchip_url || ''} onChange={onChange('microchip_url')} placeholder="https://..." />
                    </div>
                </div>
            </div>
            </div>

            {/* Existing medications/health conditions/food/behaviors can be edited
                right here, and a blank card at the end of each list is ready for a
                new one -- it's created together with the rest of this form when
                "Save Changes" is clicked, rather than needing its own "+ Add" button.
                Deleting an existing one still happens from the pet's own profile page. */}
            <div className="add-pet-column pet-profile-tab-content">
                <div className="add-pet-form">
                    <h3>Medications</h3>
                    <EditableFieldList fields={medicationFields} items={medications} idField="medication_id" petId={pet.pet_id} onSave={onSaveMedication} draft={newMedication} onDraftChange={setNewMedication} />
                </div>

                <div className="add-pet-form">
                    <h3>Health Conditions</h3>
                    <EditableFieldList fields={healthConditionFields} items={healthConditions} idField="condition_id" petId={pet.pet_id} onSave={onSaveHealthCondition} draft={newHealthCondition} onDraftChange={setNewHealthCondition} />
                </div>

                <div className="add-pet-form">
                    <h3>Food</h3>
                    <EditableFieldList fields={foodFields} items={food} idField="food_id" petId={pet.pet_id} onSave={onSaveFood} draft={newFood} onDraftChange={setNewFood} />
                </div>
            </div>
            </div>

            {/* Sits on its own, centered on the page above Save/Cancel, rather than
                inside either column. */}
            <div className="add-pet-form add-pet-centered-section">
                <h3>Behaviors</h3>
                <EditableFieldList fields={behaviorFields} items={behaviors} idField="behavior_id" petId={pet.pet_id} onSave={onSaveBehavior} draft={newBehavior} onDraftChange={setNewBehavior} />
            </div>

            {error && <p className="add-pet-error">{error}</p>}

            <div className="add-pet-actions">
                <button type="submit">Save Changes</button>
                <button type="button" onClick={() => guardedNavigate(`/petProfile/${pet.pet_id}`)}>Cancel</button>
            </div>
            <div className="add-pet-actions">
                <button className="delete-pet-button" type="button" onClick={() => setDeleteConfirmOpen(true)}>Delete Pet</button>
            </div>
            {modal}
        </form>

        {deleteConfirmOpen && (
            <div className="delete-confirm-overlay">
                <div className="delete-confirm-box">
                    <p>Delete {form.pet_name || 'this pet'}? This can't be undone.</p>
                    <button type="button" onClick={() => setDeleteConfirmOpen(false)}>Cancel</button>
                    <button type="button" className="delete-pet-button" onClick={onDeletePet}>Yes, Delete</button>
                </div>
            </div>
        )}
        </>
    )
}

export default EditPetProfile;
