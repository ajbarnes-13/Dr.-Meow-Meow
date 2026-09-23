import AppointmentsRow from "./appointmentsRow";

function AppointmentsTable({appointments, onDelete, onEdit, editingId, editValues, onFieldChange, onSave, onCancel, vets, offices}) {
    return (
        <table className='AppointmentsTable'>
            <thead>
                <tr>
                    <th>Pet</th>
                    <th>Vet</th>
                    <th>Office</th>
                    <th>Address</th>
                    <th>Phone Number</th>
                    <th>Website</th>
                    <th>Appointment Date</th>
                    <th>Appointment Time</th>
                    <th>Reason for the Appointment</th>
                    <th>After-Appointment Summary</th>
                </tr>
            </thead>

            <tbody>
                {appointments.map((appointment) => (
                    <AppointmentsRow
                    key={appointment.appointment_id}
                    appointment={appointment}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    isEditing={appointment.appointment_id === editingId}
                    editValues={editValues}
                    onFieldChange={onFieldChange}
                    onSave={onSave}
                    onCancel={onCancel}
                    vets={vets}
                    offices={offices}
                    />
            ))}
            </tbody>
        </table>
    );
}

export default AppointmentsTable;
