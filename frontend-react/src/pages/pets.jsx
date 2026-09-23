import React from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import PetsTable from '../components/petsTable';
import './pets.css';

// Converts a yyyy-mm-dd date string to mm/dd/yyyy for display
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
};

// Age in whole years as of today, based on birthdate; null if there's no birthdate to calculate from.
const calculateAge = (birthdate) => {
    if (!birthdate) return null;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const hadBirthdayThisYear = today.getMonth() > birth.getMonth()
        || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    if (!hadBirthdayThisYear) age -= 1;
    return age;
};

function petsPage ({setUserPets}) {
    // Keeps the list of pets we've fetched from the server so all the user's pets can be displayed in the table
    const [pets, setPets] = React.useState([]);
    const navigate = useNavigate();

    // Pets with their date fields reformatted to mm/dd/yyyy for display in the table
    const formattedPets = pets.map((pet) => ({
        ...pet,
        age: calculateAge(pet.birthdate) ?? pet.age,
        birthdate: formatDate(pet.birthdate),
        adoption_date: formatDate(pet.adoption_date),
        deceased_date: formatDate(pet.deceased_date),
        spay_neuter_date: formatDate(pet.spay_neuter_date),
    }));

    // Asks the backend for the current list of the user's pets and saves it to state.
    // Every pet route requires a Firebase login token, so we grab one from the
    // currently signed-in user before making the request.
    const loadPets = async () => {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pets`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // A failed request (expired login, server error, etc.) sends back an
        // {error: ...} object instead of a list -- guard against that so the
        // table can't be handed something it can't map over.
        if (!response.ok) {
            console.error(await response.json());
            setPets([]);
            return;
        }

        setPets(await response.json());
    };

    // Load the pets list once the user's login state is known.
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) loadPets();
        });

        return unsubscribe;
    }, []);

    // Deletes one pet by id, then refreshes the list so it disappears from the table.
    const onDelete = async (id) => {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pets/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 204) {
            loadPets();
        } else {
            const error = await response.json();
            console.error(error);
        }
    };

    // Remembers which pet the user wants to edit, then navigates to the edit page.
    const onEdit = (pet) => {
        navigate('/editPetProfile', { state: { pet } });
    }

    // Render a heading and the table of the user's pets, wiring up delete/edit buttons.
    return (
        <>
            <h1>My Pets</h1>

            <PetsTable
                pets={formattedPets}
                onDelete={onDelete}
                onEdit={onEdit}
            />
            <br>
            </br>
        </>
    );
}

export default petsPage;