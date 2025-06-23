import { Search } from 'lucide-react';
import PropTypes from 'prop-types';


const SearchInput = ({onSearch}) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
	  	onChange={(e) => onSearch(e.target.value)}
        type="text"
        placeholder="Search"
        className="w-full py-3 pl-12 pr-4 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200 text-gray-700"
      />
    </div>
  );
};

SearchInput.propTypes = {
	onSearch: PropTypes.func.isRequired
  };
export default SearchInput;