import React from "react";
import "./css/App.css";
import { useEffect, useState, useRef } from "react";
import Homepage from "./Homepage";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import AboutUs from "./AboutUs";
import Login from "./Login";
import { Status, MessageTypes } from "./js_files/Status_MessageTypes";
import {
  LoginErrorCodes,
  SignupErrorCodes,
  ChangePasswordErrorCodes,
} from "./js_files/ErrorCodes";
import { useIsMobile } from "./hooks/use-mobile";
import Signup from "./Signup";
import Chatpage from "./Chatpage";
import Profile from "./Profile";
import Settings from "./Settings";
import CustomAlertModal from "./CustomAlertModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function RequireAuth({ isAuth, children }) {
  return isAuth ? children : <Navigate to="/login" replace />;
}

function App() {
  const newSocket = useRef(null);
  const [socket, setSocket] = useState(null);
  const [socketMessage, setSocketMessage] = useState("");

  const isMobile = useIsMobile();

  // for setting different messages
  const [message, setMessage] = useState("");

  // suggestions for search
  let [suggestions, setSuggestions] = useState([]);

  // usestate for users friend list
  let [userFriendsList, setUserFriendsList] = useState(() => {
    const storedUserFriendsList = localStorage.getItem("userFriendsList");
    return storedUserFriendsList ? JSON.parse(storedUserFriendsList) : [];
  });

  let [friendRequest, setFriendRequest] = useState(() => {
    const storedFriendRequest = localStorage.getItem("friendRequest");
    return storedFriendRequest ? JSON.parse(storedFriendRequest) : [];
  });

  //get theme from localstorage
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "light";
  });
  //set theme in localstorage
  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const navigate = useNavigate(); //used for navigation
  const timestamp = new Date().toISOString();

  // for checking if user is authenticate or not
  const [isAuth, setIsAuth] = useState(
    () => localStorage.getItem("isAuth") === "true"
  );

  // Initialize user data from localStorage
  const [currentUserId, setCurrentUserId] = useState(
    () => parseInt(localStorage.getItem("currentUserId"), 10) || -1
  );
  const [currentUsername, setCurrentUsername] = useState(
    () => localStorage.getItem("currentUsername") || ""
  );
  const [currentNameOfUser, setCurrentNameOfUser] = useState(
    localStorage.getItem("currentNameOfUser") || ""
  );

  // Save updated user info to localStorage whenever it changes
  useEffect(() => {
    if (currentUsername !== "") {
      localStorage.setItem("currentUsername", currentUsername);
    }
  }, [currentUsername]);
  useEffect(() => {
    if (currentUsername !== "") {
      localStorage.setItem("currentUsername", currentUsername);
    }
  }, [currentUsername]);

  useEffect(() => {
    if (currentNameOfUser !== "") {
      localStorage.setItem("currentNameOfUser", currentNameOfUser);
    }
  }, [currentNameOfUser]);

  // clears the message after 2 seconds
  function clearMessage() {
    setTimeout(() => setMessage(""), 2000);
  }

  // profile informartion of user
  const [userProfileInfo, setUserProfileInfo] = useState(() => {
    const storedUserProfileInfo = localStorage.getItem("userProfileInfo");
    return storedUserProfileInfo ? JSON.parse(storedUserProfileInfo) : {};
  });

  // alert modal and msg usestate
  const [showAlertErrorModal, setShowAlertErrorModal] = useState(false);
  const [modalAlertErrorMessage, setModalAlerErrorMessage] = useState("");

  // active status
  let [isActive, setIsActive] = useState(false);

  // main use effect for communication with server
  useEffect(() => {
    // newSocket.current = new WebSocket("ws://localhost:2121");
     newSocket.current = new WebSocket("https://95cf0dd82593.ngrok-free.app/");

    newSocket.current.onopen = () => {
      setSocketMessage("Connected!");
      console.log("Connected to server");

      // 2 nd scenario
      const token = localStorage.getItem("auth_token");
      if (isAuth) {
        console.log("Session found, sending RECONNECT_REQUEST...");
        const reconnectRequest = {
          message_type: MessageTypes.RECONNECT_REQUEST,
          user_id: currentUserId,
          auth_token: token,
        };
        console.log(reconnectRequest, "Reconnect request");

        newSocket.current.send(JSON.stringify(reconnectRequest));
      }
    };

    newSocket.current.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);

      switch (parsedData.message_type) {
        case MessageTypes.LOGIN_RESPONSE:
          {
            if (parsedData.status === Status.SUCCESS) {
              console.log("Received from Server:", parsedData);
              setCurrentUserId(parsedData.user_id);
              setMessage("Login Successfull");
              setIsAuth(true);
              setIsActive(true);
              localStorage.setItem("isAuth", "true");
              localStorage.setItem("currentUserId", parsedData.user_id);
              localStorage.setItem("isActive", "true");
              // 1 st scenario
              localStorage.setItem("auth_token", parsedData.auth_token);

              clearMessage();
              navigate("/chatpage");
            } else if (parsedData.status === Status.ERROR) {
              if (
                parsedData.error_code === LoginErrorCodes.USERNAME_NOT_FOUND
              ) {
                setMessage("Username does not Exist");
              } else if (
                parsedData.error_code === LoginErrorCodes.PASSWORD_IS_INCORRECT
              ) {
                setMessage("Incorrect Password");
              }
            }
          }
          break;

        case MessageTypes.SIGN_UP_RESPONSE:
          {
            if (parsedData.status === Status.SUCCESS) {
              setMessage("Signup Successfull");
              setTimeout(() => {
                navigate("/login");
                setMessage("");
              }, 2000);
            } else if (parsedData.status === Status.ERROR) {
              if (
                parsedData.error_code ===
                SignupErrorCodes.USERNAME_ALREADY_EXISTS
              ) {
                setMessage("Username already exists!");
              } else if (
                parsedData.error_code === SignupErrorCodes.EMAIL_ALREADY_EXISTS
              ) {
                setMessage("Email already exists!");
              } else if (
                parsedData.error_code === SignupErrorCodes.PHONE_ALREADY_EXISTS
              ) {
                setMessage("Phone already exists!");
              }
            }
          }
          break;

        case MessageTypes.LOGOUT_RESPONSE:
          {
            console.log(parsedData, "Logout response");
            if (parsedData.status === Status.SUCCESS) {
              setCurrentUserId(-1);
              setCurrentUsername("");
              setCurrentNameOfUser("");
              setFriendRequest([]);
              setMessage("");
              setIsActive(false);

              setIsAuth(false);
              localStorage.removeItem("isAuth");
              localStorage.removeItem("currentUserId");
              localStorage.removeItem("currentUsername");
              localStorage.removeItem("currentNameOfUser");
              localStorage.removeItem("auth_token");
              localStorage.setItem("isActive", "false");

              setUserProfileInfo({});
              setSuggestions([]);
              setShowAlertErrorModal(false);
              setModalAlerErrorMessage("");
              setTheme("light");
              navigate("/");
            } else if (parsedData.status === Status.ERROR) {
              setModalAlerErrorMessage(
                "An error occurred while logging out. Please try again."
              );
              setShowAlertErrorModal(true);
            }
          }
          break;

        case MessageTypes.SEARCH_USER_RESPONSE:
          {
            setSuggestions(parsedData.users.slice(0, 30));
          }
          break;

        case MessageTypes.FRIEND_REQ_REQUEST:
          {
            console.log(parsedData, "friend req request");
            setFriendRequest((prev) => {
              const isAlreadyThere = prev.some(
                (req) => req.sender_id === parsedData.sender_id
              );
              if (isAlreadyThere) {
                console.log(
                  "Friend request already exists, not adding duplicate."
                );
                return prev; // Return the previous state without modification
              }
              return [...prev, parsedData];
            });
          }
          break;

        case MessageTypes.USER_PROFILE_INFORMATION:
          {
            localStorage.setItem("currentNameOfUser", parsedData.fullname);
            localStorage.setItem("currentUsername", parsedData.username);
            setCurrentUsername(parsedData.username);
            setCurrentNameOfUser(parsedData.fullname);
            setUserProfileInfo(parsedData);
          }
          break;

        case MessageTypes.USER_PENDING_FRIEND_REQUESTS_LIST:
          {
            setFriendRequest(parsedData.pending_friend_requests_list);
          }
          break;

        case MessageTypes.USER_FRIENDS_LIST:
          {
            setUserFriendsList(parsedData.friends_list);
          }
          break;

        case MessageTypes.USER_MESSAGE_HISTORY:
          {
            console.log(parsedData, "user msg history");
          }
          break;

        case MessageTypes.CHANGE_PASSWORD_RESPONSE:
          {
            if (parsedData.status == Status.SUCCESS) {
              setMessage("Password changed successfully!");
            } else if (parsedData.status == Status.ERROR) {
              if (
                parsedData.error_code ==
                ChangePasswordErrorCodes.NEW_PASSWORD_MUST_BE_DIFFERENT
              ) {
                setMessage("New Password must be Different!");
              }
            }
          }
          break;

        case MessageTypes.RECONNECT_RESPONSE: {
          if (parsedData.status === Status.SUCCESS) {
            localStorage.setItem("isAuth", "true");
            localStorage.setItem("currentUserId", parsedData.user_id);
            localStorage.setItem("auth_token", parsedData.auth_token);
            setSocketMessage("Connected!");
            navigate("/chatpage");
            setIsAuth(true);
          } else if (parsedData.status === Status.ERROR) {
            setMessage("Session expired. Please login again.");
            setIsAuth(false);
            navigate("/login");
          }
          break;
        }

        case MessageTypes.UPDATE_PROFILE_RESPONSE: {
          if (parsedData.status === Status.SUCCESS) {
            toast.success("Profile updated successfully!");
          } else if (parsedData.status === Status.ERROR) {
            toast.error("Profile update failed!");
          }
          break;
        }

        default:
          {
            console.log("Invalid Message Type");
          }
          break;
      }
    };

    newSocket.current.onclose = () => {
      setSocketMessage("Disconnected!");
      console.log("Connection closed");
    };

    newSocket.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setSocketMessage("Disconnected!");
    };

    setSocket(newSocket.current);

    return () => {
      if (newSocket.current) newSocket.current.close();
    };
  }, []);

  const handleCloseErrorModal = () => {
    setShowAlertErrorModal(false);
    setModalAlerErrorMessage("");
  };

