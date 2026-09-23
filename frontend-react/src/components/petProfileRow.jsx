import { useState } from 'react';
import { MdEdit, MdDelete, MdCheck, MdClose } from 'react-icons/md';

// Converts a yyyy-mm-dd date string to mm/dd/yyyy for display.
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
};

// Converts a 24-hour "HH:MM(:SS)" time string to 12-hour "H:MM AM/PM" for display.
const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hourStr, minute] = timeStr.split(':');
    const hour24 = Number(hourStr);
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minute} ${period}`;
};

// One year after a given yyyy-mm-dd date string, in the same format --
// used to default a vaccine's "next due" date when its "date given" changes.
const addOneYear = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${Number(year) + 1}-${month}-${day}`;
};

// Without a scheme, a browser treats a link's href as relative to the
// current page (e.g. /petProfile/3) instead of an external site -- clicking
// "example.com" from here would resolve to /petProfile/example.com and land
// on a "pet not found" page instead of actually leaving the site.
const toAbsoluteUrl = (url) => /^https?:\/\//i.test(url) ? url : `https://${url}`;

function PetProfileAppointmentsRow({appointment, vets, onSave, onDelete}) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(appointment);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const startEdit = () => {
        setForm(appointment);
        setError('');
        setEditing(true);
    };

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    // Picking a vet also decides the office, same as on the Add Appointment page.
    const onVetChange = (e) => {
        const vetId = Number(e.target.value);
        const selectedVet = vets.find(v => v.vet_id === vetId);
        setForm({...form, vet_id: vetId, office_name_id: selectedVet ? selectedVet.office_name_id : form.office_name_id});
    };

    const save = async () => {
        setSaving(true);
        const ok = await onSave(appointment.appointment_id, {
            pet_id: appointment.pet_id,
            vet_id: Number(form.vet_id),
            office_name_id: Number(form.office_name_id),
            reason: form.reason,
            appointment_date: form.appointment_date,
            appointment_time: form.appointment_time,
            summary: form.summary || '',
        });
        setSaving(false);
        if (ok) setEditing(false);
        else setError('Could not save. Please check the form and try again.');
    };

    if (editing) {
        return (
            <>
            <tr>
                <td><input type="date" value={form.appointment_date?.slice(0, 10) || ''} onChange={onChange('appointment_date')} /></td>
                <td><input type="time" value={form.appointment_time?.slice(0, 5) || ''} onChange={onChange('appointment_time')} /></td>
                <td>
                    <select value={form.vet_id || ''} onChange={onVetChange}>
                        <option value="">Choose a vet</option>
                        {vets.map(v => <option key={v.vet_id} value={v.vet_id}>{v.vet_name}</option>)}
                    </select>
                </td>
                <td>{vets.find(v => v.vet_id === Number(form.vet_id))?.office_name || appointment.office_name}</td>
                <td><input value={form.reason || ''} onChange={onChange('reason')} placeholder="Reason" /></td>
                <td><input value={form.summary || ''} onChange={onChange('summary')} placeholder="Summary" /></td>
                <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : save} /></td>
                <td className="pet-profile-row-action"><MdClose onClick={() => setEditing(false)} /></td>
            </tr>
            {error && <tr><td colSpan={6} className="pet-profile-row-error">{error}</td></tr>}
            </>
        );
    }

    return (
        <tr>
            <td className='pet-profile-appointment-data'>{formatDate(appointment.appointment_date)}</td>
            <td className='pet-profile-appointment-data'>{formatTime(appointment.appointment_time)}</td>
            <td className='pet-profile-appointment-data'>{appointment.vet_name}</td>
            <td className='pet-profile-appointment-data'>{appointment.office_name}</td>
            <td className='pet-profile-appointment-data'>{appointment.reason}</td>
            <td className='pet-profile-appointment-data'>{appointment.summary}</td>
            <td className="pet-profile-row-action"><MdEdit onClick={startEdit} /></td>
            <td className="pet-profile-row-action"><MdDelete onClick={() => onDelete(appointment)} /></td>
        </tr>
    );
}

