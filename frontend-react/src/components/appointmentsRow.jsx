import {MdEdit, MdDelete, MdCheck, MdClose} from 'react-icons/md';
import { Link } from 'react-router-dom';

// Converts a 24-hour "HH:MM(:SS)" time string to 12-hour "H:MM AM/PM" for display.
const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hourStr, minute] = timeStr.split(':');
    const hour24 = Number(hourStr);
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minute} ${period}`;
};

function AppointmentsRow({appointment, onEdit, onDelete, isEditing, editValues, onFieldChange, onSave, onCancel, vets, offices}) {
    if (isEditing) {
        return (
            <tr>
                <td className='pet-name-link'><Link to={`/petProfile/${appointment.pet_id}`}>{appointment.pet_name}</Link></td>
                <td className='appointment-data'>
                    <select value={editValues.vet_id} onChange={(e) => onFieldChange('vet_id', Number(e.target.value))}>
                        {vets.map((vet) => (
                            <option key={vet.vet_id} value={vet.vet_id}>{vet.vet_name}</option>
                        ))}
                    </select>
                </td>
                <td className='appointment-data'>
                    <select value={editValues.office_name_id} onChange={(e) => onFieldChange('office_name_id', Number(e.target.value))}>
                        {offices.map((office) => (
                            <option key={office.vet_office_id} value={office.vet_office_id}>{office.office_name}</option>
                        ))}
                    </select>
                </td>
                <td className='appointment-data'>
                    {[editValues.office_address, editValues.address_2, editValues.city, editValues.office_state, editValues.zip_code].filter(Boolean).join(' ')}
                </td>
                <td className='appointment-data'>{appointment.phone_number}</td>
                <td className='appointment-data'>{appointment.website}</td>
                <td className='appointment-data'>
                    <input type='date' value={editValues.appointment_date} onChange={(e) => onFieldChange('appointment_date', e.target.value)} />
                </td>
                <td className='appointment-data'>
                    <input type='time' value={editValues.appointment_time} onChange={(e) => onFieldChange('appointment_time', e.target.value)} />
                </td>
                <td className='appointment-data'>
                    <input type='text' value={editValues.reason} onChange={(e) => onFieldChange('reason', e.target.value)} />
                </td>
                <td className='appointment-data'>
                    <input type='text' value={editValues.summary} onChange={(e) => onFieldChange('summary', e.target.value)} />
                </td>
                <td><MdCheck onClick={onSave} /></td>
                <td><MdClose onClick={onCancel} /></td>
            </tr>
        );
    }
    
    // Combines columns vet address, address2, city, state, zip into one column called Address to make the page less crowded
    const address = [appointment.office_address, appointment.address_2, appointment.city, appointment.office_state, appointment.zip_code].filter(Boolean).join(' ');
    return (
        <tr>
            <td className='pet-name-link'><Link to={`/petProfile/${appointment.pet_id}`}>{appointment.pet_name}</Link></td>
            <td className='appointment-data'>{appointment.vet_name}</td>
            <td className='appointment-data'>{appointment.office_name}</td>
            <td className='appointment-data'>{address}</td>
            <td className='appointment-data'>{appointment.phone_number}</td>
            <td className='appointment-data'>{appointment.website}</td>
            <td className='appointment-data'>{appointment.appointment_date}</td>
            <td className='appointment-data'>{formatTime(appointment.appointment_time)}</td>
            <td className='appointment-data'>{appointment.reason}</td>
            <td className='appointment-data'>{appointment.summary}</td>
            <td><MdEdit onClick={() => onEdit(appointment)} /></td>
            <td><MdDelete onClick={() => onDelete(appointment.appointment_id)} /></td>
        </tr>
    );
}

export default AppointmentsRow;