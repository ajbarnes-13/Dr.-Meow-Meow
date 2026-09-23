import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
// FIREBASE STORAGE PHOTO UPLOAD -- on hold until Storage billing (Blaze plan) is turned on.
// To re-enable: uncomment this import and the "storage" import below, plus the
// onPhotoSelected function and the upload <label> block further down, then swap the
// plain <img> back for the version that opens the file picker.
// import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth /*, storage */ } from "../firebase";
import './petProfile.css';
import { PetProfileDetails, PetMicrochipTable, PetAppointmentTable, PetVetTable, PetMedicationTable, PetVaccineTable, PetHealthConditionTable, PetFoodTable, PetBehaviorTable } from '../components/petProfileTable';

// Picks a stand-in picture by species for pets that don't have a real photo uploaded yet.
// These files live in frontend-react/public, so they're referenced by plain root path
// (like the site mascot in App.jsx) instead of being imported.
function getDefaultPhoto(petType) {
    const type = (petType || '').toLowerCase();
    if (type === 'cat') return '/default_cat_pfp.png';
    if (type === 'dog') return '/default_dog_pfp.png';
    return '/default_other_pfp.png';
}

function PetProfileNavBar({ pet, setPet }) {
    const [activeTab, setActiveTab] = useState('pet_name');
    const [appointments, setAppointments] = useState([]);
    const [medications, setMedications] = useState([]);
    const [vet, setVet] = useState([]);
    const [vaccine, setVaccine] = useState([]);
    const [healthCondition, setHealthCondition] = useState([]);
    const [food, setfood] = useState([]);
    const [behaviors, setBehaviors] = useState([]);
    const location = useLocation();
    const { id } = useParams();
    const navigate = useNavigate();

    // Switching to a different pet's profile shouldn't leave a stale tab selected from
    // whichever pet the owner was viewing before.
    useEffect(() => {
        setActiveTab('pet_name');
    }, [location]);

    useEffect(() => {

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) return;

            user.getIdToken().then(token => {
                const headers = { Authorization: `Bearer ${token}` };

                fetch(`${import.meta.env.VITE_API_BASE_URL}/appointments?pet_id=${id}`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setAppointments);

                fetch(`${import.meta.env.VITE_API_BASE_URL}/vets`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setVet);

                fetch(`${import.meta.env.VITE_API_BASE_URL}/medications?pet_id=${id}`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setMedications);

                fetch(`${import.meta.env.VITE_API_BASE_URL}/vaccines?pet_id=${id}`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setVaccine);

                fetch(`${import.meta.env.VITE_API_BASE_URL}/health_conditions?pet_id=${id}`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setHealthCondition);

                fetch(`${import.meta.env.VITE_API_BASE_URL}/foods?pet_id=${id}`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setfood);

                fetch(`${import.meta.env.VITE_API_BASE_URL}/behaviors?pet_id=${id}`, { headers })
                    .then(res => res.ok ? res.json() : [])
                    .then(setBehaviors);
            });
        });

        return unsubscribe;
    }, [id]);

    // Shared by every "Delete" handler below: DELETEs the record and, only if
    // it actually succeeded, removes it from the matching list. A failed
    // delete (expired login, server error, etc.) used to remove the row from
    // view anyway -- it would just reappear next time the page reloaded, with
    // nothing telling the user it was never really deleted.
    const deleteResource = async (resource, id) => {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/${resource}/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status !== 204) {
            console.error(await response.json());
            return false;
        }
        return true;
    };

    const onDeleteAppointment = async (appointment) => {
        if (!await deleteResource('appointments', appointment.appointment_id)) return;
        setAppointments(prev => prev.filter(a => a.appointment_id !== appointment.appointment_id));
    };

    const onDeleteVet = async (vet) => {
        if (!await deleteResource('vets', vet.vet_id)) return;
        setVet(prev => prev.filter(a => a.vet_id !== vet.vet_id));
    }

    const onDeleteMedication = async (medications) => {
        if (!await deleteResource('medications', medications.medication_id)) return;
        setMedications(prev => prev.filter(a => a.medication_id !== medications.medication_id));
    }

    const onDeleteVaccine = async (vaccine) => {
        if (!await deleteResource('vaccines', vaccine.vaccine_id)) return;
        setVaccine(prev => prev.filter(a => a.vaccine_id !== vaccine.vaccine_id));
    }

    const onDeleteHealthCondition = async (healthCondition) => {
        if (!await deleteResource('health_conditions', healthCondition.condition_id)) return;
        setHealthCondition(prev => prev.filter(a => a.condition_id !== healthCondition.condition_id));
    }

    const onDeleteFood = async (food) => {
        if (!await deleteResource('foods', food.food_id)) return;
        setfood(prev => prev.filter(a => a.food_id !== food.food_id));
    }

    const onDeleteBehavior = async (behaviors) => {
        if (!await deleteResource('behaviors', behaviors.behavior_id)) return;
        setBehaviors(prev => prev.filter(a => a.behavior_id !== behaviors.behavior_id));
    }

    // Shared by every "Save" handler below: PUTs the edited record, and on
    // success swaps the updated row into the matching list in place. Returns
    // whether it worked, so the row knows whether it's safe to stop editing.
    const saveResource = async (resource, id, idField, data, setState) => {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/${resource}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.error(await response.json());
            return false;
        }

        const updated = await response.json();
        setState(prev => prev.map(item => item[idField] === id ? updated : item));
        return true;
    };

    const onSaveAppointment = (id, data) => saveResource('appointments', id, 'appointment_id', data, setAppointments);

    // A vet edit touches two records: the vet itself, and the office it
    // belongs to. Both PUTs need to succeed -- if the office update fails,
    // the vet update is skipped rather than leaving the two out of sync.
    const onSaveVet = async (id, data) => {
        const { office, ...vetData } = data;
        const token = await auth.currentUser.getIdToken();
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

        const officeResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/vet_offices/${vetData.office_name_id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(office)
        });
        if (!officeResponse.ok) {
            console.error(await officeResponse.json());
            return false;
        }

        return saveResource('vets', id, 'vet_id', vetData, setVet);
    };

    const onSaveMedication = (id, data) => saveResource('medications', id, 'medication_id', data, setMedications);
    const onSaveVaccine = (id, data) => saveResource('vaccines', id, 'vaccine_id', data, setVaccine);
    const onSaveHealthCondition = (id, data) => saveResource('health_conditions', id, 'condition_id', data, setHealthCondition);
    const onSaveFood = (id, data) => saveResource('foods', id, 'food_id', data, setfood);
    const onSaveBehavior = (id, data) => saveResource('behaviors', id, 'behavior_id', data, setBehaviors);

    // Shared by every "+ Add ___" row's create handler below: POSTs a new
    // record and, on success, adds it to the front of the matching list.
    const createResource = async (resource, data, setState) => {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/${resource}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.error(await response.json());
            return false;
        }

        const created = await response.json();
        setState(prev => [created, ...prev]);
        return true;
    };

    const onCreateAppointment = (data) => createResource('appointments', data, setAppointments);
    const onCreateMedication = (data) => createResource('medications', data, setMedications);
    const onCreateVaccine = (data) => createResource('vaccines', data, setVaccine);
    const onCreateHealthCondition = (data) => createResource('health_conditions', data, setHealthCondition);
    const onCreateFood = (data) => createResource('foods', data, setfood);
    const onCreateBehavior = (data) => createResource('behaviors', data, setBehaviors);

    // A new vet needs its office created first (same two-step flow as the
    // Add Vet page), then the vet itself, linked to that new office.
    const onCreateVet = async (data) => {
        const { office, ...vetData } = data;
        const token = await auth.currentUser.getIdToken();
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

        const officeResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/vet_offices`, {
            method: 'POST',
            headers,
            body: JSON.stringify(office)
        });
        if (!officeResponse.ok) {
            console.error(await officeResponse.json());
            return false;
        }
        const newOffice = await officeResponse.json();

        return createResource('vets', { ...vetData, office_name_id: newOffice.vet_office_id }, setVet);
    };

    // Microchip info lives directly on the pet's own record, not a separate
    // table -- saving/clearing it means PUTting the whole pet back with just
    // those four fields changed, same as editPetProfile.jsx's Save Changes.
    const onSaveMicrochip = async (data) => {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pets/${pet.pet_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                ...pet,
                intact: Boolean(pet.intact),
                primary_vet_id: pet.primary_vet_id || null,
                ...data,
            })
        });

        if (!response.ok) {
            console.error(await response.json());
            return false;
        }

        setPet(await response.json());
        return true;
    };

    const onDeleteMicrochip = () => onSaveMicrochip({
        microchip_number: '',
        date_microchipped: '',
        microchip_company: '',
        microchip_url: '',
    });

    return (
        <>
        <div className='pet-profile-nav-bar'>
            <button className={activeTab === 'pet_name' ? 'active' : ''} onClick={() => setActiveTab('pet_name')}>Bio</button>
            <button className={activeTab === 'microchip' ? 'active' : ''} onClick={() => setActiveTab('microchip')}>Microchip</button>
            <button className={activeTab === 'appointments' ? 'active' : ''} onClick={() => setActiveTab('appointments')}>Appointments</button>
            <button className={activeTab === 'vet' ? 'active' : ''} onClick={() => setActiveTab('vet')}>Vet</button>
            <button className={activeTab === 'medications' ? 'active' : ''} onClick={() => setActiveTab('medications')}>Medications</button>
            <button className={activeTab === 'vaccine' ? 'active' : ''} onClick={() => setActiveTab('vaccine')}>Vaccines</button>
            <button className={activeTab === 'healthCondition' ? 'active' : ''} onClick={() => setActiveTab('healthCondition')}>Health Conditions</button>
            <button className={activeTab === 'food' ? 'active' : ''} onClick={() => setActiveTab('food')}>Food</button>
            <button className={activeTab === 'behaviors' ? 'active' : ''} onClick={() => setActiveTab('behaviors')}>Behaviors</button>
            <button className={activeTab === 'editPetProfile' ? 'active' : ''} onClick={() => navigate('/editPetProfile', { state: { pet } })}>Edit Pet Profile</button>
        </div>

        <div className='pet-profile-tab-content'>
            {activeTab === 'pet_name' && (
                <PetProfileDetails
                pet={pet} />
            )}

            {activeTab === 'microchip' && (
                <PetMicrochipTable
                pet={pet}
                onSave={onSaveMicrochip}
                onDelete={onDeleteMicrochip} />
            )}

            {activeTab === 'appointments' && (
                <PetAppointmentTable
                    appointments={appointments}
                    petId={Number(id)}
                    vets={vet}
                    onSave={onSaveAppointment}
                    onCreate={onCreateAppointment}
                    onDelete={onDeleteAppointment} />
            )}

            {activeTab === 'vet' && (
                <PetVetTable
                    vet={vet}
                    onSave={onSaveVet}
                    onCreate={onCreateVet}
                    onDelete={onDeleteVet} />
            )}

            {activeTab === 'medications' && (
                <PetMedicationTable
                medication={medications}
                petId={Number(id)}
                vets={vet}
                onSave={onSaveMedication}
                onCreate={onCreateMedication}
                onDelete={onDeleteMedication} />
            )}

            {activeTab === 'vaccine' && (
                <PetVaccineTable
                vaccine={vaccine}
                petId={Number(id)}
                vets={vet}
                onSave={onSaveVaccine}
                onCreate={onCreateVaccine}
                onDelete={onDeleteVaccine} />
            )}

            {activeTab === 'healthCondition' && (
                <PetHealthConditionTable
                condition={healthCondition}
                petId={Number(id)}
                vets={vet}
                onSave={onSaveHealthCondition}
                onCreate={onCreateHealthCondition}
                onDelete={onDeleteHealthCondition} />
            )}

            {activeTab === 'food' && (
                <PetFoodTable
                food={food}
                petId={Number(id)}
                onSave={onSaveFood}
                onCreate={onCreateFood}
                onDelete={onDeleteFood} />
            )}

            {activeTab === 'behaviors' && (
                <PetBehaviorTable
                behavior={behaviors}
                petId={Number(id)}
                onSave={onSaveBehavior}
                onCreate={onCreateBehavior}
                onDelete={onDeleteBehavior} />
            )}
        </div>
        </>
    );

}

function PetProfile() {
    const { id } = useParams();
    const [pet, setPet] = useState(null);
    const [notFound, setNotFound] = useState(false);
    // const [uploading, setUploading] = useState(false); // FIREBASE STORAGE: re-enable with upload

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) return;

            user.getIdToken()
                .then(token => fetch(`${import.meta.env.VITE_API_BASE_URL}/pets/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }))
                .then(res => {
                    // A failed request (no such pet, expired login, server error) sends back
                    // an {error: ...} object instead of a pet -- show a message instead of
                    // silently rendering a blank name.
                    if (!res.ok) {
                        setNotFound(true);
                        return null;
                    }
                    return res.json();
                })
                .then(data => { if (data) setPet(data); });
        });

        return unsubscribe;
    }, [id]);

    // FIREBASE STORAGE PHOTO UPLOAD -- on hold until Storage billing (Blaze plan) is turned on.
    // Runs when the owner picks a photo file: puts the file in Firebase Storage, then saves
    // the resulting web address (URL) on the pet's record so we can display it later.
    // const onPhotoSelected = async (event) => {
    //     const file = event.target.files[0];
    //     if (!file || !pet) return;
    //
    //     setUploading(true);
    //     try {
    //         const user = auth.currentUser;
    //         const token = await user.getIdToken();
    //
    //         // Store the file under a path unique to this pet, e.g. pet-photos/<uid>/<petId>
    //         const photoRef = ref(storage, `pet-photos/${user.uid}/${id}`);
    //         await uploadBytes(photoRef, file);
    //         const photoUrl = await getDownloadURL(photoRef);
    //
    //         // The backend replaces the whole pet record on update, so we send everything back,
    //         // just swapping in the new photo URL. "intact" comes back from the database as 0/1
    //         // instead of true/false, so it needs to be converted to a real boolean first.
    //         const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pets/${id}`, {
    //             method: 'PUT',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 Authorization: `Bearer ${token}`
    //             },
    //             body: JSON.stringify({ ...pet, pet_photo_url: photoUrl, intact: Boolean(pet.intact) })
    //         });
    //
    //         if (response.ok) {
    //             setPet(await response.json());
    //         }
    //     } finally {
    //         setUploading(false);
    //     }
    // };

    if (notFound) return <p>Couldn't load this pet. Try refreshing the page. If the problem persists, <Link className='pet-profile-contact-us-link' to="/contactUs">contact Support.</Link></p>;
    if (!pet) return <p>Loading...</p>;

    const hasRealPhoto = Boolean(pet.pet_photo_url);

    return (
        <>
            <br></br>
            <div className="pet-profile-header">
                {/* FIREBASE STORAGE PHOTO UPLOAD -- swap this <img> for the commented-out
                    <label>/<input> block below once uploads are re-enabled. */}
                <img
                    src={hasRealPhoto ? pet.pet_photo_url : getDefaultPhoto(pet.pet_type)}
                    alt={hasRealPhoto ? `${pet.pet_name}'s photo` : `Default ${pet.pet_type || 'pet'} illustration`}
                    className="pet-photo"
                />

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
                <h1>{pet.pet_name}</h1>
            </div>
            <br></br>
            <PetProfileNavBar pet={pet} setPet={setPet} />
            <br></br>
            <br></br>
        </>
    );
}

export {PetProfileNavBar};
export default PetProfile;
