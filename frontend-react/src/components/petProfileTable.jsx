import {
    PetProfileAppointmentsRow, PetProfileMicrochipRow, PetProfileBehaviorRow, PetProfileFoodRow, PetProfileHealthConditionRow, PetProfileMedicationRow, PetProfileVaccineRow, PetProfileVetRow,
    NewAppointmentRow, NewVetRow, NewMedicationRow, NewVaccineRow, NewHealthConditionRow, NewFoodRow, NewBehaviorRow,
} from './petProfileRow';

// Age in whole years as of today, based on birthdate; null if there's no birthdate to calculate from.
function calculateAge(birthdate) {
    if (!birthdate) return null;
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const hadBirthdayThisYear = today.getMonth() > birth.getMonth()
        || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
    if (!hadBirthdayThisYear) age -= 1;
    return age;
}

function PetProfileDetails({pet}) {
    const age = calculateAge(pet.birthdate) ?? pet.age;
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${month}/${day}/${year}`;
    };

    return (
        <div className='pet-profile-table-wrapper'>
        <table className='pet-profile-bio-table'>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Breed</th>
                    <th>Age</th>
                    <th>Birthday</th>
                    <th>Adoption Date</th>
                    <th>Deceased Date</th>
                    <th>Came From</th>
                    <th>Sex</th>
                    <th>Weight</th>
                    <th>Eye Color</th>
                    <th>Whisker Color</th>
                    <th>Vocal Level</th>
                    <th>Intact</th>
                    <th>Spay / Neuter Date</th>
                    <th>Primary Vet</th>
                </tr>
            </thead>

            <tbody>
                <tr>
                    <td className='bio-data'>{pet.pet_type}</td>
                    <td className='bio-data'>{pet.breed}</td>
                    <td className='bio-data'>{age}</td>
                    <td className='bio-data'>{formatDate(pet.birthdate)}</td>
                    <td className='bio-data'>{formatDate(pet.adoption_date)}</td>
                    <td className='bio-data'>{formatDate(pet.deceased_date)}</td>
                    <td className='bio-data'>{pet.came_from}</td>
                    <td className='bio-data'>{pet.sex}</td>
                    <td className='bio-data'>{pet.pet_weight}</td>
                    <td className='bio-data'>{pet.eye_color}</td>
                    <td className='bio-data'>{pet.whisker_color}</td>
                    <td className='bio-data'>{pet.vocal_level}</td>
                    <td className='bio-data'>{pet.intact ? 'Yes' : 'No'}</td>
                    <td className='bio-data'>{formatDate(pet.spay_neuter_date)}</td>
                    <td className='bio-data'>{pet.primary_vet_name}</td>
                </tr>
            </tbody>
        </table>
        </div>
    );
}

function PetMicrochipTable({pet, onSave, onDelete}) {
    return (
        <div className='pet-profile-table-wrapper'>
        <table className='pet-profile-microchip-table'>
            <thead>
                <tr>
                    <th>Microchip Number</th>
                    <th>Date Microchipped</th>
                    <th>Company</th>
                    <th>Website</th>
                </tr>
            </thead>

            <tbody>
                <PetProfileMicrochipRow pet={pet} onSave={onSave} onDelete={onDelete} />
            </tbody>
        </table>
        </div>
    );
}

function PetAppointmentTable({appointments, petId, vets, onSave, onCreate, onDelete}) {
    return (
        <div className='pet-profile-table-wrapper'>
        <table className='pet-profile-appointment-table'>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Vet</th>
                    <th>Office</th>
                    <th>Reason</th>
                    <th>Summary</th>
                </tr>
            </thead>

            <tbody>
                {appointments.map((appointment) => (
                    <PetProfileAppointmentsRow key={appointment.appointment_id} appointment={appointment} vets={vets} onSave={onSave} onDelete={onDelete} />
                ))}
                {onCreate && <NewAppointmentRow petId={petId} vets={vets} onCreate={onCreate} />}
            </tbody>
        </table>
        </div>
    );
}

function PetMedicationTable({medication, petId, vets, onSave, onCreate, onDelete}) {
    return (
        <div className='pet-profile-table-wrapper'>
        <table className='pet-profile-medication-table'>
            <thead>
                <tr>
                    <th>Medication</th>
                    <th>Reason</th>
                    <th>Prescribed By</th>
                    <th>Dosage</th>
                    <th>When to Take</th>
                    <th>How Often</th>
                    <th>With Food?</th>
                    <th>Next Dose Due</th>
                    <th>Date Started</th>
                    <th>Date Stopped</th>
                </tr>
            </thead>

            <tbody>
                {medication.map((medication) => (
                    <PetProfileMedicationRow key={medication.medication_id} medication={medication} vets={vets} onSave={onSave} onDelete={onDelete} />
                ))}
                {onCreate && <NewMedicationRow petId={petId} vets={vets} onCreate={onCreate} />}
            </tbody>
        </table>
        </div>
    );
}

function PetVetTable({vet, onSave, onCreate, onDelete}) {
    return (
        <div className='pet-profile-table-wrapper'>
        <table className='pet-profile-vet-table'>
            <thead>
                <tr>
                    <th>Vet</th>
                    <th>Office</th>
                    <th>Address</th>
                    <th>Phone</th>
                    <th>Website</th>
                </tr>
            </thead>

            <tbody>
                {vet.map((vet) => (
                    <PetProfileVetRow key={vet.vet_id} vet={vet} onSave={onSave} onDelete={onDelete} />
                ))}
                {onCreate && <NewVetRow onCreate={onCreate} />}
            </tbody>
        </table>
        </div>
    )
}

function PetVaccineTable({vaccine, petId, vets, onSave, onCreate, onDelete}) {
    return (
        <div className='pet-profile-table-wrapper'>
        <table className='pet-profile-vaccine-table'>
            <thead>
                <tr>
                    <th>Vaccine</th>
                    <th>Last Received</th>
                    <th>Next Due</th>
                    <th>Vet</th>
                </tr>
            </thead>

            <tbody>
                {vaccine.map((vaccine) => (
                    <PetProfileVaccineRow key={vaccine.vaccine_id} vaccine={vaccine} vets={vets} onSave={onSave} onDelete={onDelete} />
                ))}
                {onCreate && <NewVaccineRow petId={petId} vets={vets} onCreate={onCreate} />}
            </tbody>
        </table>
        </div>
    )
}

function PetHealthConditionTable({condition, petId, vets, onSave, onCreate, onDelete}) {
    return (
        <div className='pet-profile-table-wrapper'>
        <table className='pet-profile-health-condition-table'>
        <thead>
            <tr>
                <th>Health Condition</th>
                <th>Treatment</th>
                <th>Diagnosis Date</th>
                <th>Vet</th>
            </tr>
        </thead>

        <tbody>
            {condition.map((condition) => (
                <PetProfileHealthConditionRow key={condition.condition_id} condition={condition} vets={vets} onSave={onSave} onDelete={onDelete} />
            ))}
            {onCreate && <NewHealthConditionRow petId={petId} vets={vets} onCreate={onCreate} />}
        </tbody>
    </table>
    </div>
    )
}

function PetFoodTable({food, petId, onSave, onCreate, onDelete}) {
    return (
        <div className='pet-profile-table-wrapper'>
        <table className='pet-profile-food-table'>
        <thead>
            <tr>
                <th>Brand</th>
                <th>Wet or Dry?</th>
                <th>Flavor</th>
                <th>How Much</th>
                <th>How Often</th>
                <th>Health Consideration</th>
                <th>Date Started</th>
                <th>Date Stopped</th>
            </tr>
        </thead>

        <tbody>
            {food.map((food) => (
                <PetProfileFoodRow key={food.food_id} food={food} onSave={onSave} onDelete={onDelete} />
            ))}
            {onCreate && <NewFoodRow petId={petId} onCreate={onCreate} />}
        </tbody>
    </table>
    </div>
    )
}

function PetBehaviorTable({behavior, petId, onSave, onCreate, onDelete}) {
    return (
        <div className='pet-profile-table-wrapper'>
        <table className='pet-profile-behavior-table'>
        <thead>
            <tr>
                <th>Behavior</th>
                <th>Date Started</th>
                <th>Frequency</th>
                <th>Total Occurrences</th>
                <th>Date Stopped</th>
            </tr>
        </thead>

        <tbody>
            {behavior.map((behavior) => (
                <PetProfileBehaviorRow key={behavior.behavior_id} behavior={behavior} onSave={onSave} onDelete={onDelete} />
            ))}
            {onCreate && <NewBehaviorRow petId={petId} onCreate={onCreate} />}
        </tbody>
    </table>
    </div>
    )
}

export {PetProfileDetails, PetMicrochipTable, PetAppointmentTable, PetVetTable, PetMedicationTable, PetVaccineTable, PetHealthConditionTable, PetFoodTable, PetBehaviorTable};
