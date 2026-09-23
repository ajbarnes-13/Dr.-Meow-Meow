import PetsRow from './petsRow';

function PetsTable({pets, onDelete, onEdit}) {
    return (
        <table className='PetsTable'>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Age</th>
                    <th>Birthday</th>
                    <th>Adoption Date</th>
                    <th>Came From</th>
                    <th>Deceased Date</th>
                    <th>Description</th>
                    <th>Eye Color</th>
                    <th>Whisker Color</th>
                    <th>Vocal Level</th>
                    <th>Play Style</th>
                    <th>Personality</th>
                    <th>Sex</th>
                    <th>Weight</th>
                    <th>Intact</th>
                    <th>Spay / Neuter Date</th>
                    <th>Vet</th>
                </tr>
            </thead>

            <tbody>
                {pets.map((pet) => (
                    <PetsRow
                    key={pet.pet_id}
                    pet={pet}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    />
                ))}
            </tbody>
        </table>
    );
}

export default PetsTable;