// Microchip info lives directly on the pet's own record (not a separate child
// table like medications/vaccines/etc.), so there's exactly one "row" per pet
// -- edited/cleared via onSave, which PUTs the whole pet record with just the
// microchip fields changed. Shows a "+ Add" trigger (matching every other
// tab) until a microchip number is actually on file.
function PetProfileMicrochipRow({pet, onSave, onDelete}) {
    const hasMicrochip = Boolean(pet.microchip_number);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(pet);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const startEdit = () => {
        setForm(pet);
        setError('');
        setEditing(true);
    };

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    const save = async () => {
        setSaving(true);
        const ok = await onSave({
            microchip_number: form.microchip_number || '',
            date_microchipped: form.date_microchipped || '',
            microchip_company: form.microchip_company || '',
            microchip_url: form.microchip_url || '',
        });
        setSaving(false);
        if (ok) setEditing(false);
        else setError('Could not save. Please check the form and try again.');
    };

    if (editing) {
        return (
            <>
            <tr>
                <td><input value={form.microchip_number || ''} onChange={onChange('microchip_number')} placeholder="Microchip Number" /></td>
                <td><input type="date" value={form.date_microchipped?.slice(0, 10) || ''} onChange={onChange('date_microchipped')} /></td>
                <td><input value={form.microchip_company || ''} onChange={onChange('microchip_company')} placeholder="Company" /></td>
                <td><input value={form.microchip_url || ''} onChange={onChange('microchip_url')} placeholder="https://..." /></td>
                <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : save} /></td>
                <td className="pet-profile-row-action"><MdClose onClick={() => setEditing(false)} /></td>
            </tr>
            {error && <tr><td colSpan={4} className="pet-profile-row-error">{error}</td></tr>}
            </>
        );
    }

    if (!hasMicrochip) {
        return (
            <tr className="pet-profile-add-row-trigger" onClick={startEdit}>
                <td colSpan={4}>+ Add Microchip Info</td>
            </tr>
        );
    }

    return (
        <tr>
            <td className='pet-profile-microchip-data'>{pet.microchip_number}</td>
            <td className='pet-profile-microchip-data'>{formatDate(pet.date_microchipped)}</td>
            <td className='pet-profile-microchip-data'>{pet.microchip_company}</td>
            <td className='pet-profile-microchip-data'>
                {pet.microchip_url && <a href={toAbsoluteUrl(pet.microchip_url)} target="_blank" rel="noopener noreferrer">{pet.microchip_url}</a>}
            </td>
            <td className="pet-profile-row-action"><MdEdit onClick={startEdit} /></td>
            <td className="pet-profile-row-action"><MdDelete onClick={onDelete} /></td>
        </tr>
    );
}

function PetProfileMedicationRow({medication, vets, onSave, onDelete}) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(medication);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const startEdit = () => {
        setForm(medication);
        setError('');
        setEditing(true);
    };

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    const save = async () => {
        setSaving(true);
        const ok = await onSave(medication.medication_id, {
            medication_name: form.medication_name,
            pet_id: medication.pet_id,
            reason: form.reason,
            date_prescribed: form.date_prescribed,
            date_stopped: form.date_stopped,
            dosage: form.dosage,
            time_to_take: form.time_to_take,
            // The server expects this as a string, even though it's a number of
            // times per day -- matches how the rest of this field's validation works.
            times_per_day: form.times_per_day,
            with_food: Boolean(form.with_food),
            next_dose_due: form.next_dose_due,
            vet_prescribed_by_id: Number(form.vet_prescribed_by_id),
        });
        setSaving(false);
        if (ok) setEditing(false);
        else setError('Could not save. Please check the form and try again.');
    };

    if (editing) {
        return (
            <>
            <tr>
                <td><input value={form.medication_name || ''} onChange={onChange('medication_name')} placeholder="Medication" /></td>
                <td><input value={form.reason || ''} onChange={onChange('reason')} placeholder="Reason" /></td>
                <td>
                    <select value={form.vet_prescribed_by_id || ''} onChange={onChange('vet_prescribed_by_id')}>
                        <option value="">Choose a vet</option>
                        {vets.map(v => <option key={v.vet_id} value={v.vet_id}>{v.vet_name}</option>)}
                    </select>
                </td>
                <td><input value={form.dosage || ''} onChange={onChange('dosage')} placeholder="Dosage" /></td>
                <td><input type="time" value={form.time_to_take?.slice(0, 5) || ''} onChange={onChange('time_to_take')} /></td>
                <td><input type="number" min="1" value={form.times_per_day || ''} onChange={onChange('times_per_day')} placeholder="Times/day" /></td>
                <td>
                    <input type="checkbox" checked={Boolean(form.with_food)} onChange={e => setForm({...form, with_food: e.target.checked})} />
                </td>
                <td><input type="date" value={form.next_dose_due?.slice(0, 10) || ''} onChange={onChange('next_dose_due')} /></td>
                <td><input type="date" value={form.date_prescribed?.slice(0, 10) || ''} onChange={onChange('date_prescribed')} /></td>
                <td><input type="date" value={form.date_stopped?.slice(0, 10) || ''} onChange={onChange('date_stopped')} /></td>
                <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : save} /></td>
                <td className="pet-profile-row-action"><MdClose onClick={() => setEditing(false)} /></td>
            </tr>
            {error && <tr><td colSpan={10} className="pet-profile-row-error">{error}</td></tr>}
            </>
        );
    }

    return (
        <tr>
            <td className='pet-profile-medication-data'>{medication.medication_name}</td>
            <td className='pet-profile-medication-data'>{medication.reason}</td>
            <td className='pet-profile-medication-data'>{medication.vet_prescribed_by}</td>
            <td className='pet-profile-medication-data'>{medication.dosage}</td>
            <td className='pet-profile-medication-data'>{formatTime(medication.time_to_take)}</td>
            <td className='pet-profile-medication-data'>{medication.times_per_day}</td>
            <td className='pet-profile-medication-data'>{medication.with_food ? 'Yes' : 'No'}</td>
            <td className='pet-profile-medication-data'>{formatDate(medication.next_dose_due)}</td>
            <td className='pet-profile-medication-data'>{formatDate(medication.date_prescribed)}</td>
            <td className='pet-profile-medication-data'>{formatDate(medication.date_stopped)}</td>
            <td className="pet-profile-row-action"><MdEdit onClick={startEdit} /></td>
            {onDelete && <td className="pet-profile-row-action"><MdDelete onClick={() => onDelete(medication)} /></td>}
        </tr>
    )
}

