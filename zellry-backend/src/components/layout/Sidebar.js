import React, { useEffect } from "react";
import { Link, NavLink,useLocation } from "react-router-dom";
import {appendScript, removeScript} from '../../utils/helpers'


function Sidebar() {
  const location = useLocation();
  const getNavLinkClass = path => {
    return location.pathname === path
      ? "nav-item active"
      : "nav-item";
  };
  useEffect(() => {
    appendScript("assets/js/sb-admin-2.js");
    return () => {
      removeScript("assets/js/sb-admin-2.js");
    };
  }, []);  

  return (
    <ul
      className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion toggled"
      id="accordionSidebar"
    >
      <Link
        className="sidebar-brand d-flex align-items-center justify-content-center"
        to="/user-list"
      >
        <div className="sidebar-brand-icon">
          <img alt="Logo" src="assets/img/logo.png" className="max-h-40px" />
        </div>
        {/* <div className="sidebar-brand-text mx-3"></div> */}
      </Link>
     

      {/* Heading */}
      {/* <div className="sidebar-heading">Manage Users</div> */}
      {/* Nav Item - Tables */}
      {/* <li className={getNavLinkClass("/add-user")}>
        <NavLink className="nav-link" to="/add-user">
          <i className="fas fa-fw fa-edit" />
          <span>Add User</span>
        </NavLink>
      </li> */}
      


      {/* Divider */}
      <hr className="sidebar-divider" />
      
      <li className={getNavLinkClass("/user-list") + ' ' + getNavLinkClass("/add-user")}>
        <NavLink className="nav-link" to="/user-list">
          <i className="fas fa-fw fa-user" />
          <span>Users</span>
        </NavLink>
      </li>

      <li className={getNavLinkClass("/countries") + ' ' + getNavLinkClass("/add-country")}>
        <NavLink className="nav-link" to="/countries">
          <i className="fas fa-fw fa-globe" />
          <span>Countries</span>
        </NavLink>
      </li>

      <li className={getNavLinkClass("/industries") + ' ' + getNavLinkClass("/add-industry")}>
        <NavLink className="nav-link" to="/industries">
          <i className="fas fa-fw fa-industry" />
          <span>Industries</span>
        </NavLink>
      </li>

      <li className={getNavLinkClass("/clusters")  + ' ' + getNavLinkClass("/add-cluster")}>
        <NavLink className="nav-link" to="/clusters">
          <i className="fas fa-fw fa-users" />
          <span>Clusters</span>
        </NavLink>
      </li>

      <li className={getNavLinkClass("/configuration")}>
        <NavLink className="nav-link" to="/configuration">
          <i className="fas fa-fw fa-cog" />
          <span>Fields Setting</span>
        </NavLink>
      </li>

      <li className={getNavLinkClass("/reasons") + ' ' + getNavLinkClass("/add-reason") + ' ' + getNavLinkClass("/edit-reason/:id")}>
        <NavLink className="nav-link" to="/reasons">
          <i className="fas fa-fw fa-cog" />
          <span>Lost Reasons</span>
        </NavLink>
      </li>

      <li className={getNavLinkClass("/reports")}>
        <NavLink className="nav-link" to="/reports">
          <i className="fas fa-fw fa-file" />
          <span>Reports</span>
        </NavLink>
      </li>
    

      {/* Divider */}
      <hr className="sidebar-divider d-none d-md-block" />
      {/* Sidebar Toggler (Sidebar) */}
      <div className="text-center d-none d-md-inline">
        <button className="rounded-circle border-0" id="sidebarToggle" />
      </div>
    </ul>
  );
}

export default Sidebar;
