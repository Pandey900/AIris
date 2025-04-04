import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import {
  initilizeSocket,
  receiveMessage,
  sendMessage,
} from "../config/socket.js";

import { UserContext } from "../context/user.context.jsx";
import Markdown from "markdown-to-jsx";
import { createRoot } from "react-dom/client";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
const Project = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const messageEndRef = useRef(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [project, setProject] = useState(location.state?.project || {});
  const [projectMembers, setProjectMembers] = useState([]);
  const [isProjectMembersLoading, setIsProjectMembersLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [message, setMessage] = useState("");
  const messageBox = useRef(null);
  const { logout } = useContext(UserContext);
  // Add these state variables with your other states
  const [selectedAIMessage, setSelectedAIMessage] = useState(null);
  const [isAIMessagePanelOpen, setIsAIMessagePanelOpen] = useState(false);

  // Use projectId from project object or location state but no hardcoded fallback
  const projectId = project._id || location.state?.project?._id;

  const getAvatar = (gender) => {
    if (gender === "male") {
      return "https://avatar.iran.liara.run/public/boy";
    } else {
      return "https://avatar.iran.liara.run/public/girl";
    }
  };

  // Fetch users from API and initialize socket
  useEffect(() => {
    initilizeSocket(project._id);

    receiveMessage("project-message", (data) => {
      // Check if this message is from the current logged-in user
      const isOwnMessage = data.sender === user._id;

      if (isOwnMessage) {
        // Don't append the message again if it's our own (we already did in send())
        console.log("Skipping own message that we already displayed");
        return;
      } else {
        // This is from another user, append as incoming message
        appendIncomingMessage(data);
        if (messageEndRef.current) {
          messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }
    });

    // New handler for previous messages
    // In your useEffect where you handle previous-messages
    receiveMessage("previous-messages", (messages) => {
      if (!Array.isArray(messages) || !messages.length) return;

      // Clear existing messages
      const messageContainer = messageBox.current;
      if (messageContainer) {
        messageContainer.innerHTML = "";
      }

      // Display previous messages
      messages.forEach((msg) => {
        // Check if this is an AI message
        if (msg.isAI || msg.sender === "ai-assistant") {
          appendIncomingMessage(msg); // Always display AI as incoming
        } else {
          const isOwnMessage = msg.sender === user._id;
          if (isOwnMessage) {
            appendOutgoingMessage(msg);
          } else {
            appendIncomingMessage(msg);
          }
        }
      });

      // Scroll to bottom
      if (messageEndRef.current) {
        messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    });

    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await axios.get("/users/all");
        setUsers(response.data.users);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again.");
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch project details and collaborators
    const fetchProjectDetails = async () => {
      if (!projectId) return;

      setIsProjectMembersLoading(true);
      try {
        const response = await axios.get(`/projects/get-projects/${projectId}`);
        if (response.data && response.data.project) {
          setProject(response.data.project);

          // Now fetch the details of each user in the project
          if (
            response.data.project.users &&
            Array.isArray(response.data.project.users)
          ) {
            // If users are just IDs, fetch their details
            if (typeof response.data.project.users[0] === "string") {
              const userIds = response.data.project.users;
              const usersData = await Promise.all(
                userIds.map(async (userId) => {
                  try {
                    const userResponse = await axios.get(`/users/${userId}`);
                    return userResponse.data.user;
                  } catch (err) {
                    console.error(`Error fetching user ${userId}:`, err);
                    return null;
                  }
                })
              );
              setProjectMembers(usersData.filter((user) => user !== null));
            } else {
              // If users already have full details
              setProjectMembers(response.data.project.users);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching project details:", err);
      } finally {
        setIsProjectMembersLoading(false);
      }
    };

    fetchUsers();
    fetchProjectDetails();
  }, [projectId]);

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleAddCollaborators = () => {
    setIsModalOpen(true);
  };
  // Add this logout function in your Project component
  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem("token");
    // Redirect to login page
    navigate("/login");
  };

  function send() {
    if (!user || !user._id) {
      console.error("User not found. Please log in again.");
      alert("You need to be logged in to send messages.");
      return;
    }

    if (!message.trim()) {
      console.error("Cannot send an empty message.");
      return;
    }

    // Create a complete message object with all needed fields
    const messageData = {
      message: message.trim(),
      sender: user._id,
      senderName: user.name || user.email?.split("@")[0] || "User",
      senderEmail: user.email,
      senderGender: user.gender || "male",
      timestamp: new Date().toISOString(),
    };

    sendMessage("project-message", messageData);

    // Also append the outgoing message to your own chat
    appendOutgoingMessage(messageData);

    setMessage("");
  }

  const handleCloseModal = () => {
    setSelectedUsers([]);
    setIsModalOpen(false);
  };

  const handleSaveSelection = async () => {
    if (selectedUsers.length === 0) return;

    try {
      const response = await axios.put("/projects/add-user", {
        projectId: projectId,
        users: selectedUsers,
      });

      console.log("Users added successfully:", response.data);

      // Refresh project members after adding users
      await fetchProjectMembers();

      // Close modal and clear selection
      setSelectedUsers([]);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error adding collaborators:", err);
      setError("Failed to add users. Please try again.");
    }
  };

  // Function to fetch project members
  const fetchProjectMembers = async () => {
    if (!projectId) return;

    setIsProjectMembersLoading(true);
    try {
      const response = await axios.get(`/projects/get-projects/${projectId}`);
      if (response.data && response.data.project) {
        // Now fetch the details of each user in the project
        if (
          response.data.project.users &&
          Array.isArray(response.data.project.users)
        ) {
          // If users are just IDs, fetch their details
          if (typeof response.data.project.users[0] === "string") {
            const userIds = response.data.project.users;
            const usersData = await Promise.all(
              userIds.map(async (userId) => {
                try {
                  const userResponse = await axios.get(`/users/${userId}`);
                  return userResponse.data.user;
                } catch (err) {
                  console.error(`Error fetching user ${userId}:`, err);
                  return null;
                }
              })
            );
            setProjectMembers(usersData.filter((user) => user !== null));
          } else {
            // If users already have full details
            setProjectMembers(response.data.project.users);
          }
        }
      }
    } catch (err) {
      console.error("Error refreshing project details:", err);
    } finally {
      setIsProjectMembersLoading(false);
    }
  };

  // Function to initiate user removal (show confirmation)
  const initiateRemoveUser = (user) => {
    setUserToRemove(user);
    setShowConfirmation(true);
  };

  // Function to cancel removal
  const cancelRemoveUser = () => {
    setUserToRemove(null);
    setShowConfirmation(false);
  };

  // Function to confirm and execute user removal
  const confirmRemoveUser = async () => {
    if (!userToRemove) return;

    setIsRemoving(true);
    try {
      await axios.put("/projects/remove-user", {
        projectId: projectId,
        users: [userToRemove._id],
      });

      // Update the list of project members by removing the user
      setProjectMembers((prev) =>
        prev.filter((member) => member._id !== userToRemove._id)
      );

      // Close confirmation dialog
      setShowConfirmation(false);
      setUserToRemove(null);
    } catch (error) {
      console.error("Error removing user:", error);
      alert("Failed to remove collaborator. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  };

  // Show error or loading state if no project is selected
  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-semibold text-red-500 mb-4">
            No Project Selected
          </h2>
          <p className="mb-6">Please select a project to continue</p>
          <button
            onClick={() => navigate("/projects")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            View Projects
          </button>
        </div>
      </div>
    );
  }

  // For incoming messages (from others)
  // Function to append an incoming message
  function appendIncomingMessage(data) {
    const messageContainer = messageBox.current;
    if (!messageContainer) return;

    // Determine if this is an AI message
    const isAIMessage = data.isAI || data.sender === "ai-assistant";

    const message = document.createElement("div");
    message.classList.add(
      "message",
      "flex",
      "items-start",
      "gap-2",
      "max-w-[80%]",
      "mb-3"
    );

    if (isAIMessage) {
      // Use React to render Markdown for AI messages
      const messageDiv = document.createElement("div");
      messageDiv.className = "ai-message-content";
      message.appendChild(messageDiv);

      // Add timestamp separately
      const timestamp = document.createElement("span");
      timestamp.className = "text-xs text-gray-500 mt-1 inline-block";
      timestamp.textContent = new Date(data.timestamp).toLocaleTimeString();
      message.appendChild(timestamp);

      // Make the message clickable
      message.classList.add("cursor-pointer", "hover:opacity-90");
      message.addEventListener("click", () => {
        // Store the clicked message and open the panel
        setSelectedAIMessage(data);
        setIsAIMessagePanelOpen(true);
      });

      // Use ReactDOM to render Markdown and SyntaxHighlighter into the messageDiv
      const root = createRoot(messageDiv);
      root.render(
        <div>
          <div className="bg-purple-100 border border-purple-300 p-3 rounded-lg rounded-tl-none shadow-md">
            <span className="font-semibold text-purple-800 block mb-1">
              AI Assistant
            </span>
            <div className="text-gray-800 markdown-content">
              // Update this part of your Markdown options in
              appendIncomingMessage
              <Markdown
                options={{
                  overrides: {
                    code: {
                      component: ({ className, children }) => {
                        const language =
                          className?.replace("language-", "") || "text";
                        return (
                          <SyntaxHighlighter
                            language={language}
                            style={oneDark}
                            showLineNumbers
                          >
                            {children}
                          </SyntaxHighlighter>
                        );
                      },
                    },
                    // Add these new overrides to fix the nesting issue
                    pre: {
                      component: ({ children }) => <>{children}</>,
                    },
                    p: {
                      component: ({ children, ...props }) => {
                        // Check if children contains a SyntaxHighlighter component
                        const containsCodeBlock = React.Children.toArray(
                          children
                        ).some(
                          (child) =>
                            React.isValidElement(child) &&
                            (child.type === SyntaxHighlighter ||
                              (child.props &&
                                child.props.children &&
                                React.isValidElement(child.props.children) &&
                                child.props.children.type ===
                                  SyntaxHighlighter))
                        );

                        // If this paragraph contains a code block, render without p tag
                        if (containsCodeBlock) {
                          return <>{children}</>;
                        }

                        // Otherwise render as normal paragraph
                        return <p {...props}>{children}</p>;
                      },
                    },
                  },
                }}
              >
                {data.message}
              </Markdown>
            </div>
          </div>
        </div>
      );
    } else {
      // Regular user message (existing code)
      message.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-blue-200 flex-shrink-0 overflow-hidden">
          <img class="w-full h-full object-cover" src="${getAvatar(
            data.senderGender || "male"
          )}" />
        </div>
        <div>
          <div class="bg-gray-100 p-3 rounded-lg rounded-tl-none">
            <span class="font-semibold text-gray-800 block mb-1">${
              data.senderName || "User"
            }</span>
            <p class="text-gray-800">${data.message}</p>
          </div>
          <span class="text-xs text-gray-500 mt-1 inline-block">
            ${new Date(data.timestamp).toLocaleTimeString()}
          </span>
        </div>
      `;
    }

    messageContainer.appendChild(message);
    messageContainer.scrollTop = messageContainer.scrollHeight;
  }

  // Add function for outgoing messages (your own)
  function appendOutgoingMessage(messageObject) {
    const messageContainer = messageBox.current;
    if (!messageContainer) return;

    try {
      const message = document.createElement("div");
      message.classList.add(
        "message",
        "flex",
        "items-start",
        "justify-end",
        "gap-2",
        "max-w-[80%]",
        "ml-auto",
        "mb-3"
      );

      // Get your information
      const avatar = getAvatar(user.gender || "male");
      const name = user.name || user.email?.split("@")[0] || "You";
      const msg = messageObject.message || "";
      const time = new Date().toLocaleTimeString();

      message.innerHTML = `
      <div>
        <div class="bg-blue-500 p-3 rounded-lg rounded-tr-none">
          <p class="text-sm font-medium text-white">${name}</p>
          <p class="text-white">${msg}</p>
        </div>
        <span class="text-xs text-gray-500 mt-1 inline-block float-right">${time}</span>
      </div>
      <div class="w-8 h-8 rounded-full bg-blue-200 flex-shrink-0 overflow-hidden">
        <img class="w-full h-full object-cover" src="${avatar}" alt="Your avatar"/>
      </div>`;

      messageContainer.appendChild(message);
      messageContainer.scrollTop = messageContainer.scrollHeight;
    } catch (error) {
      console.error("Error appending outgoing message:", error);
    }
  }
  return (
    <main className="h-screen w-full flex flex-col md:flex-row overflow-hidden">
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md transition-colors"
        >
          <i className="ri-logout-box-r-line"></i>
          Logout
        </button>
      </div>
      <section className="left h-full md:h-screen flex flex-col w-full md:w-1/4 md:min-w-72 lg:min-w-80 bg-slate-500 hover:bg-slate-600 transition duration-200 ease-in-out relative">
        <header className="flex justify-between items-center p-2 md:p-4 w-full bg-slate-200 rounded-b-lg hover:bg-slate-300 transition duration-200 ease-in-out">
          <button
            className="flex items-center gap-2 p-2 rounded-lg bg-slate-300 hover:bg-slate-400 transition duration-200 ease-in-out"
            onClick={handleAddCollaborators}
          >
            <i className="ri-user-add-fill"></i>
            <p>Add Collaborators</p>
          </button>
          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="p-2 rounded-full bg-slate-300 hover:bg-slate-400 transition duration-200 ease-in-out"
          >
            <i className="ri-group-fill"></i>
          </button>
        </header>
        <div className="conversation-area flex-grow flex flex-col p-4 bg-white rounded-lg shadow-md overflow-hidden">
          {/* Messages Container */}
          <div
            ref={messageBox}
            className="message-box flex-1 overflow-y-auto mb-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pr-2"
          ></div>

          {/* Input Field */}
          <div className="inputField flex items-center gap-2 border-t pt-4">
            <div className="flex-1 relative">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault(); // Prevents adding a new line
                    send(); // Call the send function
                  }
                }}
                className="w-full p-3 pl-4 pr-10 border rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition-all"
                type="text"
                placeholder="Enter your message..."
              />
            </div>
            <button
              onClick={send}
              className="bg-blue-500 hover:bg-blue-600 transition-colors text-white p-3 rounded-full flex items-center justify-center"
            >
              <i className="ri-send-plane-fill text-lg"></i>
            </button>
          </div>

          {/* AI Tip - Add this right here */}
          <div className="text-xs text-gray-500 mt-1 px-3">
            Tip: Type @ai followed by your question to get AI assistance
          </div>
        </div>

        {/* Side Panel */}
        <div
          className={`sidePanel absolute inset-0 bg-white shadow-lg z-10 transition-transform duration-300 ${
            isSidePanelOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <header className="flex items-center justify-between bg-gray-100 p-4 border-b">
            <h3 className="font-medium text-gray-800">Group Members</h3>
            <button
              onClick={() => setIsSidePanelOpen(false)}
              className="p-2 rounded-full hover:bg-gray-200 transition"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </header>
          <div className="users flex flex-col gap-3 p-4 overflow-y-auto h-[calc(100%-60px)]">
            {isProjectMembersLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : projectMembers.length > 0 ? (
              projectMembers.map((user) => (
                <div
                  key={user._id}
                  className="user p-2 rounded-lg hover:bg-gray-100 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatar(user.gender)}
                      alt={`${user.email}'s avatar`}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <div className="font-medium text-gray-800">
                        {user.name || user.email.split("@")[0]}
                      </div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  {/* Remove button */}
                  <button
                    onClick={() => initiateRemoveUser(user)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove collaborator"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                No collaborators in this project
              </div>
            )}
          </div>
        </div>
      </section>

      {/* User Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium">Select Collaborators</h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>

            {/* Modal Body - User List */}
            <div className="overflow-y-auto p-4 flex-grow">
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="text-center text-red-500 py-4">{error}</div>
              ) : (
                <div className="space-y-2">
                  {users
                    .filter(
                      (user) =>
                        !projectMembers.some(
                          (member) => member._id === user._id
                        )
                    )
                    .map((user) => (
                      <div
                        key={user._id}
                        onClick={() => toggleUserSelection(user._id)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedUsers.includes(user._id)
                            ? "bg-blue-100 border border-blue-300"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={getAvatar(user.gender)}
                            alt={`${user.name || user.email}'s avatar`}
                            className="w-12 h-12 rounded-full"
                          />
                          {selectedUsers.includes(user._id) && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                              <i className="ri-check-line text-white text-sm"></i>
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <p className="font-medium">
                            {user.name || user.email.split("@")[0]}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSelection}
                disabled={selectedUsers.length === 0 || isLoading}
                className={`px-4 py-2 rounded-lg text-white ${
                  selectedUsers.length === 0 || isLoading
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                Add Selected ({selectedUsers.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Remove */}
      {showConfirmation && userToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Remove Collaborator
            </h3>

            <p className="text-gray-700 mb-6">
              Are you sure you want to remove{" "}
              <span className="font-medium">
                {userToRemove.name || userToRemove.email}
              </span>{" "}
              from this project?
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelRemoveUser}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveUser}
                className="px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600"
                disabled={isRemoving}
              >
                {isRemoving ? (
                  <div className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Removing...
                  </div>
                ) : (
                  "Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Overlay for AI message panel - ADD THIS HERE */}
      {isAIMessagePanelOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30"
          onClick={() => setIsAIMessagePanelOpen(false)}
        ></div>
      )}
      {/* AI Message Detail Panel */}
      {isAIMessagePanelOpen && selectedAIMessage && (
        <section className="ai-message-panel fixed right-0 top-0 h-screen w-full md:w-2/3 lg:w-1/2 bg-white shadow-xl z-40 overflow-y-auto flex flex-col transition-all duration-300 ease-in-out">
          <header className="sticky top-0 bg-purple-100 p-4 border-b border-purple-200 flex justify-between items-center z-10">
            <h3 className="font-semibold text-purple-900">
              <i className="ri-robot-line mr-2"></i>
              AI Assistant
            </h3>
            <button
              onClick={() => setIsAIMessagePanelOpen(false)}
              className="p-2 rounded-full hover:bg-purple-200 transition"
            >
              <i className="ri-close-line text-lg"></i>
            </button>
          </header>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="text-sm text-gray-500 mb-4">
                {new Date(selectedAIMessage.timestamp).toLocaleString()}
              </div>
              <div className="bg-purple-50 p-6 rounded-lg shadow-sm border border-purple-100">
                <div className="prose prose-lg markdown-content">
                  <Markdown
                    options={{
                      overrides: {
                        // Override for code inline elements
                        code: {
                          component: ({ className, children }) => {
                            // Only apply SyntaxHighlighter to code blocks with language class
                            if (className) {
                              const language = className.replace(
                                "language-",
                                ""
                              );
                              return (
                                <SyntaxHighlighter
                                  language={language}
                                  style={oneDark}
                                  showLineNumbers
                                >
                                  {children}
                                </SyntaxHighlighter>
                              );
                            }
                            // For inline code, return a simple code element
                            return <code>{children}</code>;
                          },
                        },
                        // Handle pre blocks directly to avoid nesting issues
                        pre: {
                          component: ({ children }) => {
                            // Extract code element if it exists
                            if (React.Children.count(children) === 1) {
                              const child = React.Children.only(children);
                              if (
                                React.isValidElement(child) &&
                                child.type === "code"
                              ) {
                                // Skip rendering the <pre> since SyntaxHighlighter will handle it
                                return child;
                              }
                            }
                            // Otherwise pass through as normal pre
                            return <pre>{children}</pre>;
                          },
                        },
                        // Prevent paragraphs from wrapping code blocks
                        p: {
                          component: ({ children }) => {
                            // Check for direct SyntaxHighlighter children or code > SyntaxHighlighter patterns
                            const childArray = React.Children.toArray(children);

                            // If there's only one child and it's a SyntaxHighlighter or code element
                            if (childArray.length === 1) {
                              const onlyChild = childArray[0];
                              if (
                                React.isValidElement(onlyChild) &&
                                (onlyChild.type === SyntaxHighlighter ||
                                  onlyChild.type === "code")
                              ) {
                                return <>{onlyChild}</>;
                              }
                            }

                            return <p>{children}</p>;
                          },
                        },
                      },
                    }}
                  >
                    {selectedAIMessage.message}
                  </Markdown>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsAIMessagePanelOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};

export default Project;
