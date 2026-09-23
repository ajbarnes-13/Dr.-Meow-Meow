import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './unsavedChangesGuard.css';

// Warns the user in-app (not the browser's native "leave site?" dialog) if
// they try to navigate away from a form with unsaved changes on it.
//
// Catches two things while `dirty` is true: clicking any in-app link (the
// nav menu, the brand logo, the footer -- anything React Router's <Link>
// renders as a plain <a>), and calling the `guardedNavigate` this hook
// returns (wire a page's own "Cancel" button through it instead of the
// navigate() from useNavigate()).
//
// Deliberately does NOT catch the browser's back/forward buttons or an
// actual tab close/refresh -- only the native beforeunload dialog can do
// that, and the whole point here is to not use that.
//
// A page's own post-save navigate() (after a successful submit) should stay
// a plain, un-guarded call -- it never goes through this hook, so a
// just-saved page can never block its own "where to go now" redirect.
function useUnsavedChangesGuard(dirty) {
    const navigate = useNavigate();
    const [pendingHref, setPendingHref] = useState(null);
    const dirtyRef = useRef(dirty);
    dirtyRef.current = dirty;

    useEffect(() => {
        const onClick = (e) => {
            if (!dirtyRef.current) return;
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

            const anchor = e.target.closest('a[href]');
            if (!anchor || anchor.target === '_blank') return;

            const url = new URL(anchor.href, window.location.origin);
            if (url.origin !== window.location.origin) return; // let external links behave normally

            e.preventDefault();
            setPendingHref(url.pathname + url.search + url.hash);
        };

        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    // Use this in place of navigate() for anything that should be held back
    // (like a Cancel button) while there are unsaved changes.
    const guardedNavigate = (to) => {
        if (dirtyRef.current) {
            setPendingHref(to);
            return;
        }
        navigate(to);
    };

    const confirmLeave = () => {
        const href = pendingHref;
        setPendingHref(null);
        if (href) navigate(href);
    };

    const cancelLeave = () => setPendingHref(null);

    const modal = pendingHref !== null && (
        <div className="unsaved-changes-overlay">
            <div className="unsaved-changes-box">
                <p>You have unsaved changes. Leave without saving?</p>
                <button type="button" onClick={cancelLeave}>Stay</button>
                <button type="button" className="unsaved-changes-leave-button" onClick={confirmLeave}>Leave</button>
            </div>
        </div>
    );

    return { guardedNavigate, modal };
}

export default useUnsavedChangesGuard;
