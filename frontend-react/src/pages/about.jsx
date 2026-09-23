import React from "react";
import { Navigate } from "react-router-dom";
import './about.css';

function aboutPage() {
    return (
        <>
            <h1>About</h1>
                <h2>Hello, meow!</h2>
                        <p>
                            Dr. Meow Meow is a solo project I made as a computer science student for my portfolio. The idea
                            started with my cat, Sunny, aka Bun-bun. She began having health problems, and I found myself 
                            struggling to piece together a timeline: when did this start, how often is it happening, is there 
                            a pattern I'm missing? I built the first version of this app to solve that one problem for myself. 
                            However, I also enjoy collecting data, so it quickly grew into a much larger app for tracking more 
                            than just health problems. The goal is for any pet parent to be able to keep their pet's data organized 
                            in one place, without relying on faulty memory or scattered notes.
                        </p>
                        <p>
                            Like what you see? Find more of my work and my resume at{' '}
                            <a href="https://alicebarnes.vercel.app/" target="_blank" rel="noopener noreferrer">my website</a>,
                            or email me at <a href="mailto:alice.m.j.barnes@gmail.com">alice.m.j.barnes@gmail.com</a>.
                        </p>
        </>
    );
}

export default aboutPage;