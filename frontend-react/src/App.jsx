import { useState, useEffect, useRef } from "react";
import {BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate} from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import './App.css';
import Home from './pages/home'
import Appointments from './pages/appointments'
import ContactUs from './pages/contactUs'
import HelpFAQ from './pages/helpFAQ'
import Login from './pages/login'
import PetProfile from './pages/petProfile'
import Pets from './pages/pets'
import UserProfile from './pages/userProfile'
import About from './pages/about';
import PrivacyPolicy from './pages/privacyPolicy';
import EditPetProfile from './pages/editPetProfile';
import AddPet from './pages/addPet';
import AddAppointment from './pages/addAppointment';
import AddVet from './pages/addVet';

// Guards a route so it only renders for a signed-in user; anyone else is sent
// to /login (remembering where they were trying to go, so login can send them
// back there). Renders nothing during the brief moment before Firebase has
// reported whether anyone's logged in, so a signed-in user isn't bounced to
// /login for a flash on refresh before their session is confirmed.
function RequireAuth({ authChecked, loggedIn, children }) {
    const location = useLocation();

    if (!authChecked) return null;
    if (!loggedIn) return <Navigate to="/login" state={{ from: location }} replace />;

    return children;
}

function NavBar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [petsMenuOpen, setPetsMenuOpen] = useState(false);
    const [editPetMenuOpen, setEditPetMenuOpen] = useState(false);
    const [pets, setPets] = useState([]);
    const [loggedIn, setLoggedIn] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const navRef = useRef(null);

    // Closes both submenus -- called whenever the user clicks anything else in
    // the nav (a plain link, Log Out, or the other submenu's own toggle) so
    // only one thing can ever be open at a time, instead of a submenu only
    // closing when its own button is clicked again.
    const closeSubmenus = () => {
        setPetsMenuOpen(false);
        setEditPetMenuOpen(false);
    };

    // Actually signs the user out of Firebase, then sends them to the login page
    const handleLogout = async () => {
        setMenuOpen(false);
        closeSubmenus();
        await signOut(auth);
        navigate('/login');
    };

    // Closes the whole menu (and any open submenu) whenever the route changes --
    // catches navigation that doesn't go through a Link's own onClick, like the
    // browser's back/forward buttons.
    useEffect(() => {
        setMenuOpen(false);
        setPetsMenuOpen(false);
        setEditPetMenuOpen(false);
    }, [location.pathname]);

    // Closes the menu on a click anywhere outside the nav (including its
    // submenus), same as any standard dropdown.
    useEffect(() => {
        if (!menuOpen) return;

        const onClickOutside = (e) => {
            if (navRef.current && !navRef.current.contains(e.target)) {
                setMenuOpen(false);
                setPetsMenuOpen(false);
                setEditPetMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [menuOpen]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setLoggedIn(Boolean(user));

            if (!user) {
                setPets([]);
                return;
            }

            user.getIdToken()
                .then(token => fetch(`${import.meta.env.VITE_API_BASE_URL}/pets`, {
                    headers: { Authorization: `Bearer ${token}` }
                }))
                // A failed request sends back an {error: ...} object instead of a list --
                // fall back to an empty list so the "Pet Profiles" menu can't crash on it.
                .then(res => res.ok ? res.json() : [])
                .then(setPets)
                .catch(err => console.error(err));
        });

        return unsubscribe;
    }, []);

    // No menu at all on the login screen, or for a signed-out visitor. A guest
    // reading the public Help/Contact/About/Privacy pages has nothing here
    // that isn't behind a login anyway -- they can move between those pages
    // via the footer, and get to /login via the header logo/title.
    if (location.pathname === "/" || location.pathname === "/login" || !loggedIn) {
        return null;
    }

    return (
        <div className="nav-wrapper" ref={navRef}>
            <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>☰</button>

            <nav className={menuOpen ? "open" : ""}>
                <Link to="/home" onClick={() => { setMenuOpen(false); closeSubmenus(); }}>Home</Link>

                <div className="submenu-wrapper">
                    <button type="button" onClick={() => { setPetsMenuOpen(!petsMenuOpen); setEditPetMenuOpen(false); }}>Pet Profiles</button>
                    {petsMenuOpen && (
                        <div className="submenu">
                            {pets.map(pet => (
                                <Link key={pet.pet_id} to={`/petProfile/${pet.pet_id}`} onClick={() => { setMenuOpen(false); setPetsMenuOpen(false); }}>{pet.pet_name}</Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="submenu-wrapper">
                    <button type="button" onClick={() => { setEditPetMenuOpen(!editPetMenuOpen); setPetsMenuOpen(false); }}>Edit Pet Profile</button>
                    {editPetMenuOpen && (
                        <div className="submenu">
                            {pets.map(pet => (
                                <Link key={pet.pet_id} to="/editPetProfile" state={{ pet }} onClick={() => { setMenuOpen(false); setEditPetMenuOpen(false); }}>{pet.pet_name}</Link>
                            ))}
                        </div>
                    )}
                </div>

                <Link to="/pets" onClick={() => { setMenuOpen(false); closeSubmenus(); }}>My Pets</Link>
                <Link to="/appointments" onClick={() => { setMenuOpen(false); closeSubmenus(); }}>Appointments</Link>
                <Link to="/addPet" onClick={() => { setMenuOpen(false); closeSubmenus(); }}>Add New Pet</Link>
                <Link to="/addAppointment" onClick={() => { setMenuOpen(false); closeSubmenus(); }}>Add New Appointment</Link>
                <Link to="/addVet" onClick={() => { setMenuOpen(false); closeSubmenus(); }}>Add New Vet</Link>
                <Link to="/userProfile" onClick={() => { setMenuOpen(false); closeSubmenus(); }}>Account</Link>
                <Link to="/helpFAQ" onClick={() => { setMenuOpen(false); closeSubmenus(); }}>Help</Link>
                <button type="button" className="link-button" onClick={handleLogout}>Log Out</button>
            </nav>
        </div>
    );
}

function App() {
    // Tracks whether anyone's logged in so the header logo/title only link to
    // /home for a signed-in user (otherwise they send you to /login instead),
    // and so the protected routes below can turn away anyone who isn't signed in.
    const [loggedIn, setLoggedIn] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setLoggedIn(Boolean(user));
            setAuthChecked(true);
        });
        return unsubscribe;
    }, []);

    const brandDestination = loggedIn ? '/home' : '/login';

    return (
        <Router>
            <header>
                <div className="brand">
                    <Link to={brandDestination}><img src="/dr_meow_meow_mascot.png" width="100"
                    alt="A cartoon kawaii Siamese cat in an old-timey doctor uniform. She is standing in her doctor office. She is the mascot for Doctor Meow Meow. This image was generated with Gemini AI"
                    /></Link>
                    <h1><Link to={brandDestination}>Dr. Meow Meow</Link></h1>
                </div>

                <NavBar />
            </header>

            <main>
                <Routes>
                    {/* Public: no login required */}
                    <Route path="/" element={<Login/>} />
                    <Route path="/login" element={<Login/>} />
                    <Route path="/helpFAQ" element={<HelpFAQ/>} />
                    <Route path="/contactUs" element={<ContactUs/>} />
                    <Route path="/about" element={<About/>} />
                    {/*<Route path="/privacyPolicy" element={<PrivacyPolicy/>} /> */}

                    {/* Everything else touches a signed-in user's own data, so it
                        requires being logged in. */}
                    <Route path="/home" element={<RequireAuth authChecked={authChecked} loggedIn={loggedIn}><Home/></RequireAuth>} />
                    <Route path="/userProfile" element={<RequireAuth authChecked={authChecked} loggedIn={loggedIn}><UserProfile/></RequireAuth>} />
                    <Route path="/petProfile/:id" element={<RequireAuth authChecked={authChecked} loggedIn={loggedIn}><PetProfile/></RequireAuth>} />
                    <Route path="/pets" element={<RequireAuth authChecked={authChecked} loggedIn={loggedIn}><Pets/></RequireAuth>} />
                    <Route path="/appointments" element={<RequireAuth authChecked={authChecked} loggedIn={loggedIn}><Appointments/></RequireAuth>} />
                    <Route path="/editPetProfile" element={<RequireAuth authChecked={authChecked} loggedIn={loggedIn}><EditPetProfile/></RequireAuth>} />
                    <Route path="/addPet" element={<RequireAuth authChecked={authChecked} loggedIn={loggedIn}><AddPet/></RequireAuth>} />
                    <Route path="/addAppointment" element={<RequireAuth authChecked={authChecked} loggedIn={loggedIn}><AddAppointment/></RequireAuth>} />
                    <Route path="/addVet" element={<RequireAuth authChecked={authChecked} loggedIn={loggedIn}><AddVet/></RequireAuth>} />
                </Routes>
            </main>

            <footer>
                <p>&copy; 2026 Alice Barnes</p>
                <div className="foot-links">
                    <Link to="/contactUs">Contact</Link>
                    <Link to="/about">About</Link>
                    {/*<Link to="/privacyPolicy">Privacy Policy</Link>*/}
                </div>
            </footer>
        </Router>
    );
}

export default App;
