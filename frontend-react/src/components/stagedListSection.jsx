import { useState } from 'react';
import { MdDelete } from 'react-icons/md';

// A small "type in the details, see it in a list" builder used on the Add
// Pet page for medications/vaccines/health conditions/food/behaviors --
// there's no pet_id yet to save these against until the pet itself is
// created, so they're just held here in memory and only sent to the server
// afterward.
//
// The current draft is owned by the parent page (not this component) so the
// page's own master Save button can pick up whatever's typed in here even if
// "+ Add Another" was never clicked -- that button is only for staging more
// than one entry, not a prerequisite for the first one to be saved.
//
// fields: [{ key, label, type: 'text' | 'date' | 'time' | 'number' | 'select' | 'checkbox',
//            required, options: [{value, label}] (for 'select') }]
function StagedListSection({ title, fields, items, onAdd, onRemove, renderSummary, draft, onDraftChange }) {
    const [error, setError] = useState('');

    const onChange = (field) => (e) => {
        const value = field.type === 'checkbox' ? e.target.checked : e.target.value;
        onDraftChange({ ...draft, [field.key]: value });
    };

    // Stages the current draft as its own entry in the list and clears the
    // fields, ready for another one -- for a single entry, this doesn't need
    // to be clicked at all, since the page's Save button already picks up
    // whatever's sitting in the draft.
    const addAnother = () => {
        const missing = fields.some(f => f.required && !draft[f.key]);
        if (missing) {
            setError('Please fill in all fields before adding.');
            return;
        }
        setError('');
        onAdd(draft);
        onDraftChange({});
    };

    return (
        <div className="staged-list-section">
            <h3>{title}</h3>
            <p className="staged-list-hint">This whole section is optional -- fields marked * are only required if you fill in a {title.toLowerCase()} entry.</p>

            {items.length > 0 && (
                <ul className="staged-list">
                    {items.map((item, i) => (
                        <li key={i}>
                            <span>{renderSummary(item)}</span>
                            <MdDelete onClick={() => onRemove(i)} />
                        </li>
                    ))}
                </ul>
            )}

            <div className="staged-list-form">
                {fields.map(f => {
                    if (f.type === 'checkbox') {
                        return (
                            <label key={f.key} className="staged-list-checkbox">
                                {f.label}{f.required ? ' *' : ''}
                                <input type="checkbox" checked={Boolean(draft[f.key])} onChange={onChange(f)} />
                            </label>
                        );
                    }
                    return (
                        <div key={f.key} className="staged-list-field">
                            <p>{f.label}{f.required ? ' *' : ''}</p>
                            {f.type === 'select' ? (
                                <select value={draft[f.key] || ''} onChange={onChange(f)}>
                                    <option value="">{f.label}</option>
                                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            ) : (
                                <input
                                    type={f.type || 'text'}
                                    value={draft[f.key] || ''}
                                    onChange={onChange(f)}
                                    placeholder={f.label}
                                />
                            )}
                        </div>
                    );
                })}
                <button type="button" onClick={addAnother}>+ Add Another</button>
            </div>

            {error && <p className="staged-list-error">{error}</p>}
        </div>
    );
}

export default StagedListSection;