// Vets aren't owned by any one pet -- they can be shared across a user's pets
// (see Add Vet's "assign to all my pets" option) -- so editing one here edits
// that vet, and its office, everywhere they're used, not just for this pet.
// Saving sends two updates (the vet itself, and its office) via onSave.
function PetProfileVetRow({vet, onSave, onDelete}) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(vet);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const startEdit = () => {
        setForm(vet);
        setError('');
        setEditing(true);
    };

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    const save = async () => {
        setSaving(true);
        const ok = await onSave(vet.vet_id, {
            vet_name: form.vet_name,
            office_name_id: vet.office_name_id,
            phone_number: form.phone_number,
            website: form.website || '',
            office: {
                office_name: form.office_name,
                office_address: form.office_address || '',
                address_2: form.address_2 || '',
                city: form.city || '',
                office_state: form.office_state || '',
                zip_code: form.zip_code || '',
            },
        });
        setSaving(false);
        if (ok) setEditing(false);
        else setError('Could not save. Please check the form and try again.');
    };

    const address = [vet.office_address, vet.address_2, vet.city, vet.office_state, vet.zip_code].filter(Boolean).join(' ');

    if (editing) {
        return (
            <>
            <tr>
                <td><input value={form.vet_name || ''} onChange={onChange('vet_name')} placeholder="Vet Name" /></td>
                <td><input value={form.office_name || ''} onChange={onChange('office_name')} placeholder="Office Name" /></td>
                <td>
                    <input value={form.office_address || ''} onChange={onChange('office_address')} placeholder="Street Address" />
                    <input value={form.address_2 || ''} onChange={onChange('address_2')} placeholder="Suite / Unit" />
                    <input value={form.city || ''} onChange={onChange('city')} placeholder="City" />
                    <input value={form.office_state || ''} onChange={onChange('office_state')} placeholder="State" />
                    <input value={form.zip_code || ''} onChange={onChange('zip_code')} placeholder="Zip" />
                </td>
                <td><input value={form.phone_number || ''} onChange={onChange('phone_number')} placeholder="Phone Number" /></td>
                <td><input value={form.website || ''} onChange={onChange('website')} placeholder="Website" /></td>
                <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : save} /></td>
                <td className="pet-profile-row-action"><MdClose onClick={() => setEditing(false)} /></td>
            </tr>
            {error && <tr><td colSpan={5} className="pet-profile-row-error">{error}</td></tr>}
            </>
        );
    }

    return (
        <tr>
            <td className='pet-profile-vet-data'>{vet.vet_name}</td>
            <td className='pet-profile-vet-data'>{vet.office_name}</td>
            <td className='pet-profile-vet-data'>{address}</td>
            <td className='pet-profile-vet-data'>{vet.phone_number}</td>
            <td className='pet-profile-vet-data'>
                {vet.website && <a href={toAbsoluteUrl(vet.website)} target="_blank" rel="noopener noreferrer">{vet.website}</a>}
            </td>
            <td className="pet-profile-row-action"><MdEdit onClick={startEdit} /></td>
            <td className="pet-profile-row-action"><MdDelete onClick={() => onDelete(vet)} /></td>
        </tr>
    )
}

