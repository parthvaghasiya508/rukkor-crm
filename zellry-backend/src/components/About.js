import React from 'react'
import Layout from './layout'

function About() {
    return ( <
        Layout title = "About Us" >
        <
        div className = "container-fluid" > { /* Page Heading */ } <
        h1 className = "h3 mb-4 text-gray-800" > About Us < /h1> <
        /div> <
        /Layout>
    );
}

export default About