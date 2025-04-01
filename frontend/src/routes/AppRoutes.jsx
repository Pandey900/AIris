import React from "react";
import { Route, BrowserRouter, Routes } from "react-router-dom";
import Home from "../screens/Home";
import Login from "../screens/Login";
import Register from "../screens/Register";
import Project from "../screens/Project";
import UserAuth from "../auth/user.auth";
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <UserAuth>
              <Home />
            </UserAuth>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/project"
          element={
            <UserAuth>
              <Project />
            </UserAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