function PetProfileVaccineRow({vaccine, vets, onSave, onDelete}) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(vaccine);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const startEdit = () => {
        setForm(vaccine);
        setError('');
        setEditing(true);
    };

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    // Defaults "Next Due" to one year after "Date Given" -- most vaccines are
    // annual -- but only when it hasn't already been set to something else,
    // so it never clobbers a value the user already picked.
    const onDateGivenChange = (e) => {
        const dateGiven = e.target.value;
        setForm({
            ...form,
            date_given: dateGiven,
            next_due_date: form.next_due_date ? form.next_due_date : addOneYear(dateGiven),
        });
    };

    const save = async () => {
        setSaving(true);
        const ok = await onSave(vaccine.vaccine_id, {
            pet_id: vaccine.pet_id,
            vaccine_name: form.vaccine_name,
            date_given: form.date_given,
            next_due_date: form.next_due_date,
            vet_id: Number(form.vet_id),
        });
        setSaving(false);
        if (ok) setEditing(false);
        else setError('Could not save. Please check the form and try again.');
    };

    if (editing) {
        return (
            <>
            <tr>
                <td><input value={form.vaccine_name || ''} onChange={onChange('vaccine_name')} placeholder="Vaccine" /></td>
                <td><input type="date" value={form.date_given?.slice(0, 10) || ''} onChange={onDateGivenChange} /></td>
                <td><input type="date" value={form.next_due_date?.slice(0, 10) || ''} onChange={onChange('next_due_date')} /></td>
                <td>
                    <select value={form.vet_id || ''} onChange={onChange('vet_id')}>
                        <option value="">Choose a vet</option>
                        {vets.map(v => <option key={v.vet_id} value={v.vet_id}>{v.vet_name}</option>)}
                    </select>
                </td>
                <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : save} /></td>
                <td className="pet-profile-row-action"><MdClose onClick={() => setEditing(false)} /></td>
            </tr>
            {error && <tr><td colSpan={4} className="pet-profile-row-error">{error}</td></tr>}
            </>
        );
    }

    return (
        <tr>
            <td className='pet-profile-vaccine-data'>{vaccine.vaccine_name}</td>
            <td className='pet-profile-vaccine-data'>{formatDate(vaccine.date_given)}</td>
            <td className='pet-profile-vaccine-data'>{formatDate(vaccine.next_due_date)}</td>
            <td className='pet-profile-vaccine-data'>{vaccine.vet_name}</td>
            <td className="pet-profile-row-action"><MdEdit onClick={startEdit} /></td>
            {onDelete && <td className="pet-profile-row-action"><MdDelete onClick={() => onDelete(vaccine)} /></td>}
        </tr>
    )
}

function PetProfileHealthConditionRow({condition, vets, onSave, onDelete}) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(condition);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const startEdit = () => {
        setForm(condition);
        setError('');
        setEditing(true);
    };

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    const save = async () => {
        setSaving(true);
        const ok = await onSave(condition.condition_id, {
            condition: form.condition,
            pet_id: condition.pet_id,
            date_diagnosed: form.date_diagnosed,
            vet_diagnosed_by_id: Number(form.vet_id),
            treatment: form.treatment,
        });
        setSaving(false);
        if (ok) setEditing(false);
        else setError('Could not save. Please check the form and try again.');
    };

    if (editing) {
        return (
            <>
            <tr>
                <td><input value={form.condition || ''} onChange={onChange('condition')} placeholder="Health Condition" /></td>
                <td><input value={form.treatment || ''} onChange={onChange('treatment')} placeholder="Treatment" /></td>
                <td><input type="date" value={form.date_diagnosed?.slice(0, 10) || ''} onChange={onChange('date_diagnosed')} /></td>
                <td>
                    <select value={form.vet_id || ''} onChange={onChange('vet_id')}>
                        <option value="">Choose a vet</option>
                        {vets.map(v => <option key={v.vet_id} value={v.vet_id}>{v.vet_name}</option>)}
                    </select>
                </td>
                <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : save} /></td>
                <td className="pet-profile-row-action"><MdClose onClick={() => setEditing(false)} /></td>
            </tr>
            {error && <tr><td colSpan={4} className="pet-profile-row-error">{error}</td></tr>}
            </>
        );
    }

    return (
        <tr>
            <td className='pet-profile-health-condition-data'>{condition.condition}</td>
            <td className='pet-profile-health-condition-data'>{condition.treatment}</td>
            <td className='pet-profile-health-condition-data'>{formatDate(condition.date_diagnosed)}</td>
            <td className='pet-profile-health-condition-data'>{condition.vet_diagnosed_by}</td>
            <td className="pet-profile-row-action"><MdEdit onClick={startEdit} /></td>
            {onDelete && <td className="pet-profile-row-action"><MdDelete onClick={() => onDelete(condition)} /></td>}
        </tr>
    )
}

