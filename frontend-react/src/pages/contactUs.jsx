import React from "react";
import './contactUs.css';

function ContactUs() {
    return (
        <div className="contact-page">
            <h1>Contact</h1>
            <p>
                Got a question, found a bug, or just want to tell me about your pet? I'd love to hear from you.
            </p>
            <p>
                Email me at alice.m.j.barnes@gmail.com.
            </p>
            <p>
                You can also see more of my work at{' '}
                <a href="https://alicebarnes.vercel.app/" target="_blank" rel="noopener noreferrer">my website</a>.
            </p>
        </div>
    );
}

export default ContactUs;
