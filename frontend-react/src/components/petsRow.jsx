import {MdEdit, MdDelete} from 'react-icons/md';
import { Link } from 'react-router-dom';

function PetsRow({pet, onEdit, onDelete}) {
    // Combines columns colur, fur_type, and markings into one column called Description to make the page less crowded
    
const description = [pet.color, pet.fur_marking, pet.fur_type].filter(Boolean).join(' ');
    return (
        <tr>
            <td className='pet-name-link'><Link to={`/petProfile/${pet.pet_id}`}>{pet.pet_name}</Link></td>
            <td className='pet-data'>{pet.pet_type}</td>
            <td className='pet-data'>{pet.age}</td>
            <td className='pet-data'>{pet.birthdate}</td>
            <td className='pet-data'>{pet.adoption_date}</td>
            <td className='pet-data'>{pet.came_from}</td>
            <td className='pet-data'>{pet.deceased_date}</td>
            <td className='pet-data'>{description}</td>
            <td className='pet-data'>{pet.eye_color}</td>
            <td className='pet-data'>{pet.whisker_color}</td>
            <td className='pet-data'>{pet.vocal_level}</td>
            <td className='pet-data'>{pet.play_style}</td>
            <td className='pet-data'>{pet.temperament}</td>
            <td className='pet-data'>{pet.sex}</td>
            <td className='pet-data'>{pet.pet_weight}</td>
            <td className='pet-data'>{pet.intact}</td>
            <td className='pet-data'>{pet.spay_neuter_date}</td>
            <td className='pet-data'>{pet.primary_vet_name}</td>
            <td><MdEdit onClick={() => onEdit(pet)} /></td>
            <td><MdDelete onClick={() => onDelete(pet.pet_id)} /></td>
        </tr>
    );
}

export default PetsRow;