function PetProfileFoodRow({food, onSave, onDelete}) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(food);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const startEdit = () => {
        setForm(food);
        setError('');
        setEditing(true);
    };

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    const save = async () => {
        setSaving(true);
        const ok = await onSave(food.food_id, {
            food_type: form.food_type,
            brand: form.brand,
            flavor: form.flavor,
            how_often: form.how_often,
            how_much: form.how_much,
            health_consideration: form.health_consideration,
            date_started: form.date_started,
            date_stopped: form.date_stopped,
            pet_id: food.pet_id,
        });
        setSaving(false);
        if (ok) setEditing(false);
        else setError('Could not save. Please check the form and try again.');
    };

    if (editing) {
        return (
            <>
            <tr>
                <td><input value={form.brand || ''} onChange={onChange('brand')} placeholder="Brand" /></td>
                <td><input value={form.food_type || ''} onChange={onChange('food_type')} placeholder="Wet or Dry" /></td>
                <td><input value={form.flavor || ''} onChange={onChange('flavor')} placeholder="Flavor" /></td>
                <td><input value={form.how_much || ''} onChange={onChange('how_much')} placeholder="How Much" /></td>
                <td><input value={form.how_often || ''} onChange={onChange('how_often')} placeholder="How Often" /></td>
                <td><input value={form.health_consideration || ''} onChange={onChange('health_consideration')} placeholder="Health Consideration" /></td>
                <td><input type="date" value={form.date_started?.slice(0, 10) || ''} onChange={onChange('date_started')} /></td>
                <td><input type="date" value={form.date_stopped?.slice(0, 10) || ''} onChange={onChange('date_stopped')} /></td>
                <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : save} /></td>
                <td className="pet-profile-row-action"><MdClose onClick={() => setEditing(false)} /></td>
            </tr>
            {error && <tr><td colSpan={8} className="pet-profile-row-error">{error}</td></tr>}
            </>
        );
    }

    return (
        <tr>
        <td className='pet-profile-food-data'>{food.brand}</td>
        <td className='pet-profile-food-data'>{food.food_type}</td>
        <td className='pet-profile-food-data'>{food.flavor}</td>
        <td className='pet-profile-food-data'>{food.how_much}</td>
        <td className='pet-profile-food-data'>{food.how_often}</td>
        <td className='pet-profile-food-data'>{food.health_consideration}</td>
        <td className='pet-profile-food-data'>{formatDate(food.date_started)}</td>
        <td className='pet-profile-food-data'>{formatDate(food.date_stopped)}</td>
        <td className="pet-profile-row-action"><MdEdit onClick={startEdit} /></td>
        {onDelete && <td className="pet-profile-row-action"><MdDelete onClick={() => onDelete(food)} /></td>}
    </tr>
    )
}

function PetProfileBehaviorRow({behavior, onSave, onDelete}) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(behavior);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const startEdit = () => {
        setForm(behavior);
        setError('');
        setEditing(true);
    };

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    const save = async () => {
        setSaving(true);
        const ok = await onSave(behavior.behavior_id, {
            pet_id: behavior.pet_id,
            behavior: form.behavior,
            date_started: form.date_started,
            frequency: form.frequency,
            total_occurrences: Number(form.total_occurrences),
            date_stopped: form.date_stopped || '',
        });
        setSaving(false);
        if (ok) setEditing(false);
        else setError('Could not save. Please check the form and try again.');
    };

    if (editing) {
        return (
            <>
            <tr>
                <td><input value={form.behavior || ''} onChange={onChange('behavior')} placeholder="Behavior" /></td>
                <td><input type="date" value={form.date_started?.slice(0, 10) || ''} onChange={onChange('date_started')} /></td>
                <td><input value={form.frequency || ''} onChange={onChange('frequency')} placeholder="Frequency" /></td>
                <td><input type="number" min="0" value={form.total_occurrences ?? ''} onChange={onChange('total_occurrences')} placeholder="Total Occurrences" /></td>
                <td><input type="date" value={form.date_stopped?.slice(0, 10) || ''} onChange={onChange('date_stopped')} /></td>
                <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : save} /></td>
                <td className="pet-profile-row-action"><MdClose onClick={() => setEditing(false)} /></td>
            </tr>
            {error && <tr><td colSpan={5} className="pet-profile-row-error">{error}</td></tr>}
            </>
        );
    }

    return (
        <tr>
        <td className='pet-profile-behavior-data'>{behavior.behavior}</td>
        <td className='pet-profile-behavior-data'>{formatDate(behavior.date_started)}</td>
        <td className='pet-profile-behavior-data'>{behavior.frequency}</td>
        <td className='pet-profile-behavior-data'>{behavior.total_occurrences}</td>
        <td className='pet-profile-behavior-data'>{formatDate(behavior.date_stopped)}</td>
        <td className="pet-profile-row-action"><MdEdit onClick={startEdit} /></td>
        {onDelete && <td className="pet-profile-row-action"><MdDelete onClick={() => onDelete(behavior)} /></td>}
    </tr>
    )
}

// ---- "Add new" rows, one per tab. Collapsed to a single "+ Add ___" trigger
// row until clicked, then the same field layout as the edit rows above, but
// starting blank and calling onCreate (a POST) instead of onSave (a PUT).
// Only rendered when the table was given an onCreate prop -- see
// petProfileTable.jsx -- so these never show up on editPetProfile.jsx, which
// reuses the same table components without that prop.

