import React, { Component } from "react";
import Layout from "./layout";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { getUsers, deleteUser } from '../redux/actions/user';
import { connect } from "react-redux";
import { Modal } from 'react-bootstrap';
import Pagination from './Pagination';


export class UserList extends Component {

  constructor(props){
    super(props);

    this.state = {
      showDeleteModal:false,
      selectedId:'',
      search_keyword:'',
    }

    this.closeDeleteModal.bind(this);    
    this.openDeleteMoal.bind(this);  
    this.confirmDelete.bind(this);
    this.paginate.bind(this);    
    this.searchData.bind(this);   
  }

  componentDidMount = async () =>{
    this.props.getUsers();
  }

  paginate = (pageNumber) => (e) => {
    e.preventDefault();
    const { search_keyword } = this.state;
    this.props.getUsers(pageNumber,search_keyword);
  };

  handleDelete = (user_id) => (e) => {
    this.setState({ showDeleteModal: true, selectedId:user_id });
  }

  handleEdit = (user_id) => (e) => {
    this.props.history.push(`/edit-user/${user_id}`);
  };

  closeDeleteModal = (e) => {
    this.setState({ showDeleteModal: false });
  }

  openDeleteMoal = (e) => {
    this.setState({ showDeleteModal: true });
  }

  confirmDelete = (e) => {
    this.props.deleteUser(this.state.selectedId,this.props);
    this.setState({ showDeleteModal: false, selectedId:'' });
  }

  searchData = (e) => {
    let page = 1;
    let search_keyword = e.target.value;
    this.setState({ search_keyword });
    this.props.getUsers(page,search_keyword);
  };

  render() {
    return (
      <>
        <Helmet>
          <title>Users</title>
        </Helmet>
        <Layout title="Users">
          <div className="container-fluid">
            <div className="card shadow mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div className="searchArea">
                  <form onSubmit={(e) => e.preventDefault()}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search..."
                      onKeyUp={this.searchData}
                      style={{ height:"31px" }}
                        />
                  </form>
                    <Link
                    className="btn btn-sm btn-primary float-right srchbtn"
                    to="/add-user"
                  >
                    {" "}
                    Add User
                  </Link>
                </div>                
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table
                    className="table table-bordered table-hover table-md"
                    id="dataTable"
                    width="100%"
                    cellSpacing={0}
                  >
                    <thead>
                      <tr>
                        <th width="5%"></th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Contact</th>
                        <th>Status</th>
                        <th colSpan="2" width="8%">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {this.props.users && this.props.users.length > 0 ? (
                        this.props.users.map((user, index) => (
                          <tr key={user._id}>
                            <td className="text-center">
                              {user.photo ? (
                                <img
                                  src={user.photo}
                                  style={{
                                    height: "20px",
                                    width: "20px",
                                    borderRadius: "50%",
                                    border:"2px solid rgb(190, 194, 197)"
                                  }}
                                  alt="avtar"
                                />
                              ) : (
                                <img
                                  style={{
                                    height: "20px",
                                    width: "20px",
                                    borderRadius: "50%",
                                    border:"2px solid rgb(190, 194, 197)"
                                  }}
                                  src="assets/img/undraw_profile.svg"
                                  alt="avtar"
                                />
                              )}
                            </td>
                            <td>{user.username}</td>
                            <td>{user.email}</td>
                            <td>{user.contact_no}</td>
                            <td>{user.status === 1 ? "Enable" : "Disable"}</td>

                            <td className="text-center">
                              <i
                                onClick={this.handleEdit(user._id)}
                                className="fa fa-edit"
                                style={{ cursor: "pointer", color: "blue" }}
                              />
                            </td>
                            <td className="text-center">
                              <i
                                onClick={this.handleDelete(user._id)}
                                className="fa fa-trash"
                                style={{ cursor: "pointer", color: "red" }}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="text-center" colSpan="6">
                            No Records
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {this.props.users.length > 0 && this.props.pagination ? (
                  <>
                    <div className="d-flex justify-content-end" style={{ height:"25px" }}>
                      <span className="mr-3" style={{ color:"rgb(0 123 255)" }}>
                        <small>
                          {this.props.pagination.recordRange}
                        </small>                          
                      </span>
                      <Pagination
                        totalPages={this.props.pagination.totalPages}
                        paginate={this.paginate}
                        currentPage={this.props.pagination.page}
                      />
                    </div>
                  </>                  
                ) : null}
              </div>
            </div>
          </div>
          <Modal
            show={this.state.showDeleteModal}
            onHide={this.closeDeleteModal}
            centered
            aria-labelledby="contained-modal-title-vcenter"
            size="sm"
            closebutton="true"
          >
            <Modal.Body>
              <div className="delete-popup">
                <div className="close-icon" onClick={this.closeDeleteModal}>
                  <i className="fa fa-times" />
                </div>
                <div className="delete-popup-img" />
                <div className="delete-popup-heading">Delete Permanently</div>
                <div className="delete-popup-subheading">
                  Are you sure you want permanently delete these record(s) from
                  your list?
                </div>
                <div className="mt-3">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={this.confirmDelete}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </Modal.Body>
          </Modal>
        </Layout>
      </>
    );
  }
}

const mapStateToProps = state => ({ users: state.user.list, pagination: state.user.pagination });
const mapDispatchToProps = {
  getUsers,deleteUser
};
export default connect(mapStateToProps,mapDispatchToProps)(UserList);
