import React, { Component } from "react";
import Layout from "./layout";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getReasons, deleteReason } from '../redux/actions/reason';
import { connect } from "react-redux";
import { Modal } from 'react-bootstrap';
import Pagination from './Pagination';

export class Reasons extends Component {
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
    this.props.getReasons();
  }
  paginate = (pageNumber) => (e) => {
    e.preventDefault();
    const { search_keyword } = this.state;
    this.props.getReasons(pageNumber,search_keyword);
  };

  handleDelete = (id) => (e) => {
    this.setState({ showDeleteModal: true, selectedId:id });  
  }

  handleEdit = (id) => (e) => {
    this.props.history.push(`/edit-reason/${id}`);
  };

  closeDeleteModal = (e) => {
    this.setState({ showDeleteModal: false });
  }

  openDeleteMoal = (e) => {
    this.setState({ showDeleteModal: true });
  }

  confirmDelete = (e) => {
    this.props.deleteReason(this.state.selectedId,this.props);
    this.setState({ showDeleteModal: false, selectedId:'' });
  }

  searchData = (e) => {
    let page = 1;
    let search_keyword = e.target.value;
    this.setState({ search_keyword });
    this.props.getReasons(page,search_keyword);
  };

  render() {
    return (
      <>
        <Helmet>
          <title>Reasons</title>
        </Helmet>
        <Layout title="Reasons">
          <div className="container-fluid">
            <div className="card shadow mb-4">
              <div className="card-header d-flex  justify-content-between align-items-center">
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
                      to="/add-reason"
                    >
                      {" "}
                      Add Reason
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
                        <th>Title</th>
                        <th>Status</th>
                        <th colSpan="2" width="8%">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {this.props.reasons &&
                      this.props.reasons.length > 0 ? (
                        this.props.reasons.map((reason, index) => (
                          <tr key={reason._id}>
                            <td>{reason.title}</td>
                            <td>{reason.status_text}</td>

                            <td className="text-center">
                              <i
                                onClick={this.handleEdit(reason._id)}
                                className="fa fa-edit"
                                style={{ cursor: "pointer", color: "blue" }}
                              />
                            </td>
                            <td className="text-center">
                              <i
                                onClick={this.handleDelete(reason._id)}
                                className="fa fa-trash"
                                style={{ cursor: "pointer", color: "red" }}
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="text-center" colSpan="3">
                            No Records
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {this.props.reasons.length > 0 && this.props.pagination ? (
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
            closebutton={true}
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

const mapStateToProps = state => ({ reasons: state.reason.list, pagination: state.reason.pagination });
const mapDispatchToProps = {
  getReasons,deleteReason
};
export default connect(mapStateToProps,mapDispatchToProps)(Reasons);
