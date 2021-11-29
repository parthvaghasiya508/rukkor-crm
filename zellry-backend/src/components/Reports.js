import React, { Component } from "react";
import Layout from "./layout";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getLostReports } from '../redux/actions/report';
import { getAllReasons } from '../redux/actions/reason';
import { getAllUsers } from '../redux/actions/user';
import { connect } from "react-redux";
import { Modal } from 'react-bootstrap';
import Pagination from './Pagination';
import moment from "moment-timezone";
import { DateRangePicker } from "rsuite";
import { DateStaticRanges } from "../utils/helpers";

export class Reports extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showDeleteModal: false,
      selectedId: "",
      inputDKey: Date.now(),
      lost_by: "",
      lost_reason: "",
      date_range: "",
    };

    this.closeDeleteModal.bind(this);
    this.openDeleteMoal.bind(this);
    this.confirmDelete.bind(this);
    this.paginate.bind(this);
    this.handleDate.bind(this);
    this.onFilterSubmit = this.onFilterSubmit.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.clearDate = this.clearDate.bind(this);
    this.clearFilter.bind(this);
  }
  componentDidMount = async () => {
    let param = {
        current_page:1,
        timezone:moment.tz.guess(true)
    }
    this.props.getLostReports(param);
    this.props.getAllReasons();
    this.props.getAllUsers();
  };
  paginate = (pageNumber) => (e) => {
    e.preventDefault();
    const {lost_by, lost_reason, date_range} = this.state;
    let param = {
        current_page:pageNumber,
        lost_by: lost_by,
        lost_reason: lost_reason,
        date_range: date_range,
        timezone:moment.tz.guess(true)
    }
    this.props.getLostReports(param);
  };

  handleDelete = (id) => (e) => {
    this.setState({ showDeleteModal: true, selectedId: id });
  };

  handleEdit = (id) => (e) => {
    this.props.history.push(`/edit-report/${id}`);
  };

  closeDeleteModal = (e) => {
    this.setState({ showDeleteModal: false });
  };

  openDeleteMoal = (e) => {
    this.setState({ showDeleteModal: true });
  };

  confirmDelete = (e) => {
    this.props.deleteReport(this.state.selectedId, this.props);
    this.setState({ showDeleteModal: false, selectedId: "" });
  };

  // Filter Submit
  onFilterSubmit = (e) => {
    e.preventDefault();
    const {lost_by, lost_reason, date_range} = this.state;

    let param = {
      current_page: 1,
      lost_by: lost_by,
      lost_reason: lost_reason,
      date_range: date_range,
      timezone:moment.tz.guess(true)
    };
    this.props.getLostReports(param);
  };

  handleDate = (date,name) => {
    let new_date = [];
    for (const dt of date) {
      new_date.push(moment(dt).format("YYYY-MM-DD"));
    }
    let date_var = new_date.length > 0 ? new_date : "";
    this.setState({ [name]:date_var });
  };

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]:value });
  }

  clearDate = (name) => {
    this.setState({ [name]:"" });
  }

  clearFilter = (e) => {
    this.setState({ 
        lost_by: "",
        lost_reason: "",
        date_range: "", 
        inputDKey:Date.now()
    });
  };

  render() {
    return (
      <>
        <Helmet>
          <title>Reports</title>
        </Helmet>
        <Layout title="Reports">
          <div className="container-fluid">
            <div className="card shadow mb-4">
              <div className="card-header d-flex justify-content-between align-items-center">
                <form
                  onSubmit={this.onFilterSubmit}
                  className="lostReportFilterFrm"
                >
                  <div className="form-group">
                    <select
                      name="lost_by"
                      className="form-control"
                      onChange={this.handleInputChange}
                      value={this.state.lost_by}
                    >
                      <option value="">Lost By</option>
                      {this.props.users &&
                        this.props.users.length > 0 &&
                        this.props.users.map((user, index) => (
                          <option key={user._id} value={user._id}>
                            {user.username}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <select
                      name="lost_reason"
                      className="form-control"
                      onChange={this.handleInputChange}
                      value={this.state.lost_reason}
                    >
                      <option value="">Deal Lost Reason</option>
                      {this.props.reasons &&
                        this.props.reasons.length > 0 &&
                        this.props.reasons.map((reason, index) => (
                          <option key={reason._id} value={reason._id}>
                            {reason.title}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <DateRangePicker
                      key={this.state.inputDKey}
                      isoWeek
                      format="YYYY-MM-DD"
                      style={{ width: "100%" }}
                      placement="auto"
                      onChange={(date) => {
                        this.handleDate(date,"date_range");
                      }}
                      onClean={() => this.clearDate("date_range")}
                      name="date_range"
                      ranges={DateStaticRanges}
                      size="sm"
                      placeholder="DD-MM-YYYY to DD-MM-YYYY"
                      renderValue={(value) => {
                        console.log("value:", value);
                        return `${moment(value[0]).format(
                          "DD-MM-YYYY"
                        )} to ${moment(value[1]).format("DD-MM-YYYY")}`;
                      }}
                    />
                  </div>
                  <div className="form-group btn-group">
                    <button className="btn btn-sm btn-secondary" type="submit">
                      Apply Filter
                    </button>
                    <button className="btn btn-sm btn-secondary ml-1" onClick={this.clearFilter}>
                      Clear Filter
                    </button>
                  </div>
                </form>
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
                        <th>Organization</th>
                        <th>Contact Name</th>
                        <th>Responsible</th>
                        <th>User</th>
                        <th>Lost Reason</th>
                        <th>Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {this.props.reports && this.props.reports.length > 0 ? (
                        this.props.reports.map((report, index) => (
                          <tr key={report._id}>
                            <td>{report.organization}</td>
                            <td>{report.contact_name}</td>
                            <td>{report.responsible}</td>
                            <td>{report.reported_user}</td>
                            <td>{report.lost_reason}</td>
                            <td>{report.action_date_time}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="text-center" colSpan="5">
                            No Records
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {this.props.reports.length > 0 && this.props.pagination ? (
                  <>
                    <div
                      className="d-flex justify-content-end"
                      style={{ height: "25px" }}
                    >
                      <span
                        className="mr-3"
                        style={{ color: "rgb(0 123 255)" }}
                      >
                        <small>{this.props.pagination.recordRange}</small>
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

const mapStateToProps = state => ({ reports: state.report.lost_report_list, reasons: state.reason.list,users: state.user.list, pagination: state.report.pagination });
const mapDispatchToProps = {
  getLostReports,getAllReasons,getAllUsers
};
export default connect(mapStateToProps,mapDispatchToProps)(Reports);