function NewAppointmentRow({petId, vets, onCreate}) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    const onVetChange = (e) => {
        const vetId = Number(e.target.value);
        const selectedVet = vets.find(v => v.vet_id === vetId);
        setForm({...form, vet_id: vetId, office_name_id: selectedVet ? selectedVet.office_name_id : ''});
    };

    const cancel = () => {
        setForm({});
        setError('');
        setAdding(false);
    };

    const create = async () => {
        setSaving(true);
        const ok = await onCreate({
            pet_id: petId,
            vet_id: Number(form.vet_id),
            office_name_id: Number(form.office_name_id),
            reason: form.reason,
            appointment_date: form.appointment_date,
            appointment_time: form.appointment_time,
            summary: form.summary || '',
        });
        setSaving(false);
        if (ok) cancel();
        else setError('Could not add. Please fill in all fields and try again.');
    };

    if (!adding) {
        return (
            <tr className="pet-profile-add-row-trigger" onClick={() => setAdding(true)}>
                <td colSpan={6}>+ Add Appointment</td>
            </tr>
        );
    }

    return (
        <>
        <tr>
            <td><input type="date" value={form.appointment_date || ''} onChange={onChange('appointment_date')} /></td>
            <td><input type="time" value={form.appointment_time || ''} onChange={onChange('appointment_time')} /></td>
            <td>
                <select value={form.vet_id || ''} onChange={onVetChange}>
                    <option value="">Choose a vet</option>
                    {vets.map(v => <option key={v.vet_id} value={v.vet_id}>{v.vet_name}</option>)}
                </select>
            </td>
            <td>{vets.find(v => v.vet_id === Number(form.vet_id))?.office_name || ''}</td>
            <td><input value={form.reason || ''} onChange={onChange('reason')} placeholder="Reason" /></td>
            <td><input value={form.summary || ''} onChange={onChange('summary')} placeholder="Summary" /></td>
            <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : create} /></td>
            <td className="pet-profile-row-action"><MdClose onClick={cancel} /></td>
        </tr>
        {error && <tr><td colSpan={6} className="pet-profile-row-error">{error}</td></tr>}
        </>
    );
}

function NewVetRow({onCreate}) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    const cancel = () => {
        setForm({});
        setError('');
        setAdding(false);
    };

    const create = async () => {
        setSaving(true);
        const ok = await onCreate({
            vet_name: form.vet_name,
            phone_number: form.phone_number,
            website: form.website || '',
            office: {
                office_name: form.office_name,
                office_address: form.office_address || '',
                address_2: form.address_2 || '',
                city: form.city || '',
                office_state: form.office_state || '',
                zip_code: form.zip_code || '',
            },
        });
        setSaving(false);
        if (ok) cancel();
        else setError('Could not add. Please fill in all fields and try again.');
    };

    if (!adding) {
        return (
            <tr className="pet-profile-add-row-trigger" onClick={() => setAdding(true)}>
                <td colSpan={5}>+ Add Vet</td>
            </tr>
        );
    }

    return (
        <>
        <tr>
            <td><input value={form.vet_name || ''} onChange={onChange('vet_name')} placeholder="Vet Name" /></td>
            <td><input value={form.office_name || ''} onChange={onChange('office_name')} placeholder="Office Name" /></td>
            <td>
                <input value={form.office_address || ''} onChange={onChange('office_address')} placeholder="Street Address" />
                <input value={form.address_2 || ''} onChange={onChange('address_2')} placeholder="Suite / Unit" />
                <input value={form.city || ''} onChange={onChange('city')} placeholder="City" />
                <input value={form.office_state || ''} onChange={onChange('office_state')} placeholder="State" />
                <input value={form.zip_code || ''} onChange={onChange('zip_code')} placeholder="Zip" />
            </td>
            <td><input value={form.phone_number || ''} onChange={onChange('phone_number')} placeholder="Phone Number" /></td>
            <td><input value={form.website || ''} onChange={onChange('website')} placeholder="Website" /></td>
            <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : create} /></td>
            <td className="pet-profile-row-action"><MdClose onClick={cancel} /></td>
        </tr>
        {error && <tr><td colSpan={5} className="pet-profile-row-error">{error}</td></tr>}
        </>
    );
}

