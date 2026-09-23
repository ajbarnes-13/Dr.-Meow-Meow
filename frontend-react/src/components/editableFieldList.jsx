import { useState } from 'react';
import { MdCheck, MdDelete } from 'react-icons/md';

// Converts a raw form value to what the field's type needs before it's sent
// to the server -- e.g. a <select> holding a vet id comes back as a string
// from the DOM, but the server wants a real number.
const coerceValue = (field, rawValue) => {
    if (field.type === 'checkbox') return Boolean(rawValue);
    if (field.type === 'number' || field.type === 'select') {
        return rawValue === '' || rawValue === undefined ? null : Number(rawValue);
    }
    return rawValue ?? '';
};

// Builds the POST/PUT body for one record from its raw form values.
export const buildFieldPayload = (fields, form, petId) => {
    const payload = { pet_id: petId };
    fields.forEach(f => { payload[f.key] = coerceValue(f, form[f.key]); });
    return payload;
};

// Whether a draft card actually has anything typed into it -- used to decide
// whether a blank "add new" card should be created at all when the page it
// lives on is saved (a checkbox alone doesn't count, since "unchecked" is
// indistinguishable from "untouched").
export const hasAnyValue = (fields, form) =>
    fields.some(f => f.type !== 'checkbox' && form[f.key] !== undefined && form[f.key] !== null && form[f.key] !== '');

// One field's input, matching the "label above input" look used for Pet Info
// and Microchip on this page (as opposed to a table column).
function FieldInput({ field, value, onChange }) {
    if (field.type === 'checkbox') {
        return (
            <label className="add-pet-checkbox">
                {field.label}
                <input type="checkbox" checked={Boolean(value)} onChange={e => onChange(e.target.checked)} />
            </label>
        );
    }

    if (field.type === 'select') {
        return (
            <div className="add-pet-field">
                <p>{field.label}:</p>
                <select value={value ?? ''} onChange={e => onChange(e.target.value)}>
                    <option value="">Choose one</option>
                    {field.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>
        );
    }

    let displayValue = value ?? '';
    if (field.type === 'date' && displayValue) displayValue = displayValue.slice(0, 10);
    if (field.type === 'time' && displayValue) displayValue = displayValue.slice(0, 5);

    return (
        <div className="add-pet-field">
            <p>{field.label}:</p>
            <input
                type={field.type || 'text'}
                value={displayValue}
                onChange={e => onChange(e.target.value)}
                placeholder={field.label}
            />
        </div>
    );
}

// One existing record, editable directly (no separate view/edit toggle --
// matches how Pet Info's own fields work) with its own Save and Delete,
// since each record is its own row in the database and needs its own PUT/
// DELETE call, unlike Pet Info which all saves together in one submit.
function ExistingFieldCard({ item, fields, idField, petId, onSave, onDelete }) {
    const [form, setForm] = useState(item);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const onFieldChange = (field) => (rawValue) => setForm({...form, [field.key]: rawValue});

    const save = async () => {
        setSaving(true);
        const ok = await onSave(item[idField], buildFieldPayload(fields, form, petId));
        setSaving(false);
        setError(ok ? '' : 'Could not save. Please check the fields and try again.');
    };

    return (
        <div className="add-pet-field-card">
            <div className="add-pet-fields">
                {fields.map(f => (
                    <FieldInput key={f.key} field={f} value={form[f.key]} onChange={onFieldChange(f)} />
                ))}
                <div className="add-pet-field-actions">
                    <MdCheck onClick={saving ? undefined : save} title="Save" />
                    {onDelete && <MdDelete onClick={() => onDelete(item)} title="Delete" />}
                </div>
            </div>
            {error && <p className="add-pet-error">{error}</p>}
        </div>
    );
}

// A blank card at the end of the list for a new record -- controlled by the
// parent page's own state (rather than managing its own like Existing/New
// used to) so the page's single "Save Changes" submit can pick up whatever
// was typed in here and create it, instead of this card needing its own
// separate "+ Add" button.
function DraftFieldCard({ fields, draft, onChange }) {
    const onFieldChange = (field) => (rawValue) => onChange({...draft, [field.key]: rawValue});

    return (
        <div className="add-pet-field-card">
            <div className="add-pet-fields">
                {fields.map(f => (
                    <FieldInput key={f.key} field={f} value={draft[f.key]} onChange={onFieldChange(f)} />
                ))}
            </div>
        </div>
    );
}

// Renders a resource (medications, vaccines, health conditions, food,
// behaviors) as a stack of directly-editable field cards instead of a table
// -- matching the Pet Info/Microchip look on this page. Each existing record
// is its own card, with its own Save/Delete; a blank draft card at the end
// (when `draft`/`onDraftChange` are given) lets the user start a new one,
// picked up and created by whatever "Save" the page itself provides.
//
// fields: [{ key, label, type: 'text' | 'date' | 'time' | 'number' | 'select' | 'checkbox',
//            options: [{value, label}] (for 'select') }]
function EditableFieldList({ fields, items, idField, petId, onSave, onDelete, draft, onDraftChange }) {
    return (
        <div className="add-pet-field-list">
            {items.map(item => (
                <ExistingFieldCard
                    key={item[idField]}
                    item={item}
                    fields={fields}
                    idField={idField}
                    petId={petId}
                    onSave={onSave}
                    onDelete={onDelete}
                />
            ))}
            {draft !== undefined && <DraftFieldCard fields={fields} draft={draft} onChange={onDraftChange} />}
        </div>
    );
}

export default EditableFieldList;
