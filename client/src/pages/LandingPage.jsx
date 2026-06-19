import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/index.js';

// ── Animated counter hook ──────────────────────────────────────────────────
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

// ── Intersection observer hook ─────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ value, suffix = '', label, icon, inView }) {
  const count = useCounter(value, 2000, inView);
  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-300">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-4xl font-bold text-white mb-1">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-medical-200 text-sm font-medium text-center">{label}</div>
    </div>
  );
}

// ── Service card ───────────────────────────────────────────────────────────
function ServiceCard({ icon, title, desc, delay }) {
  const [ref, inView] = useInView(0.1);
  return (
    <div
      ref={ref}
      className="group p-7 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-400 cursor-default"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, box-shadow 0.3s ease, translate 0.3s ease`
      }}
    >
      <div className="w-14 h-14 rounded-xl bg-medical-50 flex items-center justify-center text-2xl mb-5 group-hover:bg-medical-600 group-hover:scale-110 transition-all duration-300">
        <span className="group-hover:grayscale-0">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

// ── Doctor card ────────────────────────────────────────────────────────────
function DoctorCard({ name, specialty, rating, experience, avatar, delay }) {
  const [ref, inView] = useInView(0.1);
  return (
    <div
      ref={ref}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-400 border border-gray-100"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms, box-shadow 0.3s ease`
      }}
    >
      <div className="relative overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-medical-100 to-medical-200 flex items-center justify-center">
          <span className="text-7xl">{avatar}</span>
        </div>
        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          Available
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg">{name}</h3>
        <p className="text-medical-600 text-sm font-medium mb-3">{specialty}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <span className="text-yellow-400">★</span>
            <span className="font-semibold text-gray-700">{rating}</span>
          </span>
          <span>{experience} yrs exp.</span>
        </div>
      </div>
    </div>
  );
}

