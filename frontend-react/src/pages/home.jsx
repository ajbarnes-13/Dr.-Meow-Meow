import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import './home.css';

const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
};

// Converts a 24-hour "HH:MM" or "HH:MM:SS" time (what the time input and the
// database both use) into a 12-hour "h:MM AM/PM" time for display.
const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hourStr, minute] = timeStr.split(':');
    const hour24 = Number(hourStr);
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${minute} ${period}`;
};

const today = () => new Date().toISOString().slice(0, 10);

// "3 months old" for a pet under a year, "2 years old" otherwise. Uses the
// birthdate for month-level precision when there is one (so a kitten doesn't
// just show as "0"); falls back to the whole-years age on the pet record
// when there's no birthdate to calculate from.
const formatAge = (birthdate, age) => {
    let months;

    if (birthdate) {
        const birth = new Date(birthdate);
        const now = new Date();
        months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
        if (now.getDate() < birth.getDate()) months -= 1;
        months = Math.max(months, 0);
    } else if (age !== null && age !== undefined && age !== '') {
        months = Number(age) * 12;
    } else {
        return null;
    }

    if (months < 12) {
        return months === 1 ? '1 month old' : `${months} months old`;
    }

    const years = Math.floor(months / 12);
    return years === 1 ? '1 year old' : `${years} years old`;
};

function Home() {
    const navigate = useNavigate();
    const [userName, setUserName] = React.useState('');
    const [pets, setPets] = React.useState([]);
    const [appointments, setAppointments] = React.useState([]);

    const loadPets = async () => {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pets`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            console.error(await response.json());
            setPets([]);
            return;
        }

        setPets(await response.json());
    };

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

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) return;

            // Right after signup, login.jsx sets displayName via updateProfile()
            // in a separate call *after* the account is created -- the sign-in
            // event (and this callback) can fire before that finishes, handing
            // us a user object whose displayName isn't set yet. reload() pulls
            // the current profile from Firebase so we never cache that blank
            // moment and fall back to the email permanently.
            await user.reload();

            // displayName is the "Preferred Name" typed at sign-up (could be a full
            // name); only show the first word of it on the welcome banner.
            const firstName = (auth.currentUser.displayName || auth.currentUser.email || '').split(' ')[0];
            setUserName(firstName);
            loadPets();
            loadAppointments();
        });

        return unsubscribe;
    }, []);

    const upcomingAppointments = appointments
        .filter((appointment) => appointment.appointment_date >= today())
        .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date));
    
    return (
        <div className="home-page">
            <h1>Welcome, {userName}!</h1>

            <section className="home-upcoming-appointments-title">
                <h2>Upcoming Appointments</h2>
                {upcomingAppointments.length === 0 && <p>No upcoming appointments.</p>}
                {upcomingAppointments.length > 0 && (
                    <ul className="home-upcoming-appointments-content">
                        {upcomingAppointments.map((appointment) => (
                            <li key={appointment.appointment_id}>
                                {appointment.pet_name} has an <Link to="/appointments">appointment</Link> with {appointment.vet_name} on {formatDate(appointment.appointment_date)} at {formatTime(appointment.appointment_time)}.
                            </li>
                        ))}
                    </ul>
                )}
                <button onClick={() => navigate('/addAppointment')}>Add Appointment</button>
            </section>

            <section className="home-pets-title">
                <h2>My Pets</h2>
                {pets.length === 0 && <p>You don't have any pets!</p>}
                {pets.length > 0 && (
                    <div className="home-pets-content">
                        {pets.map((pet) => {
                            const age = formatAge(pet.birthdate, pet.age);
                            return (
                                <div key={pet.pet_id} className="home-pet-content-card">
                                    <h3><Link to={`/petProfile/${pet.pet_id}`}>{pet.pet_name}</Link></h3>
                                    <p>{pet.pet_type}</p>
                                    {age && <p>{age}</p>}
                                    <p>Primary Vet: {pet.primary_vet_name || 'Not set'}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
                <button onClick={() => navigate('/addPet')}>Add Pet</button>
            </section>
        </div>
    );
}

export default Home;