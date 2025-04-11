import React from 'react';
import './RoleSelection.css'; //importing css style file
const RoleSelection = () => {
    return (
        <main className='role-selection'>
            <section className='role-body'>
                <h1>Are you a ... ?</h1>
                <section className='roles-container'>
                    <section className='client-description'>
                        <h2>Client</h2>
                        <p>A client is someone looking to hire a person</p>
                    </section>
                    <section className='freelancer-description'>
                        <h2>Freelancer</h2>
                        <p>A freelancer is a person looking to be of service</p>
                    </section>
                </section>
            </section>
        </main>
    );
};

export default RoleSelection;