// ── Testimonial card ───────────────────────────────────────────────────────
function TestimonialCard({ name, role, quote, avatar, delay }) {
  const [ref, inView] = useInView(0.1);
  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col gap-4"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`
      }}
    >
      <div className="flex text-yellow-400 text-lg">★★★★★</div>
      <p className="text-gray-600 italic leading-relaxed text-sm">"{quote}"</p>
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <div className="w-10 h-10 rounded-full bg-medical-100 flex items-center justify-center text-xl">
          {avatar}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{name}</p>
          <p className="text-gray-500 text-xs">{role}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Landing Page ──────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statsRef, statsInView] = useInView(0.3);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      const role = user?.role;
      if (role === 'patient') navigate('/patient');
      else if (role === 'doctor') navigate('/doctor');
      else if (role === 'admin') navigate('/admin');
    } else {
      navigate('/register');
    }
  };

  const services = [
    { icon: '🫀', title: 'Cardiology', desc: 'Expert cardiac care with advanced diagnostics and treatment for heart conditions.' },
    { icon: '🧠', title: 'Neurology', desc: 'Comprehensive neurological services for brain, spine, and nervous system disorders.' },
    { icon: '🦴', title: 'Orthopedics', desc: 'Specialized musculoskeletal care, joint replacement, and sports medicine.' },
    { icon: '👁️', title: 'Ophthalmology', desc: 'Complete eye care from routine exams to complex surgical procedures.' },
    { icon: '🫁', title: 'Pulmonology', desc: 'Respiratory care for asthma, COPD, and other lung conditions.' },
    { icon: '🧬', title: 'Oncology', desc: 'Cutting-edge cancer diagnosis and personalized treatment plans.' },
    { icon: '👶', title: 'Pediatrics', desc: 'Compassionate care for newborns through adolescents by specialist pediatricians.' },
    { icon: '🦷', title: 'Dental Care', desc: 'From routine cleanings to oral surgery with modern dental technology.' },
  ];

  const doctors = [
    { name: 'Dr. John Smith', specialty: 'Cardiologist', rating: '4.9', experience: 15, avatar: '👨‍⚕️' },
    { name: 'Dr. Sarah Johnson', specialty: 'Neurologist', rating: '4.8', experience: 12, avatar: '👩‍⚕️' },
    { name: 'Dr. Michael Brown', specialty: 'Orthopedic Surgeon', rating: '4.9', experience: 18, avatar: '🧑‍⚕️' },
    { name: 'Dr. Emily Davis', specialty: 'Pediatrician', rating: '4.7', experience: 10, avatar: '👩‍⚕️' },
  ];

  const testimonials = [
    {
      name: 'Alice Thompson',
      role: 'Patient — Cardiology',
      avatar: '👩',
      quote: 'The care I received at MediCore was exceptional. Dr. Smith\'s expertise and the seamless online booking made the entire experience stress-free.'
    },
    {
      name: 'James Anderson',
      role: 'Patient — Orthopedics',
      avatar: '👨',
      quote: 'From booking my appointment online to the post-surgery follow-up, everything was perfectly coordinated. Truly world-class healthcare.'
    },
    {
      name: 'Maria Garcia',
      role: 'Patient — Pediatrics',
      avatar: '👩',
      quote: 'As a parent, finding a trusted pediatrician was crucial. MediCore made it simple, and Dr. Davis has been amazing with our kids.'
    },
  ];

  return (
    <div className="min-h-screen font-sans bg-gray-50 text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Google Font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-medical-600 flex items-center justify-center text-white font-bold text-lg shadow">
                ＋
              </div>
              <span className={`font-bold text-xl tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                Medi<span className="text-medical-400">Core</span>
              </span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              {['Services', 'Doctors', 'About', 'Contact'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className={`text-sm font-medium transition-colors hover:text-medical-400 ${scrolled ? 'text-gray-600' : 'text-white/80'}`}
                >
                  {item}
                </a>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${scrolled ? 'text-gray-700 hover:text-medical-600' : 'text-white/90 hover:text-white'}`}
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="px-5 py-2 bg-medical-600 hover:bg-medical-700 text-white text-sm font-semibold rounded-lg shadow transition-all hover:shadow-medical-600/30 hover:shadow-lg"
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              className={`md:hidden p-2 rounded-lg ${scrolled ? 'text-gray-700' : 'text-white'}`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div className="w-5 h-0.5 bg-current mb-1 transition-all"></div>
              <div className="w-5 h-0.5 bg-current mb-1"></div>
              <div className="w-5 h-0.5 bg-current"></div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-3">
            {['Services', 'Doctors', 'About', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-gray-700 font-medium py-1" onClick={() => setMenuOpen(false)}>
                {item}
              </a>
            ))}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => navigate('/login')} className="flex-1 py-2 text-gray-700 font-semibold border border-gray-200 rounded-lg">Sign In</button>
              <button onClick={handleGetStarted} className="flex-1 py-2 bg-medical-600 text-white font-semibold rounded-lg">Get Started</button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-medical-900 via-medical-700 to-medical-500" />

        {/* Decorative blobs */}
        <div className="absolute top-20 right-10 w-96 h-96 rounded-full bg-medical-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-32 flex flex-col lg:flex-row items-center gap-12">
          {/* Left content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-white/90 text-sm font-medium">Accepting new patients · Open 24/7</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 tracking-tight">
              Your Health,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-200 to-white">
                Our Priority
              </span>
            </h1>

            <p className="text-medical-100 text-lg md:text-xl leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
              Experience world-class healthcare with cutting-edge technology. Book appointments, track your health journey, and connect with top specialists — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button
                onClick={handleGetStarted}
                className="group px-8 py-4 bg-white text-medical-700 font-bold rounded-xl shadow-xl hover:shadow-white/25 hover:bg-medical-50 transition-all duration-300 text-lg flex items-center justify-center gap-2"
              >
                Book an Appointment
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 border-2 border-white/40 text-white font-bold rounded-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 text-lg"
              >
                Sign In
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-6 mt-12 justify-center lg:justify-start">
              {[
                { icon: '🔒', label: 'HIPAA Compliant' },
                { icon: '⭐', label: '4.9 / 5 Rating' },
                { icon: '🏆', label: 'JCI Accredited' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-white/70 text-sm">
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating cards */}
          <div className="flex-1 relative hidden lg:flex justify-center items-center">
            <div className="relative w-80 h-80">
              {/* Central circle */}
              <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <span className="text-8xl">🏥</span>
              </div>

              {/* Floating info cards */}
              {[
                { text: '500+ Doctors', sub: 'Specialists', top: '-16', left: '10', icon: '👨‍⚕️' },
                { text: '50k+ Patients', sub: 'Served', top: '10', right: '-14', icon: '❤️' },
                { text: '24/7 Support', sub: 'Always here', bottom: '-10', left: '20', icon: '🕐' },
              ].map(({ text, sub, top, left, right, bottom, icon }) => (
                <div
                  key={text}
                  className="absolute bg-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-bounce"
                  style={{
                    ...(top && { top: `${top}px` }),
                    ...(left && { left: `${left}px` }),
                    ...(right && { right: `${right}px` }),
                    ...(bottom && { bottom: `${bottom}px` }),
                    animationDuration: `${3 + Math.random() * 2}s`,
                  }}
                >
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{text}</p>
                    <p className="text-gray-500 text-xs">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 30C1200 70 960 10 720 30C480 50 240 0 0 30L0 80Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────────────────── */}
      <section ref={statsRef} className="bg-gradient-to-br from-medical-700 to-medical-900 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard value={500} suffix="+" label="Specialist Doctors" icon="👨‍⚕️" inView={statsInView} />
            <StatCard value={50000} suffix="+" label="Patients Treated" icon="❤️" inView={statsInView} />
            <StatCard value={25} suffix="+" label="Years of Excellence" icon="🏆" inView={statsInView} />
            <StatCard value={98} suffix="%" label="Patient Satisfaction" icon="⭐" inView={statsInView} />
          </div>
        </div>
      </section>

      {/* ── SERVICES ────────────────────────────────────────────────────── */}
      <section id="services" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-medical-100 text-medical-700 text-sm font-semibold mb-4">
              Our Specialties
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              World-Class Medical Services
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Comprehensive healthcare across all major specialties, delivered by board-certified physicians using the latest medical technology.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((s, i) => (
              <ServiceCard key={s.title} {...s} delay={i * 80} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-medical-100 text-medical-700 text-sm font-semibold mb-4">
              Simple Process
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Get the care you need in just a few simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-medical-200 via-medical-400 to-medical-200" />

            {[
              { step: '01', icon: '📝', title: 'Create Account', desc: 'Register as a patient in seconds. No paperwork, no waiting rooms.' },
              { step: '02', icon: '🗓️', title: 'Book Appointment', desc: 'Choose your specialist, pick a time slot that suits your schedule.' },
              { step: '03', icon: '✅', title: 'Get Treated', desc: 'Attend your appointment and receive expert medical care.' },
            ].map(({ step, icon, title, desc }, i) => {
              const [ref, inView] = useInView(0.2);
              return (
                <div
                  key={step}
                  ref={ref}
                  className="flex flex-col items-center text-center"
                  style={{
                    opacity: inView ? 1 : 0,
                    transform: inView ? 'translateY(0)' : 'translateY(30px)',
                    transition: `opacity 0.6s ease ${i * 150}ms, transform 0.6s ease ${i * 150}ms`
                  }}
                >
                  <div className="relative mb-6">
                    <div className="w-16 h-16 rounded-full bg-medical-600 flex items-center justify-center text-3xl shadow-lg shadow-medical-600/30 relative z-10">
                      {icon}
                    </div>
                    <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-medical-100 text-medical-700 text-xs font-black flex items-center justify-center border-2 border-white shadow">
                      {step}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm max-w-xs">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── DOCTORS ─────────────────────────────────────────────────────── */}
      <section id="doctors" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-16 gap-4">
            <div>
              <span className="inline-block px-4 py-1.5 rounded-full bg-medical-100 text-medical-700 text-sm font-semibold mb-4">
                Our Team
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900">Meet Our Specialists</h2>
            </div>
            <button
              onClick={handleGetStarted}
              className="self-start md:self-auto px-6 py-3 border-2 border-medical-600 text-medical-600 font-semibold rounded-xl hover:bg-medical-600 hover:text-white transition-all duration-300"
            >
              View All Doctors →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {doctors.map((d, i) => (
              <DoctorCard key={d.name} {...d} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-medical-100 text-medical-700 text-sm font-semibold mb-4">
              Patient Stories
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">What Our Patients Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.name} {...t} delay={i * 120} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 bg-gradient-to-br from-medical-900 via-medical-700 to-medical-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/5 blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 text-white text-sm font-semibold mb-6 border border-white/20">
            🏥 Start Your Health Journey
          </span>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Ready to Take Control<br />of Your Health?
          </h2>
          <p className="text-medical-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of patients who trust MediCore for their healthcare needs. Book your first appointment today — it only takes 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleGetStarted}
              className="group px-10 py-4 bg-white text-medical-700 font-bold rounded-xl shadow-xl hover:bg-medical-50 transition-all duration-300 text-lg flex items-center justify-center gap-2"
            >
              Get Started Free
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-10 py-4 border-2 border-white/40 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300 text-lg"
            >
              Sign In
            </button>
          </div>

          <p className="text-white/50 text-sm mt-8">
            No credit card required · Free to use · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-medical-600 flex items-center justify-center text-white font-bold">＋</div>
                <span className="font-bold text-xl text-white">Medi<span className="text-medical-400">Core</span></span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                Delivering exceptional healthcare with compassion and innovation. Your health, our commitment.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                {['Home', 'Services', 'Doctors', 'About Us', 'Contact'].map(link => (
                  <li key={link}><a href="#" className="hover:text-medical-400 transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><span>📞</span> +1 (800) MEDICORE</li>
                <li className="flex items-center gap-2"><span>✉️</span> care@medicore.com</li>
                <li className="flex items-center gap-2"><span>📍</span> 123 Health Ave, NY 10001</li>
                <li className="flex items-center gap-2"><span>🕐</span> Open 24 hours a day</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© {new Date().getFullYear()} MediCore Hospital. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">HIPAA Notice</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
