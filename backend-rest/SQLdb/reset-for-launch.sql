-- Run this ONCE, right before going live, to wipe out every seeded/test row and
-- start production with a clean, empty database. Do not run this after real users exist.

USE dr_meow_meow;

SET FOREIGN_KEY_CHECKS = 0; -- lets us empty tables without worrying about FK order

TRUNCATE TABLE vaccine;
TRUNCATE TABLE medication;
TRUNCATE TABLE health_condition;
TRUNCATE TABLE appointment;
TRUNCATE TABLE food;
TRUNCATE TABLE behavior;
TRUNCATE TABLE pet;
TRUNCATE TABLE vet;
TRUNCATE TABLE vet_office;

SET FOREIGN_KEY_CHECKS = 1;
