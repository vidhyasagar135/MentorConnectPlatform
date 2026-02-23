import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaBars,
    FaTimes,
    FaRobot,
    FaCalendarAlt,
    FaComments,
    FaChartLine,
    FaBrain,
    FaArrowRight,
    FaUsers,
} from 'react-icons/fa';

const Home = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    /* ---------------- Feature Card ---------------- */
    const FeatureCard = ({ icon: Icon, title, description }) => (
        <div className='p-10 bg-neutral-900 rounded-2xl hover:bg-neutral-800 transition-all duration-300 text-center flex flex-col shadow-lg'>
            <div className='text-5xl text-white mb-6 flex justify-center'>
                <Icon />
            </div>
            <h3 className='font-bold text-xl text-white mb-3'>{title}</h3>
            <p className='text-gray-400 flex-grow'>{description}</p>
        </div>
    );

    /* ---------------- Step Card ---------------- */
    const StepCard = ({ number, title, description }) => (
        <div className='relative bg-neutral-900 p-10 pt-14 rounded-2xl text-center hover:bg-neutral-800 transition shadow-lg'>
            <div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 flex items-center justify-center bg-white text-black rounded-full text-xl font-bold shadow-md'>
                {number}
            </div>
            <h3 className='text-2xl font-bold text-white mt-4 mb-4'>{title}</h3>
            <p className='text-gray-400'>{description}</p>
        </div>
    );

    return (
        <div className="font-sans min-h-screen flex flex-col bg-black text-white">

            {/* ---------------- Navbar ---------------- */}
            <nav className='bg-black sticky top-0 z-30 backdrop-blur-sm'>
                <div className='max-w-7xl mx-auto px-6'>
                    <div className='flex justify-between items-center h-20'>
                        <div className='text-2xl font-bold text-white'>
                            <Link to="/" className='flex items-center space-x-3'>
                                <FaBrain className="text-white text-3xl" />
                                <span>MentorConnect</span>
                            </Link>
                        </div>

                        <div className='hidden md:flex items-center space-x-8'>
                            <Link 
                                to="/login" 
                                className='text-lg font-medium text-gray-300 hover:text-white transition'
                            >
                                Login
                            </Link>
                            <Link 
                                to="/signup" 
                                className='text-lg font-semibold bg-white text-black rounded-full px-6 py-2 hover:bg-gray-200 transition'
                            >
                                Get Started
                            </Link>
                        </div>

                        <div className='md:hidden'>
                            <button 
                                onClick={() => setMenuOpen(!menuOpen)} 
                                className='text-white p-2'
                            >
                                {menuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {menuOpen && (
                    <div className='md:hidden bg-black py-4'>
                        <div className='px-6 flex flex-col gap-4'>
                            <Link 
                                onClick={() => setMenuOpen(false)}
                                to="/login" 
                                className='text-lg text-gray-300 text-center'
                            >
                                Login
                            </Link>
                            <Link 
                                onClick={() => setMenuOpen(false)}
                                to="/signup" 
                                className='text-lg font-semibold bg-white text-black rounded-full px-4 py-2 text-center hover:bg-gray-200 transition'
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                )}
            </nav>

            {/* ---------------- Hero Section ---------------- */}
            <section className='text-center py-32 px-6 bg-black'>
                <div className='max-w-5xl mx-auto'>
                    <h1 className='text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-8 leading-tight'>
                        Unlock Your Potential with Expert Mentorship
                    </h1>

                    <p className='text-lg text-gray-400 max-w-3xl mx-auto mb-12'>
                        Connect with industry professionals, accelerate your career,
                        and achieve your goals faster with personalized mentorship.
                    </p>

                    <div className='flex justify-center'>
                        <Link 
                            to="/signup" 
                            className='bg-white text-black px-12 py-4 rounded-full font-semibold text-lg hover:bg-gray-200 transition flex items-center gap-2'
                        >
                            Get Started
                            <FaArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ---------------- Features ---------------- */}
            <section className='py-28 px-6 bg-black'>
                <h2 className='text-4xl font-bold text-center text-white mb-20'>
                    What Makes Us Different?
                </h2>

                <div className='grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 max-w-7xl mx-auto'>
                    <FeatureCard icon={FaRobot} title="AI Matching" description="Smart mentor pairing based on your goals." />
                    <FeatureCard icon={FaCalendarAlt} title="Flexible Sessions" description="Schedule sessions that fit your lifestyle." />
                    <FeatureCard icon={FaComments} title="Direct Connect" description="Real-time chat and video collaboration." />
                    <FeatureCard icon={FaChartLine} title="Goal Tracking" description="Track your progress with clear milestones." />
                </div>
            </section>

            {/* ---------------- How It Works ---------------- */}
            <section className='py-28 px-6 bg-black'>
                <h2 className='text-4xl font-bold text-center text-white mb-20'>
                    Your 3-Step Journey
                </h2>

                <div className='grid md:grid-cols-3 gap-12 max-w-6xl mx-auto'>
                    <StepCard number={1} title="Define Your Goal" description="Tell us what you want to achieve." />
                    <StepCard number={2} title="Match & Connect" description="Choose your mentor and start learning." />
                    <StepCard number={3} title="Accelerate Career" description="Grow with expert guidance." />
                </div>

                <div className="text-center mt-24">
                    <Link 
                        to="/signup" 
                        className='bg-white text-black px-12 py-4 rounded-full font-semibold text-lg hover:bg-gray-200 transition inline-flex items-center gap-3'
                    >
                        Join MentorConnect
                        <FaUsers size={18} />
                    </Link>
                </div>
            </section>

            {/* ---------------- Footer ---------------- */}
            <footer className='bg-black text-gray-500 py-12 mt-auto'>
                <div className='max-w-7xl mx-auto px-6 text-center'>
                    <div className='flex items-center justify-center space-x-3 mb-4 text-white'>
                        <FaBrain className="text-white text-3xl" />
                        <span className='text-xl font-bold'>MentorConnect</span>
                    </div>
                    <p className='text-sm'>
                        © {new Date().getFullYear()} MentorConnect. All rights reserved.
                    </p>
                </div>
            </footer>

        </div>
    );
};

export default Home;