// Add this to your App.js
useEffect(() => {
  const handleTabClose = () => {
    localStorage.setItem("isActive", "false");
  };

  window.addEventListener('beforeunload', handleTabClose);
  
  return () => {
    window.removeEventListener('beforeunload', handleTabClose);
  };
}, []);

  return (
    <>
      {socketMessage && (
        <div
          className={`status-indicator ${
            socketMessage === "Connected!"
              ? "status-connected"
              : "status-disconnected"
          }`}
        >
          <span style={{ fontSize: "0.5rem", marginRight: 6 }}>
            {socketMessage === "Connected!" ? "🟢" : "🔴"}
          </span>
          {socketMessage}
        </div>
      )}

      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/about_us" element={<AboutUs />} />

        <Route
          path="/login"
          element={
            <Login
              navigate={navigate}
              isMobile={isMobile}
              setMessage={setMessage}
              message={message}
              setCurrentUsername={setCurrentUsername}
              socket={socket}
              timestamp={timestamp}
              setIsActive={setIsActive}
              isActive={isActive}
            />
          }
        />

        <Route
          path="/signup"
          element={
            <Signup
              navigate={navigate}
              isMobile={isMobile}
              message={message}
              setMessage={setMessage}
              socket={socket}
              timestamp={timestamp}
            />
          }
        />

        <Route
          path="/chatpage"
          element={
            <RequireAuth isAuth={isAuth}>
              <Chatpage
                socket={socket}
                message={message}
                setMessage={setMessage}
                currentNameOfUser={currentNameOfUser}
                currentUsername={currentUsername}
                currentUserId={currentUserId}
                timestamp={timestamp}
                theme={theme}
                setTheme={setTheme}
                setUserFriendsList={setUserFriendsList}
                userFriendsList={userFriendsList}
                friendRequest={friendRequest}
                setFriendRequest={setFriendRequest}
                setSuggestions={setSuggestions}
                suggestions={suggestions}
                navigate={navigate}
              />
            </RequireAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <RequireAuth isAuth={isAuth}>
              <Profile
                navigate={navigate}
                userProfileInfo={userProfileInfo}
                message={message}
                currentUserId={currentUserId}
                socket={socket}
                setMessage={setMessage}
              />
            </RequireAuth>
          }
        />

        <Route
          path="/settings"
          element={
            <RequireAuth isAuth={isAuth}>
              <Settings
                theme={theme}
                setTheme={setTheme}
                setMessage={setMessage}
                message={message}
                socket={socket}
                currentUserId={currentUserId}
                onClose={() => navigate("/chatpage")}
                navigate={navigate}
              />
            </RequireAuth>
          }
        />
      </Routes>

      {showAlertErrorModal && (
        <CustomAlertModal
          title="Logout Error"
          message={modalAlertErrorMessage}
          onClose={handleCloseErrorModal}
        />
      )}

      <ToastContainer position="top-center" autoClose={3000} />
    </>
  );
}

export default App;