function NewMedicationRow({petId, vets, onCreate}) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    const cancel = () => {
        setForm({});
        setError('');
        setAdding(false);
    };

    const create = async () => {
        setSaving(true);
        const ok = await onCreate({
            medication_name: form.medication_name,
            pet_id: petId,
            reason: form.reason,
            date_prescribed: form.date_prescribed,
            date_stopped: form.date_stopped || '',
            dosage: form.dosage,
            time_to_take: form.time_to_take,
            times_per_day: form.times_per_day,
            with_food: Boolean(form.with_food),
            next_dose_due: form.next_dose_due,
            vet_prescribed_by_id: Number(form.vet_prescribed_by_id),
        });
        setSaving(false);
        if (ok) cancel();
        else setError('Could not add. Please fill in all fields and try again.');
    };

    if (!adding) {
        return (
            <tr className="pet-profile-add-row-trigger" onClick={() => setAdding(true)}>
                <td colSpan={10}>+ Add Medication</td>
            </tr>
        );
    }

    return (
        <>
        <tr>
            <td><input value={form.medication_name || ''} onChange={onChange('medication_name')} placeholder="Medication" /></td>
            <td><input value={form.reason || ''} onChange={onChange('reason')} placeholder="Reason" /></td>
            <td>
                <select value={form.vet_prescribed_by_id || ''} onChange={onChange('vet_prescribed_by_id')}>
                    <option value="">Choose a vet</option>
                    {vets.map(v => <option key={v.vet_id} value={v.vet_id}>{v.vet_name}</option>)}
                </select>
            </td>
            <td><input value={form.dosage || ''} onChange={onChange('dosage')} placeholder="Dosage" /></td>
            <td><input type="time" value={form.time_to_take || ''} onChange={onChange('time_to_take')} /></td>
            <td><input type="number" min="1" value={form.times_per_day || ''} onChange={onChange('times_per_day')} placeholder="Times/day" /></td>
            <td>
                <input type="checkbox" checked={Boolean(form.with_food)} onChange={e => setForm({...form, with_food: e.target.checked})} />
            </td>
            <td><input type="date" value={form.next_dose_due || ''} onChange={onChange('next_dose_due')} placeholder="Leave blank if none" /></td>
            <td><input type="date" value={form.date_prescribed || ''} onChange={onChange('date_prescribed')} /></td>
            <td><input type="date" value={form.date_stopped || ''} onChange={onChange('date_stopped')} placeholder="Leave blank if ongoing" /></td>
            <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : create} /></td>
            <td className="pet-profile-row-action"><MdClose onClick={cancel} /></td>
        </tr>
        {error && <tr><td colSpan={10} className="pet-profile-row-error">{error}</td></tr>}
        </>
    );
}

function NewVaccineRow({petId, vets, onCreate}) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    // Defaults "Next Due" to one year after "Date Given" -- most vaccines are
    // annual -- but only when the user hasn't already typed their own value.
    const onDateGivenChange = (e) => {
        const dateGiven = e.target.value;
        setForm({
            ...form,
            date_given: dateGiven,
            next_due_date: form.next_due_date ? form.next_due_date : addOneYear(dateGiven),
        });
    };

    const cancel = () => {
        setForm({});
        setError('');
        setAdding(false);
    };

    const create = async () => {
        setSaving(true);
        const ok = await onCreate({
            pet_id: petId,
            vaccine_name: form.vaccine_name,
            date_given: form.date_given,
            next_due_date: form.next_due_date,
            vet_id: Number(form.vet_id),
        });
        setSaving(false);
        if (ok) cancel();
        else setError('Could not add. Please fill in all fields and try again.');
    };

    if (!adding) {
        return (
            <tr className="pet-profile-add-row-trigger" onClick={() => setAdding(true)}>
                <td colSpan={4}>+ Add Vaccine</td>
            </tr>
        );
    }

    return (
        <>
        <tr>
            <td><input value={form.vaccine_name || ''} onChange={onChange('vaccine_name')} placeholder="Vaccine" /></td>
            <td><input type="date" value={form.date_given || ''} onChange={onDateGivenChange} /></td>
            <td><input type="date" value={form.next_due_date || ''} onChange={onChange('next_due_date')} /></td>
            <td>
                <select value={form.vet_id || ''} onChange={onChange('vet_id')}>
                    <option value="">Choose a vet</option>
                    {vets.map(v => <option key={v.vet_id} value={v.vet_id}>{v.vet_name}</option>)}
                </select>
            </td>
            <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : create} /></td>
            <td className="pet-profile-row-action"><MdClose onClick={cancel} /></td>
        </tr>
        {error && <tr><td colSpan={4} className="pet-profile-row-error">{error}</td></tr>}
        </>
    );
}

function NewHealthConditionRow({petId, vets, onCreate}) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    const cancel = () => {
        setForm({});
        setError('');
        setAdding(false);
    };

    const create = async () => {
        setSaving(true);
        const ok = await onCreate({
            condition: form.condition,
            pet_id: petId,
            date_diagnosed: form.date_diagnosed,
            vet_diagnosed_by_id: Number(form.vet_id),
            treatment: form.treatment,
        });
        setSaving(false);
        if (ok) cancel();
        else setError('Could not add. Please fill in all fields and try again.');
    };

    if (!adding) {
        return (
            <tr className="pet-profile-add-row-trigger" onClick={() => setAdding(true)}>
                <td colSpan={4}>+ Add Health Condition</td>
            </tr>
        );
    }

    return (
        <>
        <tr>
            <td><input value={form.condition || ''} onChange={onChange('condition')} placeholder="Health Condition" /></td>
            <td><input value={form.treatment || ''} onChange={onChange('treatment')} placeholder="Treatment" /></td>
            <td><input type="date" value={form.date_diagnosed || ''} onChange={onChange('date_diagnosed')} /></td>
            <td>
                <select value={form.vet_id || ''} onChange={onChange('vet_id')}>
                    <option value="">Choose a vet</option>
                    {vets.map(v => <option key={v.vet_id} value={v.vet_id}>{v.vet_name}</option>)}
                </select>
            </td>
            <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : create} /></td>
            <td className="pet-profile-row-action"><MdClose onClick={cancel} /></td>
        </tr>
        {error && <tr><td colSpan={4} className="pet-profile-row-error">{error}</td></tr>}
        </>
    );
}

