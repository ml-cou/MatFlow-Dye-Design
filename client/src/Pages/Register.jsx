import { React, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Chatbot from "../Components/Chatbot/Chatbot";
function Register() {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const handleInputChange = (event) => {
    setUser((prevState) => {
      return { ...prevState, [event.target.name]: event.target.value };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(user.password, user.confirm_password);
    if (user.password != user.confirm_password)
      toast.error("password doesn't match");
    else {
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/signup/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        }
      );
      const response = await res.json();
      toast.success(response.data.message);
      setUser({ name: "", email: "", password: "", confirm_password: "" });
      navigate("/login");
    }
  };
  return (
    <div className="flex justify-center mt-36">
      <div className="border w-1/2 p-6 rounded shadow-md">
        <h3 className="text-2xl font-medium mb-2">Register</h3>
        <form
          onSubmit={handleSubmit}
          action=""
          className="flex flex-col items-start"
        >
          <label htmlFor="email" className="text-md font-medium text-gray-700">
            User name
          </label>
          <input
            type="username"
            id="username"
            name="username"
            onChange={handleInputChange}
            className="my-2 p-2 rounded outline-none border-2 shadow hover:border-primary-btn hover:border-2 w-full"
            placeholder="Enter your Username"
          />
          <label htmlFor="email" className="text-md font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            onChange={handleInputChange}
            className="my-2 p-2 rounded outline-none border-2 shadow hover:border-primary-btn hover:border-2 w-full"
            placeholder="Enter your email"
          />
          <label
            htmlFor="password"
            className="text-md font-medium text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            onChange={handleInputChange}
            className="my-2 p-2 rounded outline-none border-2 hover:border-primary-btn shadow w-full"
            placeholder="Enter your password"
          />
          <label
            htmlFor="confirm_password"
            className="text-md font-medium text-gray-700"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            onChange={handleInputChange}
            className="my-2 p-2 rounded outline-none border-2 hover:border-primary-btn shadow w-full"
            placeholder="Re-enter password"
          />
          <button
            type="submit"
            className="border-2 mt-4 text-md px-6 py-2 border-primary-btn rounded-md hover:bg-primary-btn hover:text-white"
          >
            Register
          </button>
        </form>
      </div>
      <Chatbot />
    </div>
  );
}

export default Register;
