import { useState } from 'react';
import { MdDelete } from 'react-icons/md';

// A small "type in the details, click Add, see it in a list" builder used on
// the Add Pet page for medications/vaccines/health conditions/food/behaviors --
// there's no pet_id yet to save these against until the pet itself is created,
// so they're just held here in memory and only sent to the server afterward.
//
// fields: [{ key, label, type: 'text' | 'date' | 'time' | 'number' | 'select' | 'checkbox',
//            required, options: [{value, label}] (for 'select') }]
function StagedListSection({ title, fields, items, onAdd, onRemove, renderSummary }) {
    const [draft, setDraft] = useState({});
    const [error, setError] = useState('');

    const onChange = (field) => (e) => {
        const value = field.type === 'checkbox' ? e.target.checked : e.target.value;
        setDraft({ ...draft, [field.key]: value });
    };

    const addItem = () => {
        const missing = fields.some(f => f.required && !draft[f.key]);
        if (missing) {
            setError('Please fill in all fields before adding.');
            return;
        }
        setError('');
        onAdd(draft);
        setDraft({});
    };

    return (
        <div className="staged-list-section">
            <h3>{title}</h3>
            <p className="staged-list-hint">This whole section is optional -- fields marked * are only required if you add a {title.toLowerCase()} entry.</p>

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
                <button type="button" onClick={addItem}>Add</button>
            </div>

            {error && <p className="staged-list-error">{error}</p>}
        </div>
    );
}

export default StagedListSection;
