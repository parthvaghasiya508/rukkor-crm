import React from "react";
import Layout from "./layout";
import  {Helmet } from 'react-helmet-async';

function Dashboard() {
  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>
      <Layout>
        <div className="container-fluid">
          {/* Page Heading */}
          <div className="d-sm-flex align-items-center justify-content-between mb-4">
            <h1 className="h3 mb-0 text-gray-800 text-center">Welcome</h1>
          </div>
          {/* Content Row */}          
        </div>
      </Layout>
    </>
  );
}

export default Dashboard;
