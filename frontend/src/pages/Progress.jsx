import React, { useEffect, useRef, useState } from 'react';
import './Progress.css';


const Progress = () => {
    const progressBarRef = useRef(null); // Reference for the progress bar
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 5; // Total number of steps

    useEffect(() => {
        if (progressBarRef.current) {
            progressBarRef.current.style.width = ((currentStep - 1) / (totalSteps - 1)) * 100 + "%";
        }
    }, [currentStep]);

    const updateSteps = (direction) => {
        setCurrentStep((prevStep) => {
            const newStep = direction === "next" ? prevStep + 1 : prevStep - 1;
            return Math.min(Math.max(newStep, 1), totalSteps);
        });
    };

    return (
        <section className="progress">
            <section className="progress-steps">
                {Array.from({ length: totalSteps }).map((_, index) => (
                    <label
                        key={index}
                        className={`circle ${index < currentStep ? "active" : ""}`}
                    >
                        {index * 25}%
                    </label>
                ))}
                <section className="progress-bar">
                    <label ref={progressBarRef} className="indicator"></label>
                </section>
            </section>
            <section className="buttons">
                <button
                    onClick={() => updateSteps("prev")}
                    disabled={currentStep === 1}
                    className="updatebtn"
                >
                    Cancel
                </button>
                <button
                    onClick={() => updateSteps("next")}
                    disabled={currentStep === totalSteps}
                    className="cancelbtn"
                >
                    Update
                </button>
            </section>
        </section>
    );
};

export default Progress;


