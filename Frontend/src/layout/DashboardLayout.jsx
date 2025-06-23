import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../component/sidebar';
import Navbar from '../component/Navbar';

const DashboardLayout = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex bg-[#F3F3E0] w-full h-screen overflow-hidden">
      <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
      <div className="flex flex-col w-full h-full">
        <Navbar isOpen={isOpen} setIsOpen={setIsOpen} />
        <main className="p-6 w-full flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;