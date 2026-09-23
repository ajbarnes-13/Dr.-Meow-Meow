import React from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import AppointmentsTable from '../components/appointmentsTable';
import './appointments.css';

// Converts a yyyy-mm-dd date string to a mm/dd/yyyy for display
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
};

function appointmentsPage () {
    // Keeps the list of pets we've fetched from the server so all the user's pets' appointments can be displayed in the table
    const [appointments, setAppointments] = React.useState([]);
    const navigate = useNavigate();

    // Appointment dates reformatted to mm/dd/yyyy for display in the table
    const formattedAppointments = appointments.map((appointment) => ({
        ...appointment,
        appointmentDate: formatDate(appointment.appointment_date),
    }));

    const loadAppointments = async () => {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/appointments`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error(await response.json());
            setAppointments([]);
            return;
        }

        setAppointments(await response.json());
    };

    const loadVets = async () => {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/vets`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error(await response.json());
            setVets([]);
            return;
        }

        setVets(await response.json());
    };

    const loadOffices = async () => {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/vet_offices`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error(await response.json());
            setOffices([]);
            return;
        }

        setOffices(await response.json());
    };

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                loadAppointments();
                loadVets();
                loadOffices();
            }
        });

        return unsubscribe;
    }, []);

    const onDelete = async (id) => {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/appointments/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 204) {
            loadAppointments();
        } else {
            const error = await response.json();
            console.error(error);
        }
    };

    const [editingId, setEditingId] = React.useState(null);
    const [editValues, setEditValues] = React.useState(null);
    const [vets, setVets] = React.useState([]);
    const [offices, setOffices] = React.useState([]);
    
    const onEdit = (appointment) => {
        setEditingId(appointment.appointment_id);
        setEditValues({
            pet_id: appointment.pet_id,
            vet_id: appointment.vet_id,
            office_name_id: appointment.office_name_id,
            office_address: appointment.office_address,
            address_2: appointment.address_2,
            city: appointment.city,
            office_state: appointment.office_state,
            zip_code: appointment.zip_code,
            reason: appointment.reason,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            summary: appointment.summary,
        });
    };

    const onFieldChange = (field, value) => {
    if (field === 'office_name_id') {
        const selectedOffice = offices.find((office) => office.vet_office_id === value);
        setEditValues((prev) => ({
            ...prev,
            office_name_id: value,
            office_address: selectedOffice.office_address,
            address_2: selectedOffice.address_2,
            city: selectedOffice.city,
            office_state: selectedOffice.office_state,
            zip_code: selectedOffice.zip_code,
        }));
        return;
    }

    setEditValues((prev) => ({...prev, [field]: value}));
};

    const onCancel = () => {
        setEditingId(null);
        setEditValues(null);
    };

    const onSave = async () => {
        const token = await auth.currentUser.getIdToken();

        const appointmentResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/appointments/${editingId}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pet_id: editValues.pet_id,
                vet_id: editValues.vet_id,
                office_name_id: editValues.office_name_id,
                reason: editValues.reason,
                appointment_date: editValues.appointment_date,
                appointment_time: editValues.appointment_time,
                summary: editValues.summary,
            }),
        });

        if (!appointmentResponse.ok) {
            console.error(await appointmentResponse.json());
            return;
        }

        const selectedOffice = offices.find((office) => office.vet_office_id === editValues.office_name_id);
        const officeResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/vet_offices/${editValues.office_name_id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                office_name: selectedOffice.office_name,
                office_address: editValues.office_address,
                address_2: editValues.address_2,
                city: editValues.city,
                office_state: editValues.office_state,
                zip_code: editValues.zip_code,
            }),
        });

        if (!officeResponse.ok) {
            console.error(await officeResponse.json());
            return;
        }

        setEditingId(null);
        setEditValues(null);
        loadAppointments();
        loadOffices();
    };

    return (
        <>
        <h1>Appointments</h1>

        <AppointmentsTable
            appointments={formattedAppointments}
            onDelete={onDelete}
            onEdit={onEdit}
            editingId={editingId}
            editValues={editValues}
            onFieldChange={onFieldChange}
            onSave={onSave}
            onCancel={onCancel}
            vets={vets}
            offices={offices}
            />

            <br>
            </br>
        </>
    );
}

export default appointmentsPage;