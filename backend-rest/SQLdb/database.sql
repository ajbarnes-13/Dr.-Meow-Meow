-- SQL Database Backend for Dr Meow Meow --
-- Alice Barnes --

CREATE DATABASE dr_meow_meow;
USE dr_meow_meow; -- sets dr_meow_meow as the active database for every statement below --

SET FOREIGN_KEY_CHECKS = 0; -- temporarily disables FK constraint checks so tables can be created without failing on a referenced table that doesn't exist yet --

CREATE TABLE vet_office (
    vet_office_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL UNIQUE,
    owner_uid VARCHAR(128) NOT NULL, -- Firebase Auth uid of the owning user; verified server-side on every request, never trusted from the client --
    office_name VARCHAR(100) NOT NULL,
    office_address VARCHAR(100), -- optional: an office can be created with just a name, filled in with a full address later --
    address_2 VARCHAR(100),
    city VARCHAR(100),
    office_state VARCHAR(100),
    zip_code VARCHAR(10),

    INDEX idx_vet_office_owner_uid (owner_uid)
);

CREATE TABLE vet (
    vet_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL UNIQUE,
    vet_name VARCHAR(100) NOT NULL,
    office_name_id INT NOT NULL,
    phone_number VARCHAR(25) NOT NULL, -- VARCHAR so it can be formatted like 123-456-7890 --
    website VARCHAR(100),

    FOREIGN KEY (office_name_id) REFERENCES vet_office(vet_office_id)
);

CREATE TABLE pet (
    pet_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL UNIQUE,
    owner_uid VARCHAR(128) NOT NULL, -- Firebase Auth uid of the owning user; verified server-side on every request, never trusted from the client --
    pet_photo_url VARCHAR(255),
    pet_name VARCHAR(50) NOT NULL,
    pet_type VARCHAR(50) NOT NULL,
    breed VARCHAR(50),
    age INT NOT NULL, -- see if this can be autocalculated based on pet's birthdate + today's date--
    birthdate DATE NOT NULL,
    adoption_date DATE NOT NULL,
    deceased_date DATE,
    color VARCHAR(50) NOT NULL,
    fur_type VARCHAR(50),
    fur_marking VARCHAR(50), -- possibly will have multiple instances for one pet, so possibly should be its own table? --
    eye_color VARCHAR(50), -- possibly will have multiple instances for one pet, some cats and certain dog breeds commonly have different colored eyes, so possibly should be its own table? --
    whisker_color VARCHAR(50),
    vocal_level VARCHAR(50),
    sex VARCHAR(50) NOT NULL,
    intact BOOL NOT NULL CHECK (intact IN (0, 1)), -- the check ensures this column is only ever TRUE (1) or FALSE (0) and prevents meaningless values, like a 5, from being inserted. --
    spay_neuter_date DATE,
    came_from VARCHAR(50) NOT NULL,
    primary_vet_id INT,
    play_style VARCHAR(255) NOT NULL,
    temperament VARCHAR(255) NOT NULL,
    pet_weight VARCHAR(50) NOT NULL,
    microchip_number VARCHAR(50), -- optional: not every pet is microchipped --
    date_microchipped DATE,
    microchip_company VARCHAR(100),
    microchip_url VARCHAR(255), -- link to the microchip registry's lookup/registration page --

    FOREIGN KEY (primary_vet_id) REFERENCES vet(vet_id),
    INDEX idx_pet_owner_uid (owner_uid)
);

CREATE TABLE vaccine (
    vaccine_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL UNIQUE,
    pet_id INT NOT NULL,
    vaccine_name VARCHAR(50) NOT NULL,
    date_given DATE NOT NULL,
    next_due_date DATE NOT NULL,
    vet_id INT NOT NULL,

    FOREIGN KEY (pet_id) REFERENCES pet(pet_id),
    FOREIGN KEY (vet_id) REFERENCES vet(vet_id)
);

CREATE TABLE medication (
    medication_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL UNIQUE,
    medication_name VARCHAR(100),
    pet_id INT,
    reason VARCHAR(255),
    date_prescribed DATE,
    date_stopped DATE,
    dosage VARCHAR(50),
    time_to_take TIME,
    times_per_day INT,
    with_food BOOL CHECK (with_food in (0, 1)),
    next_dose_due DATE,
    vet_prescribed_by_id INT,

    FOREIGN KEY (pet_id) REFERENCES pet(pet_id),
    FOREIGN KEY (vet_prescribed_by_id) REFERENCES vet(vet_id)
);

CREATE TABLE health_condition (
    condition_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL UNIQUE,
    `condition` VARCHAR(255),
    pet_id INT,
    date_diagnosed DATE,
    vet_diagnosed_by_id INT,
    treatment VARCHAR(255),

    FOREIGN KEY (pet_id) REFERENCES pet(pet_id),
    FOREIGN KEY (vet_diagnosed_by_id) REFERENCES vet(vet_id)
);

CREATE TABLE appointment (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL UNIQUE,
    pet_id INT,
    vet_id INT,
    office_name_id INT,
    reason VARCHAR(255),
    appointment_date DATE,
    appointment_time TIME,
    summary VARCHAR(255),

    FOREIGN KEY (pet_id) REFERENCES pet(pet_id),
    FOREIGN KEY (vet_id) REFERENCES vet(vet_id),
    FOREIGN KEY (office_name_id) REFERENCES vet_office(vet_office_id)
);

CREATE TABLE food (
    food_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL UNIQUE,
    food_type VARCHAR(50), -- wet food or dry food --
    brand VARCHAR(100),
    flavor VARCHAR(50),
    how_often VARCHAR(50), -- free text, e.g. "Twice daily" -- not a count, so not an INT --
    how_much VARCHAR(50),
    health_consideration VARCHAR(255),
    date_started DATE,
    date_stopped DATE,
    pet_id INT,

    FOREIGN KEY (pet_id) REFERENCES pet(pet_id)
);

CREATE TABLE behavior (
    behavior_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL UNIQUE,
    pet_id INT,
    behavior VARCHAR(255),
    date_started DATE,
    frequency VARCHAR(100),
    total_occurrences INT,
    date_stopped DATE,

    FOREIGN KEY (pet_id) REFERENCES pet(pet_id)
);

SET FOREIGN_KEY_CHECKS = 1; -- re-enables the FK constraint checks that were turned off at the top of the script --