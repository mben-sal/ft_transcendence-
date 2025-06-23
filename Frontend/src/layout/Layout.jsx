
import { Outlet } from 'react-router-dom';
import Sidebar from '../component/sidebar';
import Navbar from '../component/Navbar';

export function Layout() {
  return (
    <div className="flex">
      <Sidebar />
	  <Navbar />
      <main className="flex-1 p-4 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;