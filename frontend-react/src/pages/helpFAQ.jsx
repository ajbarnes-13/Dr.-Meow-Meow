import React from "react";
import './helpFAQ.css';

const faqs = [
    {
        question: "How do I add a pet?",
        answer: "Use the \"Add New Pet\" link in the menu, or the \"Add Pet\" button on the Home page.",
    },
    {
        question: "How do I edit or delete a pet's info?",
        answer: "Open \"Edit Pet Profile\" in the menu and pick the pet. A \"Delete Pet\" button is at the bottom of that page if you need to remove one entirely.",
    },
    {
        question: "How do I add an appointment?",
        answer: "Use the \"Add New Appointment\" link in the menu, or the \"Add Appointment\" button on the Home page.",
    },
    {
        question: "Can I upload a photo of my pet?",
        answer: "Not yet -- photo uploads are on the roadmap but aren't live in the app just yet.",
    },
    {
        question: "A page looks empty or isn't loading. What should I do?",
        answer: "Try refreshing the page first. If it still looks wrong, email me using the address below and let me know what page it was and what you were doing -- that helps me track down the problem.",
    },
    {
        question: "Is my data private?",
        answer: "Yes. Your pets and their information are only visible to your own account.",
    },
    {
        question: "How do I delete my account?",
        answer: "Go to \"Account\" in the menu and use the \"Delete Account\" button at the bottom of the page. This permanently deletes your account and all of your pets' data, so make sure that's really what you want first.",
    },
];

function HelpFAQ() {
    return (
        <div className="help-page">
            <h1>Help</h1>

            <div className="faq-list">
                {faqs.map((faq) => (
                    <section className="faq-item" key={faq.question}>
                        <h2>{faq.question}</h2>
                        <p>{faq.answer}</p>
                    </section>
                ))}
            </div>

            <p className="faq-contact-line">
                Couldn't find an answer here? Send me an email at{' '}
                <a href="mailto:alice.m.j.barnes@gmail.com">alice.m.j.barnes@gmail.com</a>.
            </p>
        </div>
    );
}

export default HelpFAQ;
