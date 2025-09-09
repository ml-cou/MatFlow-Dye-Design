import React from "react";
import feature_img from "./Feature_collage.svg";
import { Link } from "react-router-dom";

const Technologies = [
  "python.png",
  "jupyter.png",
  "scikit.png",
  "seaborn.png",
  "pandas.png",
];

const faqData = [
  {
    question: "What is Matflow?",
    answer:
      "Matflow is a comprehensive no-code machine learning platform designed for data scientists, researchers, and analysts. It provides both visual node-based workflows and function-based operations for complete data processing pipelines, from data ingestion to model deployment.",
  },
  {
    question: "Who can use Matflow?",
    answer:
      "Matflow is designed for data scientists, researchers, chemists, material scientists, students, and anyone working with data analysis. No programming knowledge is required - our intuitive interface makes machine learning accessible to everyone.",
  },
  {
    question: "What types of data can I analyze?",
    answer:
      "Matflow supports various data formats including CSV, Excel files, and specialized chemistry datasets with SMILES notation. You can perform exploratory data analysis, feature engineering, machine learning, and chemical property analysis.",
  },
];

function HomePage() {
  return (
    <div className="mt-16">
      {/* Navbar */}
      {/* <Navbar /> */}

      {/* First Section */}
      <div className="flex flex-col md:flex-row lg:max-w-[1400px] mx-auto gap-12 pt-4 md:pt-14 px-8">
        <div className="flex order-2 md:order-1 flex-col md:w-1/2 justify-center">
          <h1 className="font-bold text-3xl lg:text-4xl mb-10 font-titillium">
            Advanced Data Science Platform with{" "}
            <span className="text-primary-btn underline">
              No-Code Machine Learning
            </span>
          </h1>
          <p className="text-md lg:text-lg mb-6">
            Empower your data science journey with Matflow - a comprehensive platform that combines 
            visual workflow design, automated machine learning, and specialized chemistry analysis. 
            Build complete data processing pipelines from ingestion to deployment without writing a single line of code.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Link 
              to="/dashboard" 
              className="bg-primary-btn text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 text-center"
            >
              Function Based
            </Link>
            <Link 
              to="/editor" 
              className="border border-primary-btn text-primary-btn px-6 py-3 rounded-lg font-medium hover:bg-primary-btn hover:text-white transition-all duration-300 text-center"
            >
              Node Based
            </Link>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>No Code Required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Visual Workflows</span>
            </div>
          </div>
        </div>
        <div className="order-1 md:order-2 md:w-1/2">
          <img
            src="iso-ai.jpg"
            alt=""
            className="w-full max-h-[700px] h-full object-contain object-center"
          />
        </div>
      </div>

      {/* Second Section - Core Features */}
      <div className="mt-16 lg:max-w-[1400px] mx-auto text-center px-8">
        <div>
          <h1 className="text-3xl font-bold mb-4 font-titillium">
            Complete End-to-End Data Science Platform
          </h1>
          <p className="text-xl mb-12">
            From data exploration to model deployment - everything you need in one integrated platform.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <div className="border border-gray-300 shadow-lg hover:shadow-xl transition-shadow duration-300 py-6 px-6 flex flex-col items-center rounded-lg gap-4 bg-white">
            <div className="bg-blue-50 p-4 rounded-full">
              <img
                src="field-of-view.png"
                alt="Data Processing"
                className="w-16 h-16"
              />
            </div>
            <h3 className="text-text text-xl font-titillium font-[600]">
              Data Processing & EDA
            </h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Upload CSV/Excel files, perform comprehensive exploratory data analysis with interactive visualizations, 
              statistical summaries, and data quality assessments.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Charts</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Statistics</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Cleaning</span>
            </div>
          </div>
          
          <div className="border border-gray-300 shadow-lg hover:shadow-xl transition-shadow duration-300 py-6 px-6 flex flex-col items-center rounded-lg gap-4 bg-white">
            <div className="bg-green-50 p-4 rounded-full">
              <img
                src="translator.png"
                alt="Feature Engineering"
                className="w-16 h-16"
              />
            </div>
            <h3 className="text-text text-xl font-titillium font-[600]">
              Feature Engineering
            </h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Transform your data with advanced feature engineering techniques. Create new features, 
              handle missing values, encode categorical variables, and scale numerical data.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Encoding</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Scaling</span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Creation</span>
            </div>
          </div>
          
          <div className="border border-gray-300 shadow-lg hover:shadow-xl transition-shadow duration-300 py-6 px-6 flex flex-col items-center rounded-lg gap-4 bg-white">
            <div className="bg-purple-50 p-4 rounded-full">
              <img src="analysis.png" alt="Machine Learning" className="w-16 h-16" />
            </div>
            <h3 className="font-titillium font-[600] text-text text-xl">
              Machine Learning Models
            </h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Build and train classification, regression, and clustering models using scikit-learn algorithms. 
              Automated hyperparameter tuning and cross-validation included.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Classification</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Regression</span>
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">Clustering</span>
            </div>
          </div>
          
          <div className="border border-gray-300 shadow-lg hover:shadow-xl transition-shadow duration-300 py-6 px-6 flex flex-col items-center rounded-lg gap-4 bg-white">
            <div className="bg-orange-50 p-4 rounded-full">
              <img
                src="presentation.png"
                alt="Model Evaluation"
                className="w-16 h-16"
              />
            </div>
            <h3 className="font-titillium font-[600] text-text text-xl">
              Model Evaluation & Deployment
            </h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Comprehensive model evaluation with metrics, confusion matrices, ROC curves. 
              Deploy models for real-time or batch predictions with easy-to-use interfaces.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Metrics</span>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Deploy</span>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Predict</span>
            </div>
          </div>
          
          <div className="border border-gray-300 shadow-lg hover:shadow-xl transition-shadow duration-300 py-6 px-6 flex flex-col items-center rounded-lg gap-4 bg-white">
            <div className="bg-red-50 p-4 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-16 h-16 text-red-600"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <h3 className="font-titillium font-[600] text-text text-xl">
              Visual Workflow Designer
            </h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Create reproducible data processing pipelines using our intuitive node-based interface. 
              Drag, drop, and connect components to build complex workflows visually.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Nodes</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Pipelines</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Visual</span>
            </div>
          </div>
          
          <div className="border border-gray-300 shadow-lg hover:shadow-xl transition-shadow duration-300 py-6 px-6 flex flex-col items-center rounded-lg gap-4 bg-white">
            <div className="bg-yellow-50 p-4 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-16 h-16 text-yellow-600"
              >
                <path d="M19.5 12c0-.23-.01-.45-.03-.68l1.86-1.41c.4-.3.51-.86.26-1.3l-1.87-3.23c-.25-.44-.79-.62-1.25-.42l-2.15.91c-.37-.26-.76-.49-1.17-.68l-.29-2.31C14.8 2.38 14.37 2 13.87 2h-3.73c-.5 0-.93.38-.97.88l-.29 2.31c-.41.19-.8.42-1.17.68l-2.15-.91c-.46-.2-1-.02-1.25.42L2.44 8.61c-.25.44-.14 1 .26 1.3l1.86 1.41C4.54 11.55 4.53 11.77 4.53 12s.01.45.03.68l-1.86 1.41c-.4.3-.51.86-.26 1.3l1.87 3.23c.25.44.79.62 1.25.42l2.15-.91c.37.26.76.49 1.17.68l.29 2.31c.04.5.47.88.97.88h3.73c.5 0 .93-.38.97-.88l.29-2.31c.41-.19.8-.42 1.17-.68l2.15.91c.46.2 1 .02 1.25-.42l1.87-3.23c.25-.44.14-1-.26-1.3l-1.86-1.41zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
              </svg>
            </div>
            <h3 className="font-titillium font-[600] text-text text-xl">
              Chemistry & Materials Analysis
            </h3>
            <p className="text-gray-600 font-light leading-relaxed">
              Specialized tools for chemistry research including SMILES to molecular structure conversion, 
              IUPAC naming, and chemical property calculations using RDKit integration.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">SMILES</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">RDKit</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Chemistry</span>
            </div>
          </div>
        </div>
      </div>

      {/* Third Section - Platform Details */}
      <div className="mt-20 bg-secondary-btn">
        <div className="max-w-[1400px] mx-auto px-8 pt-16 pb-8">
          <h1 className="font-titillium font-[700] text-3xl mb-6">
            A MACHINE LEARNING BASED DATA ANALYSIS AND EXPLORATION SYSTEM FOR
            MATERIAL DESIGN
          </h1>
          <p className="font-light mb-8">
            MatFlow is a web-based dataflow framework for visual data
            exploration. A machine learning-based data analysis and exploration
            system for material design is a computer system that uses machine
            learning algorithms to analyze and explore large amounts of material
            design data. This system can be used to identify patterns and
            relationships in the data, generate insights and predictions, and
            support decision-making in the field of material design. The system
            can be trained on existing data to improve its accuracy and can also
            be updated with new data as it becomes available to continue
            learning and improving its performance.
          </p>
          <img src={feature_img} alt="" className="w-full h-full" />
        </div>
      </div>

      {/* Fourth Section - ML Lifecycle */}
      <div className="max-w-[1400px] mx-auto my-16 px-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-12">
            <h1 className="font-titillium font-bold text-4xl mb-8">
              Complete ML Lifecycle with MATFLOW
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-4xl">
              From data ingestion to model deployment, Matflow guides you through every step of the machine learning lifecycle 
              with intuitive tools and automated processes.
            </p>
          </div>
          <div className="flex justify-center w-full">
            <img src="lifecycle.png" alt="ML Lifecycle" className="w-full max-w-4xl h-auto" />
          </div>
        </div>
      </div>

      {/* Fifth Section - Technologies */}
      <div className="mt-16 lg:max-w-[1400px] mx-auto text-center px-8">
        <h1 className="font-bold text-4xl mb-6 font-titillium">
          Powered by Industry-Leading Technologies
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Built with robust, scalable technologies to ensure reliability and performance
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-center mb-12">
          {Technologies.map((image, ind) => (
            <div key={ind} className="flex flex-col items-center group">
              <div className="w-20 h-20 flex items-center justify-center bg-white rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-300">
                <img
                  src={image}
                  alt={`Technology ${ind + 1}`}
                  className="w-16 h-16 object-contain"
                />
              </div>
              <span className="text-sm text-gray-600 mt-2 font-medium">
                {image.split('.')[0].charAt(0).toUpperCase() + image.split('.')[0].slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>





      {/* FAQ Section */}
      <section className="bg-white text-gray-900 mt-16 py-16">
        <div className="max-w-[1400px] mx-auto px-8">
          <h3 className="font-bold text-4xl mb-12 text-center">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* FAQ Image */}
            <div className="flex justify-center">
              <img src="faq.svg" alt="FAQ" className="max-w-lg h-auto" />
            </div>
            {/* FAQ Content */}
            <div>
              {faqData.map((faq, index) => (
                <details
                  key={index}
                  className="border border-gray-300 rounded-lg p-4 mb-4"
                >
                  <summary className="font-medium text-xl cursor-pointer">
                    {faq.question}
                  </summary>
                  <p className="mt-2 text-lg text-gray-700">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="bg-gray-100 mt-16 text-gray-900 py-16">
        <div className="max-w-[1400px] mx-auto px-8">
          <h3 className="font-bold text-4xl mb-6 text-center">Contact Us</h3>
          <div className="flex flex-col gap-4 w-full md:w-1/2 lg:w-1/3 mx-auto">
            <form className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Your Name"
                className="p-3 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
              />
              <input
                type="email"
                placeholder="Your Email"
                className="p-3 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
              />
              <textarea
                placeholder="Your Message"
                rows="4"
                className="p-3 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
              ></textarea>
              <button
                type="submit"
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-[1400px] mx-auto flex flex-wrap gap-8 justify-between px-8">
          <div className="flex flex-col gap-2 w-full md:w-1/3">
            <h1 className="font-bold text-3xl mb-2">MATFLOW</h1>
            <h3 className="font-medium text-xl mb-4">Advanced Data Science Platform</h3>
            <p className="max-w-md text-sm font-light leading-relaxed">
              Matflow is a comprehensive no-code machine learning platform that democratizes data science. 
              Build complete ML pipelines, analyze complex datasets, and deploy production-ready models - 
              all without writing a single line of code.
            </p>
            <div className="flex gap-4 mt-6">
              <img
                src="https://github.com/gauravghongde/social-icons/blob/master/PNG/Color/Facebook.png?raw=true"
                alt="Facebook"
                className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity"
              />
              <img
                src="https://github.com/gauravghongde/social-icons/blob/master/PNG/Color/Twitter.png?raw=true"
                alt="Twitter"
                className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity"
              />
              <img
                src="https://github.com/gauravghongde/social-icons/blob/master/PNG/Color/LinkedIN.png?raw=true"
                alt="LinkedIn"
                className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity"
              />
              <img
                src="https://github.com/gauravghongde/social-icons/blob/master/PNG/Color/Youtube.png?raw=true"
                alt="YouTube"
                className="w-8 h-8 cursor-pointer hover:opacity-80 transition-opacity"
              />
            </div>
          </div>
          <div className="flex flex-col w-1/2 md:w-auto">
            <h3 className="font-medium mb-2">PRODUCT</h3>
            <Link to="#" className="text-white font-light hover:underline">
              AI Platform
            </Link>
            <Link to="#" className="text-white font-light hover:underline">
              Use Case Library
            </Link>
            <Link to="#" className="text-white font-light hover:underline">
              Customer Stories
            </Link>
          </div>
          <div className="flex flex-col w-1/2 md:w-auto">
            <h3 className="font-medium mb-2">SUPPORT</h3>
            <Link to="#" className="text-white font-light hover:underline">
              Documentation
            </Link>
            <Link to="#" className="text-white font-light hover:underline">
              Community
            </Link>
            <Link to="#" className="text-white font-light hover:underline">
              Support Hub
            </Link>
            <Link to="#" className="text-white font-light hover:underline">
              Contact Us
            </Link>
            <Link to="#" className="text-white font-light hover:underline">
              Login
            </Link>
          </div>
          <div className="flex flex-col w-full md:w-auto">
            <h3 className="font-medium mb-2">RESOURCES</h3>
            <Link to="#" className="text-white font-light hover:underline">
              Resources Library
            </Link>
            <Link to="#" className="text-white font-light hover:underline">
              Blog
            </Link>
            <Link to="#" className="text-white font-light hover:underline">
              Events
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
