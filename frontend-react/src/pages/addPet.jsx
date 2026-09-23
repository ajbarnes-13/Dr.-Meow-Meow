import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import StagedListSection from '../components/stagedListSection';
import { hasAnyValue } from '../components/editableFieldList';
import useUnsavedChangesGuard from '../components/unsavedChangesGuard';
import './addPet.css';

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

// Works out a pet's current age in years from their birthdate, so the user
// doesn't have to type an age by hand and have it go stale.
function calculateAge(birthdate) {
    if (!birthdate) return null; // no birthdate entered yet, can't calculate
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const hadBirthdayThisYear = today.getMonth() > birth.getMonth()
        || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    if (!hadBirthdayThisYear) age -= 1; // birthday hasn't happened yet this year
    return age;
}

// This is the "Add a New Pet" page. It collects all the details about a pet
// and saves them, along with which vet is the pet's main vet.
function addPet() {
    const navigate = useNavigate(); // lets us send the user to a different page after saving
    const location = useLocation();
    const isWelcome = Boolean(location.state?.welcome); // true right after a brand-new signup
    const [form, setform] = useState({});   // holds everything typed into the form
    const [vets, setVets] = useState([]);   // the list of vets available to pick from
    const computedAge = calculateAge(form.birthdate); // auto-calculated age, if a birthdate was entered

    // Medications/vaccines/health conditions/food/behaviors staged to be created
    // right after the pet itself -- there's no pet_id for them to attach to
    // until the pet is actually saved.
    const [medications, setMedications] = useState([]);
    const [vaccines, setVaccines] = useState([]);
    const [healthConditions, setHealthConditions] = useState([]);
    const [foods, setFoods] = useState([]);
    const [behaviors, setBehaviors] = useState([]);

    // The fields currently typed into each section's own form, owned here
    // (not inside StagedListSection) so the page's single Save button can
    // pick this up too -- "+ Add Another" only exists for staging more than
    // one entry, it isn't a prerequisite for the first one to be saved.
    const [newVaccine, setNewVaccine] = useState({});
    const [newMedication, setNewMedication] = useState({});
    const [newHealthCondition, setNewHealthCondition] = useState({});
    const [newFood, setNewFood] = useState({});
    const [newBehavior, setNewBehavior] = useState({});
    const [error, setError] = useState('');
    const [createdPetId, setCreatedPetId] = useState(null);

    const vetOptions = vets.map(v => ({ value: v.vet_id, label: v.vet_name }));

    // Field configs for the five optional sections below -- pulled out to
    // named consts (rather than written inline on each StagedListSection)
    // since onSubmit also needs them, to tell whether a section's draft has
    // anything worth including.
    const vaccineFields = [
        { key: 'vaccine_name', label: 'Vaccine', required: true },
        { key: 'date_given', label: 'Date Given', type: 'date', required: true },
        { key: 'next_due_date', label: 'Next Due Date', type: 'date', required: true },
        { key: 'vet_id', label: 'Vet', type: 'select', required: true, options: vetOptions },
    ];

    const medicationFields = [
        { key: 'medication_name', label: 'Medication Name', required: true },
        { key: 'reason', label: 'Reason', required: true },
        { key: 'vet_prescribed_by_id', label: 'Prescribed By', type: 'select', required: true, options: vetOptions },
        { key: 'dosage', label: 'Dosage', required: true },
        { key: 'time_to_take', label: 'Time to Take', type: 'time', required: true },
        { key: 'times_per_day', label: 'Times Per Day', type: 'number', required: true },
        { key: 'with_food', label: 'With Food?', type: 'checkbox' },
        { key: 'date_prescribed', label: 'Date Prescribed', type: 'date', required: true },
        { key: 'next_dose_due', label: 'Next Dose Due', type: 'date', required: true },
        { key: 'date_stopped', label: 'Date Stopped (leave blank if still being given)', type: 'date' },
    ];

    const healthConditionFields = [
        { key: 'condition', label: 'Health Condition', required: true },
        { key: 'treatment', label: 'Treatment', required: true },
        { key: 'date_diagnosed', label: 'Diagnosis Date', type: 'date', required: true },
        { key: 'vet_diagnosed_by_id', label: 'Diagnosed By', type: 'select', required: true, options: vetOptions },
    ];

    const behaviorFields = [
        { key: 'behavior', label: 'Behavior', required: true },
        { key: 'date_started', label: 'Date Started', type: 'date', required: true },
        { key: 'frequency', label: 'Frequency', required: true },
        { key: 'total_occurrences', label: 'Total Occurrences', type: 'number', required: true },
        { key: 'date_stopped', label: 'Date Stopped', type: 'date' },
    ];

    const foodFields = [
        { key: 'brand', label: 'Brand', required: true },
        { key: 'food_type', label: 'Wet or Dry', required: true },
        { key: 'flavor', label: 'Flavor', required: true },
        { key: 'how_much', label: 'How Much', required: true },
        { key: 'how_often', label: 'How Often', required: true },
        { key: 'health_consideration', label: 'Health Consideration', required: true },
        { key: 'date_started', label: 'Date Started', type: 'date', required: true },
        { key: 'date_stopped', label: 'Date Stopped', type: 'date', required: true },
    ];

    // Anything typed into the form, staged in any of the five lists below, or
    // sitting unsaved in one of the five sections' own draft fields, counts
    // as an unsaved change.
    const dirty = Object.keys(form).length > 0
        || medications.length > 0 || vaccines.length > 0 || healthConditions.length > 0
        || foods.length > 0 || behaviors.length > 0
        || hasAnyValue(vaccineFields, newVaccine) || hasAnyValue(medicationFields, newMedication)
        || hasAnyValue(healthConditionFields, newHealthCondition) || hasAnyValue(foodFields, newFood)
        || hasAnyValue(behaviorFields, newBehavior);
    const { guardedNavigate, modal } = useUnsavedChangesGuard(dirty);

    // When the page first loads, ask the server for the list of vets so we
    // can offer them in the "primary vet" dropdown.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) return; // not logged in yet, nothing to load
            user.getIdToken().then(token => {
                fetch(`${import.meta.env.VITE_API_BASE_URL}/vets`, {
                    headers: { Authorization: `Bearer ${token}` } // proves who's asking
                })
                    .then(res => res.ok ? res.json() : [])
                    .then(setVets);
                });
            });
            return unsubscribe;
        }, []);

        // Makes a "type into this box, update the form" handler for any field.
        // e.g. onChange('pet_name') gives an input that updates form.pet_name as you type.
        const onChange = (field) => (e) => setform({...form, [field]: e.target.value});

        // Turns one staged item into the body the matching create endpoint expects.
        const buildMedicationPayload = (m, petId) => ({
            medication_name: m.medication_name,
            pet_id: petId,
            reason: m.reason,
            date_prescribed: m.date_prescribed,
            date_stopped: m.date_stopped,
            dosage: m.dosage,
            time_to_take: m.time_to_take,
            // The server expects this as a string, even though it's a count of
            // times per day -- matches how this field's validation works elsewhere.
            times_per_day: m.times_per_day,
            with_food: Boolean(m.with_food),
            next_dose_due: m.next_dose_due,
            vet_prescribed_by_id: Number(m.vet_prescribed_by_id),
        });

        const buildVaccinePayload = (v, petId) => ({
            pet_id: petId,
            vaccine_name: v.vaccine_name,
            date_given: v.date_given,
            next_due_date: v.next_due_date,
            vet_id: Number(v.vet_id),
        });

        const buildHealthConditionPayload = (c, petId) => ({
            condition: c.condition,
            pet_id: petId,
            date_diagnosed: c.date_diagnosed,
            vet_diagnosed_by_id: Number(c.vet_diagnosed_by_id),
            treatment: c.treatment,
        });

        const buildFoodPayload = (f, petId) => ({
            food_type: f.food_type,
            brand: f.brand,
            flavor: f.flavor,
            how_often: f.how_often,
            how_much: f.how_much,
            health_consideration: f.health_consideration,
            date_started: f.date_started,
            date_stopped: f.date_stopped,
            pet_id: petId,
        });

        const buildBehaviorPayload = (b, petId) => ({
            pet_id: petId,
            behavior: b.behavior,
            date_started: b.date_started,
            frequency: b.frequency,
            total_occurrences: Number(b.total_occurrences),
            date_stopped: b.date_stopped || '',
        });

        // POSTs every staged item in one list to its endpoint, once the pet exists
        // to attach them to. Returns the responses so the caller can check for failures.
        const createAll = (resource, items, buildPayload, petId, authHeaders) =>
            Promise.all(items.map(item => fetch(`${import.meta.env.VITE_API_BASE_URL}/${resource}`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(buildPayload(item, petId))
            })));

        // Runs when the user clicks "Save". Creates the pet, then everything
        // staged below (medications, vaccines, etc.) against the new pet's id.
        const onSubmit = async (e) => {
            e.preventDefault(); // stop the browser from doing its normal full-page form submit
            setError('');
            const token = await auth.currentUser.getIdToken();
            const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pets`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    ...form,
                    // Prefer the age we calculated from the birthdate; otherwise
                    // fall back to whatever number the user typed manually.
                    age: computedAge !== null ? computedAge : Number(form.age),
                    primary_vet_id: form.primary_vet_id ? Number(form.primary_vet_id) : null,
                    intact: Boolean(form.intact), // server needs true/false here, not a checkbox value
                })
            });

            if (!response.ok) {
                console.error(await response.json());
                setError('Could not save this pet. Please check the form and try again.');
                return;
            }

            const createdPet = await response.json();
            const petId = createdPet.pet_id;

            // Whatever's still sitting in each section's own fields counts too,
            // even if "+ Add Another" was never clicked -- that button is only
            // for staging more than one entry, not a prerequisite for saving.
            const allMedications = hasAnyValue(medicationFields, newMedication) ? [...medications, newMedication] : medications;
            const allVaccines = hasAnyValue(vaccineFields, newVaccine) ? [...vaccines, newVaccine] : vaccines;
            const allHealthConditions = hasAnyValue(healthConditionFields, newHealthCondition) ? [...healthConditions, newHealthCondition] : healthConditions;
            const allFoods = hasAnyValue(foodFields, newFood) ? [...foods, newFood] : foods;
            const allBehaviors = hasAnyValue(behaviorFields, newBehavior) ? [...behaviors, newBehavior] : behaviors;

            const results = await Promise.all([
                createAll('medications', allMedications, buildMedicationPayload, petId, authHeaders),
                createAll('vaccines', allVaccines, buildVaccinePayload, petId, authHeaders),
                createAll('health_conditions', allHealthConditions, buildHealthConditionPayload, petId, authHeaders),
                createAll('foods', allFoods, buildFoodPayload, petId, authHeaders),
                createAll('behaviors', allBehaviors, buildBehaviorPayload, petId, authHeaders),
            ]);

            if (results.flat().some(res => !res.ok)) {
                // The pet itself was saved -- don't strand the user with no way
                // forward, but let them know some of what they staged didn't
                // make it, so they know to double check the pet's profile.
                setCreatedPetId(petId);
                setError("The pet was saved, but some of the medications, vaccines, or other records couldn't be. You can add them from the pet's profile page.");
                return;
            }

            navigate(`/petProfile/${petId}`); // go straight to the new pet's page
    };

    return (
        <form onSubmit={onSubmit}>
            <h1 className="add-pet-title">Add New Pet</h1>
            <p className="add-pet-required-note">Fields marked * are required.</p>
            <br></br>
            {isWelcome && (
                <div className="welcome-banner">
                    <p>Welcome to Dr. Meow Meow! Let's set up your first pet's profile to get started.</p>
                </div>
            )}
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
                        <p>Pet Name *</p>
                        <input value={form.pet_name || ''} onChange={onChange('pet_name')} placeholder="Name" />
                    </div>
                    <div className="add-pet-field">
                        <p>Type of Pet *</p>
                        <input value={form.pet_type || ''} onChange={onChange('pet_type')} placeholder="Cat, Dog, Bird, Manticore" />
                    </div>
                    <div className="add-pet-field">
                        <p>Breed:</p>
                        <input value={form.breed || ''} onChange={onChange('breed')} placeholder="Breed" />
                    </div>
                    <div className="add-pet-field">
                        <p>Age *</p>
                        <input
                            type="number"
                            value={computedAge !== null ? computedAge : (form.age || '')}
                            onChange={onChange('age')}
                            placeholder="Age"
                            disabled={computedAge !== null} // locked once a birthdate gives us a real age
                        />
                    </div>
                    <div className="add-pet-field">
                        <p>Birthdate *</p>
                        <input type="date" value={form.birthdate || ''} onChange={onChange('birthdate')} />
                    </div>
                    <div className="add-pet-field">
                        <p>Adoption Date *</p>
                        <input type="date" value={form.adoption_date || ''} onChange={onChange('adoption_date')} />
                    </div>
                    <div className="add-pet-field">
                        <p>Deceased Date:</p>
                        <input type="date" value={form.deceased_date || ''} onChange={onChange('deceased_date')} />
                    </div>
                    <div className="add-pet-field">
                        <p>Adopted From *</p>
                        <input value={form.came_from || ''} onChange={onChange('came_from')} placeholder="Came From" />
                    </div>
                    <div className="add-pet-field">
                        <p>Color *</p>
                        <input value={form.color || ''} onChange={onChange('color')} placeholder="Color" />
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
                        <p>Sex *</p>
                        <input value={form.sex || ''} onChange={onChange('sex')} placeholder="Sex" />
                    </div>
                    <div className="add-pet-field">
                        <p>Weight *</p>
                        <input value={form.pet_weight || ''} onChange={onChange('pet_weight')} placeholder="Weight" />
                    </div>
                    <div className="add-pet-field">
                        <p>Play Style *</p>
                        <input value={form.play_style || ''} onChange={onChange('play_style')} placeholder="Play Style" />
                    </div>
                    <div className="add-pet-field">
                        <p>Temperament *</p>
                        <input value={form.temperament || ''} onChange={onChange('temperament')} placeholder="Temperament" />
                    </div>
                    <div className="add-pet-field">
                        <p>Spay / Neuter Date:</p>
                        <input type="date" value={form.spay_neuter_date || ''} onChange={onChange('spay_neuter_date')} />
                    </div>
                    <div className="add-pet-field">
                        <label className="add-pet-checkbox">
                            Intact
                            <input type="checkbox" checked={Boolean(form.intact)} onChange={e => setform({...form, intact: e.target.checked})} />
                        </label>
                    </div>
                    <div className="add-pet-field">
                        <p>Primary Vet:</p>
                        {/* Pick this pet's main vet from the list loaded above */}
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

                {/* Medications/vaccines/health conditions/food/behaviors, staged here and
                    created once the pet itself is saved below. Split into two side-by-side
                    columns (rather than one flex-wrap row of cards) so a short container
                    doesn't get stuck with empty space under it just because a tall container
                    happens to share its row -- each column stacks independently. */}
                <StagedListSection
                    title="Vaccines"
                    items={vaccines}
                    onAdd={(item) => setVaccines([...vaccines, item])}
                    onRemove={(i) => setVaccines(vaccines.filter((_, idx) => idx !== i))}
                    renderSummary={(v) => v.vaccine_name}
                    fields={vaccineFields}
                    draft={newVaccine}
                    onDraftChange={setNewVaccine}
                />

                <div className="add-pet-form">
                    <h3>Microchip</h3>
                    <p className="staged-list-hint">This section is optional.</p>
                    <div className="add-pet-fields">
                        <div className="add-pet-field">
                            <p>Microchip Number:</p>
                            <input value={form.microchip_number || ''} onChange={onChange('microchip_number')} placeholder="Microchip Number" />
                        </div>
                        <div className="add-pet-field">
                            <p>Date Microchipped:</p>
                            <input type="date" value={form.date_microchipped || ''} onChange={onChange('date_microchipped')} />
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

            <div className="add-pet-column">
                <StagedListSection
                    title="Medications"
                    items={medications}
                    onAdd={(item) => setMedications([...medications, item])}
                    onRemove={(i) => setMedications(medications.filter((_, idx) => idx !== i))}
                    renderSummary={(m) => `${m.medication_name} (${m.dosage})`}
                    fields={medicationFields}
                    draft={newMedication}
                    onDraftChange={setNewMedication}
                />

                <StagedListSection
                    title="Health Conditions"
                    items={healthConditions}
                    onAdd={(item) => setHealthConditions([...healthConditions, item])}
                    onRemove={(i) => setHealthConditions(healthConditions.filter((_, idx) => idx !== i))}
                    renderSummary={(c) => c.condition}
                    fields={healthConditionFields}
                    draft={newHealthCondition}
                    onDraftChange={setNewHealthCondition}
                />

                <StagedListSection
                    title="Behaviors"
                    items={behaviors}
                    onAdd={(item) => setBehaviors([...behaviors, item])}
                    onRemove={(i) => setBehaviors(behaviors.filter((_, idx) => idx !== i))}
                    renderSummary={(b) => b.behavior}
                    fields={behaviorFields}
                    draft={newBehavior}
                    onDraftChange={setNewBehavior}
                />

                <StagedListSection
                    title="Food"
                    items={foods}
                    onAdd={(item) => setFoods([...foods, item])}
                    onRemove={(i) => setFoods(foods.filter((_, idx) => idx !== i))}
                    renderSummary={(f) => `${f.brand} - ${f.flavor}`}
                    fields={foodFields}
                    draft={newFood}
                    onDraftChange={setNewFood}
                />
            </div>
            </div>

                {error && (
                    <p className="add-pet-error">
                        {error}{createdPetId && <> <Link to={`/petProfile/${createdPetId}`}>Go to {form.pet_name || 'the pet'}'s profile</Link></>}
                    </p>
                )}

                <div className="add-pet-actions">
                    <button type="submit">Save</button>
                    <button type="button" onClick={() => guardedNavigate('/pets')}>Cancel</button>
                </div>
                {modal}
            </form>
    );
}

export default addPet;
