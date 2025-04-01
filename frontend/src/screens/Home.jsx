import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");
  const [project, setProject] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log(
      "Current token in localStorage:",
      token ? "Present" : "Missing"
    );

    if (!token) {
      console.warn("No authentication token found. User might need to log in.");
    }

    axios
      .get("/projects/all")
      .then((response) => {
        console.log("All projects:", response.data);

        setProject(response.data.projects);
      })
      .catch((err) => {
        console.error("Error fetching projects:", err);
      });
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to create a project");
      console.error("No token found in localStorage");
      setTimeout(() => navigate("/users/login"), 2000);
      return;
    }

    try {
      console.log("Sending create project request with name:", projectName);

      const response = await axios.post("/projects/create", {
        name: projectName,
      });

      console.log("Project created successfully:", response.data);
      setIsModalOpen(false);
      setProjectName("");
    } catch (err) {
      console.error("Error creating project:", err);

      if (err.response) {
        console.error(
          "Server response:",
          err.response.status,
          err.response.data
        );
        if (err.response.status === 401) {
          setError("Authentication failed. Please log in again.");
          setTimeout(() => navigate("/users/login"), 2000);
        } else {
          setError(err.response.data?.message || "Failed to create project");
        }
      } else if (err.request) {
        console.error("No response received:", err.request);
        setError("No response from server. Please try again later.");
      } else {
        console.error("Request setup error:", err.message);
        setError("Error sending request. Please try again.");
      }
    }
  };

  return (
    <main className="p-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded">
          {error}
        </div>
      )}

      <div className="projects flex flex-wrap gap-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="project p-4 border border-slate-900 rounded-lg flex items-center justify-between hover:bg-slate-900 hover:text-white"
        >
          <i className="ri-link m-2"> Create New Project</i>
        </button>

        {project.map((project) => (
          <div
            onClick={() => navigate("project", { state: { project } })}
            key={project._id}
            className="project  cursor-pointer p-4 border border-slate-900 rounded-lg flex flex-col gap-2 items-center justify-between hover:bg-slate-900 hover:text-white min-w-52"
          >
            <h2 className="text-lg font-semibold">{project.name}</h2>

            <div className="flex items-center gap-4">
              <p>
                <small>
                  <i className="ri-user-line"></i> Collaborators:
                </small>
              </p>
              {project.users.length}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
            <form onSubmit={createProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  onChange={(e) => setProjectName(e.target.value)}
                  value={projectName}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
