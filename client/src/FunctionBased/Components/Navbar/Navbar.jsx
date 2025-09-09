import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaGithub } from "react-icons/fa"; // Import GitHub icon

function Navbar() {
  const [showModal, setShowModal] = useState(false);

  const handleGetStartedClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <nav className="flex justify-between items-center p-6 bg-white shadow-md fixed top-0 w-full">
        <div className="text-2xl font-bold">
          <Link to="/">MATFLOW</Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="cursor-pointer bg-primary-btn px-4 py-2 rounded-md hover:bg-primary-btn-hover duration-150 font-medium"
            onClick={handleGetStartedClick}
          >
            Get Started
          </button>
          <Link
            to="/login"
            className="cursor-pointer bg-secondary-btn px-4 py-2 rounded-md hover:bg-secondary-btn-hover duration-150 font-medium"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="cursor-pointer bg-secondary-btn px-4 py-2 rounded-md hover:bg-secondary-btn-hover duration-150 font-medium"
          >
            Register
          </Link>
          <a href="https://github.com/ml-cou/MatFlow-IML.git" title="github" target="_blank">
            <FaGithub className="text-xl" />
          </a>
        </div>
      </nav>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md">
            <h2 className="text-xl font-semibold mb-4">Choose a Mode</h2>
            <div className="flex gap-4">
              <Link
                to="/dashboard"
                className="bg-primary-btn px-4 py-2 rounded-md font-medium text-gray-50"
              >
                Function-based
              </Link>
              <Link
                to="/editor"
                className="bg-primary-btn px-4 py-2 rounded-md font-medium text-gray-50"
              >
                Node-based
              </Link>
            </div>
            <button
              className="mt-4 bg-danger-btn px-2 py-1 rounded-md font-medium text-gray-50"
              onClick={handleCloseModal}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
