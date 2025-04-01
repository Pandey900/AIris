import React, { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import {
  initializeSocket,
  receiveMessage,
  sendMessage as socketSendMessage,
  disconnectSocket,
} from "../config/socket.js";
import { UserContext } from "../context/user.context";

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

  // New message-related states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [messageSending, setMessageSending] = useState(false);

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
    // Only initialize socket if projectId exists
    let socketInitialized = false;

    if (projectId) {
      const socket = initializeSocket(projectId);
      socketInitialized = !!socket;

      if (socketInitialized) {
        // Set up message listener
        receiveMessage("project-message", (messageData) => {
          console.log("Received message:", messageData);
          if (messageData) {
            setMessages((prevMessages) => [...prevMessages, messageData]);
          }
        });
      }
    }

    // Updated fetchMessages function with better error handling
    const fetchMessages = async () => {
      if (!projectId) return;

      setIsMessagesLoading(true);
      try {
        try {
          const response = await axios.get(`/messages/${projectId}`);
          if (response.data && response.data.messages) {
            setMessages(response.data.messages);
          }
        } catch (err) {
          // Log the specific error for debugging
          console.error("Error details:", err.response?.data || err.message);

          // Initialize with empty messages instead of failing
          setMessages([]);

          // You could also add a user-friendly error message
          setError((prev) => ({
            ...prev,
            messages: "Couldn't fetch messages. Please try again later.",
          }));
        }
      } catch (err) {
        console.error("Fatal error fetching messages:", err);
        setMessages([]);
      } finally {
        setIsMessagesLoading(false);
      }
    };

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
    fetchMessages();

    // Clean up socket on unmount
    return () => {
      if (socketInitialized) {
        disconnectSocket();
      }
    };
  }, [projectId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // Handle sending a message - renamed to avoid conflict with socketSendMessage
  // Enhanced handleSendMessage function
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !projectId || messageSending) return;

    setMessageSending(true);
    try {
      // Send to API first for persistence
      const response = await axios.post("/messages", {
        projectId,
        content: newMessage.trim(),
      });

      // If API call succeeds, use the returned message object (with proper ID and timestamp)
      if (response.data && response.data.message) {
        const savedMessage = response.data.message;

        // Add to local state
        setMessages((prev) => [...prev, savedMessage]);

        // Then broadcast via socket to other users
        socketSendMessage("project-message", savedMessage);

        // Clear input
        setNewMessage("");
      }
    } catch (err) {
      console.error(
        "Error sending message:",
        err.response?.data || err.message
      );
      alert("Failed to send message. Please try again.");
    } finally {
      setMessageSending(false);
    }
  };

  // Format date for messages
  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format date for message groups
  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};

    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    // Convert to array of {date, messages} objects
    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages,
    }));
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

  return (
    <main className="h-screen w-full flex flex-col md:flex-row overflow-hidden">
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

        {/* Messages Section - Updated */}
        <div className="conversation-area flex flex-col p-2 md:p-4 overflow-hidden flex-1 bg-gray-50">
          {/* Messages container */}
          <div className="messages flex-1 overflow-y-auto mb-4 pr-2">
            {isMessagesLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : messages.length > 0 ? (
              groupMessagesByDate(messages).map((group, groupIndex) => (
                <div key={groupIndex} className="mb-6">
                  <div className="date-divider flex items-center my-3">
                    <div className="h-px flex-1 bg-gray-200"></div>
                    <span className="px-3 text-xs text-gray-500 bg-gray-50">
                      {formatMessageDate(group.date)}
                    </span>
                    <div className="h-px flex-1 bg-gray-200"></div>
                  </div>

                  {group.messages.map((message, index) => {
                    const user = projectMembers.find(
                      (member) => member._id === message.senderId
                    );

                    return (
                      <div
                        key={message._id || index}
                        className="message mb-4 animate-fadeIn"
                      >
                        <div className="flex items-start">
                          <img
                            src={getAvatar(user?.gender || "male")}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full mr-3 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-baseline">
                              <h4 className="font-medium text-sm text-gray-900">
                                {user?.name ||
                                  user?.email?.split("@")[0] ||
                                  "Unknown User"}
                              </h4>
                              <span className="ml-2 text-xs text-gray-500">
                                {formatMessageTime(message.createdAt)}
                              </span>
                            </div>
                            <div className="message-content mt-1 text-gray-700 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                              {message.content}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <i className="ri-chat-3-line text-4xl mb-2"></i>
                <p>No messages yet</p>
                <p className="text-sm">Be the first to send a message!</p>
              </div>
            )}
            <div ref={messageEndRef} /> {/* Empty div for auto-scrolling */}
          </div>

          {/* Message input form */}
          <form
            onSubmit={handleSendMessage}
            className="message-input flex items-end rounded-lg border bg-white p-2 shadow-sm"
          >
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border-none bg-transparent p-2 focus:outline-none resize-none max-h-32"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e); // Use the correct function name
                }
              }}
            />
            <button
              type="submit"
              className={`ml-2 rounded-full p-2 ${
                newMessage.trim() && !messageSending
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              disabled={!newMessage.trim() || messageSending}
            >
              {messageSending ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <i className="ri-send-plane-fill text-lg"></i>
              )}
            </button>
          </form>
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
    </main>
  );
};

export default Project;
