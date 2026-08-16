import React from 'react';
import Navbar from '../components/Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <footer className="footer">
        <p>© 2026 AI-Based Campus Lost & Found System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout;