function NewFoodRow({petId, onCreate}) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    const cancel = () => {
        setForm({});
        setError('');
        setAdding(false);
    };

    const create = async () => {
        setSaving(true);
        const ok = await onCreate({
            food_type: form.food_type,
            brand: form.brand,
            flavor: form.flavor,
            how_often: form.how_often,
            how_much: form.how_much,
            health_consideration: form.health_consideration,
            date_started: form.date_started,
            date_stopped: form.date_stopped || '',
            pet_id: petId,
        });
        setSaving(false);
        if (ok) cancel();
        else setError('Could not add. Please fill in all fields and try again.');
    };

    if (!adding) {
        return (
            <tr className="pet-profile-add-row-trigger" onClick={() => setAdding(true)}>
                <td colSpan={8}>+ Add Food</td>
            </tr>
        );
    }

    return (
        <>
        <tr>
            <td><input value={form.brand || ''} onChange={onChange('brand')} placeholder="Brand" /></td>
            <td><input value={form.food_type || ''} onChange={onChange('food_type')} placeholder="Wet or Dry" /></td>
            <td><input value={form.flavor || ''} onChange={onChange('flavor')} placeholder="Flavor" /></td>
            <td><input value={form.how_much || ''} onChange={onChange('how_much')} placeholder="How Much" /></td>
            <td><input value={form.how_often || ''} onChange={onChange('how_often')} placeholder="How Often" /></td>
            <td><input value={form.health_consideration || ''} onChange={onChange('health_consideration')} placeholder="Health Consideration" /></td>
            <td><input type="date" value={form.date_started || ''} onChange={onChange('date_started')} /></td>
            <td><input type="date" value={form.date_stopped || ''} onChange={onChange('date_stopped')} placeholder="Leave blank if ongoing" /></td>
            <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : create} /></td>
            <td className="pet-profile-row-action"><MdClose onClick={cancel} /></td>
        </tr>
        {error && <tr><td colSpan={8} className="pet-profile-row-error">{error}</td></tr>}
        </>
    );
}

function NewBehaviorRow({petId, onCreate}) {
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const onChange = (field) => (e) => setForm({...form, [field]: e.target.value});

    const cancel = () => {
        setForm({});
        setError('');
        setAdding(false);
    };

    const create = async () => {
        setSaving(true);
        const ok = await onCreate({
            pet_id: petId,
            behavior: form.behavior,
            date_started: form.date_started,
            frequency: form.frequency,
            total_occurrences: Number(form.total_occurrences),
            date_stopped: form.date_stopped || '',
        });
        setSaving(false);
        if (ok) cancel();
        else setError('Could not add. Please fill in all fields and try again.');
    };

    if (!adding) {
        return (
            <tr className="pet-profile-add-row-trigger" onClick={() => setAdding(true)}>
                <td colSpan={5}>+ Add Behavior</td>
            </tr>
        );
    }

    return (
        <>
        <tr>
            <td><input value={form.behavior || ''} onChange={onChange('behavior')} placeholder="Behavior" /></td>
            <td><input type="date" value={form.date_started || ''} onChange={onChange('date_started')} /></td>
            <td><input value={form.frequency || ''} onChange={onChange('frequency')} placeholder="Frequency" /></td>
            <td><input type="number" min="0" value={form.total_occurrences ?? ''} onChange={onChange('total_occurrences')} placeholder="Total Occurrences" /></td>
            <td><input type="date" value={form.date_stopped || ''} onChange={onChange('date_stopped')} /></td>
            <td className="pet-profile-row-action"><MdCheck onClick={saving ? undefined : create} /></td>
            <td className="pet-profile-row-action"><MdClose onClick={cancel} /></td>
        </tr>
        {error && <tr><td colSpan={5} className="pet-profile-row-error">{error}</td></tr>}
        </>
    );
}

export {
    PetProfileAppointmentsRow, PetProfileMicrochipRow, PetProfileBehaviorRow, PetProfileFoodRow, PetProfileHealthConditionRow, PetProfileMedicationRow, PetProfileVaccineRow, PetProfileVetRow,
    NewAppointmentRow, NewVetRow, NewMedicationRow, NewVaccineRow, NewHealthConditionRow, NewFoodRow, NewBehaviorRow,
};
