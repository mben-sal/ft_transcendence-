import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="">
      <div className="">
        <div className="w-full p-8">
          <Outlet />
        </div>
      </div>
      <div className="hidden lg:flex lg:w-1/2 bg-[#F3F3E0]">
        <img 
          src="/your-auth-image.svg" 
          alt="Auth illustration" 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default AuthLayout;