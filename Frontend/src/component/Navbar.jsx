import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { Divide as Hamburger } from 'hamburger-react';
import Player_ from '../assets/src/player_.svg';
import { Search } from 'lucide-react';
import Notification from './profile/Notification';
import SearchNavbar  from '../component/profile/searchNavbar';

const Navbar = ({ isOpen, setIsOpen }) => {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <nav className="h-[56px] bg-[#5376aa] p-4 flex items-center justify-between sticky top-0 z-40 shadow-2xl">
      <div className="flex items-center gap-4">
        <div className="md:hidden">
          <Hamburger toggled={isOpen} toggle={setIsOpen} color="#133E87" />
        </div>
      </div>
      
      <div className="flex-1 max-w-xl mx-8 text-black">
		<SearchNavbar />
      </div>

      <div className="flex items-center gap-4">
        <Notification />
        <NavLink
          to="/profile"
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#608BC1]/10"
        >
          <span className="text-[#133E87] hidden md:block">{user?.first_name || 'Loading...'}</span>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#FFE5B4]">
            <img 
              src={user?.avatar || Player_} 
              alt="profile" 
              onError={(e) => {e.target.src = Player_}}
              className="w-full h-full object-cover" 
            />
          </div>
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;