import React, { Component } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Form } from "react-bootstrap";
import Layout from "./layout";
import { Helmet } from "react-helmet-async";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  addStage,
  getStages,
  deleteStage,
  changeStagePosition,
  updateStage,
  changeFieldPosition,
} from "../redux/actions/stage";
import {
  addOrganisation,
  getOrganisation,
  getOrganisations,
  deleteOrganisation,
  updateOrganisation,
} from "../redux/actions/organisation";
import {
  addContact,
  getContacts,
  deleteContact,
  updateContact,
} from "../redux/actions/contact";
import {
  addDeal,
  getDeals,
  deleteDeal,
  updateDeal,
} from "../redux/actions/deal";
import { getAllCountries } from "../redux/actions/country";
import { getAllIndustries } from "../redux/actions/industry";
import { getAllClusters } from "../redux/actions/cluster";
import { connect } from "react-redux";
// import CreatableSelect from 'react-select/creatable';
import Select from "react-select";
import { fieldTypes, deal_status } from "../utils/helpers";

const groupStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};
const groupBadgeStyles = {
  backgroundColor: "#EBECF0",
  borderRadius: "2em",
  color: "#172B4D",
  display: "inline-block",
  fontSize: 12,
  fontWeight: "normal",
  lineHeight: "1",
  minWidth: 1,
  padding: "0.16666666666667em 0.5em",
  textAlign: "center",
};
const formatGroupLabel = (data) => (
  <div style={groupStyles}>
    <span>{data.label}</span>
    <span style={groupBadgeStyles}>{data.options.length}</span>
  </div>
);
const grid = 8;
const getItemStyle = (isDragging, draggableStyle) => ({
  // some basic styles to make the items look a bit nicer
  userSelect: "none",
  padding: grid * 2,
  margin: `0 ${grid}px 0 0`,
  border: "solid 1px #f5ecec",
  borderRadius: "5px",
  // change background colour if dragging
  background: isDragging ? "#27dcee" : "transparent",
  minWidth: "230px",
  // styles we need to apply on draggables
  ...draggableStyle,
});
const stageMain = {
  display: "flex",
  padding: "8px",
  overflow: "auto",
};

const getTableRowStyle = (isDragging, draggableStyle) => ({
  // change background colour if dragging
  background: isDragging ? "#27dcee" : "transparent",
  // styles we need to apply on draggables
  ...draggableStyle,
});
class Configuration extends Component {
  constructor(props) {
    super(props);

    this.handleInputChange = this.handleInputChange.bind(this);
    this.onStageSubmit = this.onStageSubmit.bind(this);
    this.onOrgSubmit = this.onOrgSubmit.bind(this);
    this.onContactSubmit = this.onContactSubmit.bind(this);
    this.onDealSubmit = this.onDealSubmit.bind(this);
    this.handleSelectChange = this.handleSelectChange.bind(this);
    this.handleSelectChange2 = this.handleSelectChange2.bind(this);
    this.handleSelectChange3 = this.handleSelectChange3.bind(this);
    this.editStage = this.editStage.bind(this);
    this.handleOrgEdit = this.handleOrgEdit.bind(this);
    this.handleContactEdit = this.handleContactEdit.bind(this);
    this.handleDealEdit = this.handleDealEdit.bind(this);

    this.state = {
      stages: this.props.stages,

      stagesModal: false,
      organizationModal: false,
      contactModal: false,
      dealModal: false,

      organizationEditModal: false,
      contactEditModal: false,
      dealEditModal: false,

      organizationDeleteModal: false,
      contactDeleteModal: false,
      dealDeleteModal: false,
      stageDeleteModal: false,

      errors: {},
      groupedOptions: [],
      stage_title: "",
      stage_color: "",
      selectedId: "",

      org_column: "",
      org_editable: false,
      org_sortable: false,
      org_filterable: false,
      org_required: false,
      org_position: this.props.organisations.length + 1,
      org_type: "Text",
      org_values: [],

      contact_column: "",
      contact_editable: false,
      contact_sortable: false,
      contact_filterable: false,
      contact_required: false,
      contact_position: this.props.contacts.length + 1,
      contact_type: "Text",
      contact_values: [],

      deal_column: "",
      deal_editable: false,
      deal_sortable: false,
      deal_filterable: false,
      deal_required: false,
      deal_position: this.props.deals.length + 1,
      deal_type: "Text",
      deal_values: [],
    };
  }

  componentDidMount = async () => {
    await this.props.getStages();
    await this.props.getOrganisations();
    await this.props.getContacts();
    await this.props.getDeals();
    await this.props.getAllCountries();
    await this.props.getAllIndustries();
    await this.props.getAllClusters();

    let stages = [];
    for (let i = 0; i < this.props.stages.length; i++) {
      let data = this.props.stages[i];
      stages = stages.concat({
        value: data["_id"],
        label: data["name"],
        color: data["color"],
        ref: "stage",
      });
    }

    let countries = [];
    for (let i = 0; i < this.props.countries.length; i++) {
      let data = this.props.countries[i];
      countries = countries.concat({
        value: data["_id"],
        label: data["title"],
        ref: "country",
      });
    }

    let industries = [];
    for (let i = 0; i < this.props.industries.length; i++) {
      let data = this.props.industries[i];
      industries = industries.concat({
        value: data["_id"],
        label: data["title"],
        ref: "industry",
      });
    }

    let clusters = [];
    for (let i = 0; i < this.props.clusters.length; i++) {
      let data = this.props.clusters[i];
      clusters = clusters.concat({
        value: data["_id"],
        label: data["title"],
        ref: "cluster",
      });
    }

    this.setState({
      groupedOptions: [
        {
          label: "Stages",
          options: stages,
        },
        {
          label: "Countries",
          options: countries,
        },
        {
          label: "Industries",
          options: industries,
        },
        {
          label: "Clusters",
          options: clusters,
        },
        {
          label: "Deal Status",
          options: deal_status,
        },
        {
          label: "Tables",
          options: [
            {
              value: "Organizations",
              label: "Organizations",
              ref: "organization",
            },
            {
              value: "Contacts",
              label: "Contacts",
              ref: "contact",
            },
            {
              value: "Users",
              label: "Users",
              ref: "user",
            },
          ],
        },
      ],
      selectedId: "",
    });
  };

  handleOnDragEnd(result) {
    // const { stages } = this.state;
    if (!result.destination || result.source.index === result.destination.index)
      return;

    var formData = {
      stage: result.draggableId,
      last_position: result.source.index,
      current_position: result.destination.index,
    };

    const config = {
      headers: {
        "content-type": "application/json",
      },
    };
    this.props.changeStagePosition(formData, config, this.props);
  }

  // Stage Submit
  onStageSubmit = (e) => {
    e.preventDefault();

    if (this.validateStageForm()) {
      var current_user = this.props.auth_user ? this.props.auth_user._id : "";
      const { stage_title, stage_color } = this.state;

      var formData = {
        user: current_user,
        name: stage_title,
        color: stage_color,
        position: this.props.stages.length + 1,
      };

      const config = {
        headers: {
          "content-type": "application/json",
        },
      };
      this.props.addStage(formData, config, this.props);
      this.setState({
        stagesModal: false,
        stage_title: "",
        stage_color: "",
      });
    }
  };

  handleInputChange(event) {
    const { type, name, value, checked } = event.target;
    console.log(
      `type:${type}, name:${name}, value:${value}, checked:${checked} `
    );
    if (type === "checkbox") {
      this.setState({
        [name]: checked,
      });
    } else {
      this.setState({
        [name]: value,
      });
    }
  }

  validateStageForm() {
    const { stage_title, stage_color } = this.state;

    let errors = {};
    let formIsValid = true;

    if (!stage_title.trim()) {
      formIsValid = false;
      errors["stage_title"] = "*Please enter stage title.";
    }

    if (!stage_color.trim()) {
      formIsValid = false;
      errors["stage_color"] = "*Please choose stage color.";
    }

    this.setState({
      errors: errors,
    });
    return formIsValid;
  }

  handleStageDelete = (id) => (e) => {
    this.setState({ stageDeleteModal: true, selectedId: id });
  };
  closeStageDeleteModal = (e) => {
    this.setState({ stageDeleteModal: false });
  };
  openStageDeleteMoal = (e) => {
    this.setState({ stageDeleteModal: true });
  };
  confirmStageDelete = (e) => {
    this.props.deleteStage(this.state.selectedId, this.props);
    this.setState({ stageDeleteModal: false, selectedId: "" });
  };

  // Org Submit
  onOrgSubmit = (e) => {
    e.preventDefault();

    if (this.validateOrgForm()) {
      var current_user = this.props.auth_user ? this.props.auth_user._id : "";
      const {
        org_column,
        org_editable,
        org_sortable,
        org_filterable,
        org_required,
        org_position,
        org_type,
        org_values,
      } = this.state;

      var formData = {
        user: current_user,
        table_name: "Organization",
        slug_name: "org",
        column_name: org_column.trim(),
        column_type: org_type,
        is_editable: org_editable,
        is_sortable: org_sortable,
        is_filterable: org_filterable,
        is_required: org_required,
        position: org_position,
        values: org_values,
      };

      console.log("formData:", formData);

      const config = {
        headers: {
          "content-type": "application/json",
        },
      };

      this.props.addOrganisation(formData, config, this.props);
      this.setState({
        organizationModal: false,
        org_column: "",
        org_editable: false,
        org_sortable: false,
        org_filterable: false,
        org_required: false,
        org_position: this.props.organisations.length + 1,
        org_type: "Text",
        org_values: [],
      });
    }
  };

  validateOrgForm() {
    const { org_column, org_type, org_values } = this.state;

    let errors = {};
    let formIsValid = true;

    if (!org_column.trim()) {
      formIsValid = false;
      errors["org_column"] = "*Please enter column.";
    }

    if (
      org_values &&
      org_values.length === 0 &&
      ["choice", "inherit"].includes(org_type.toLocaleLowerCase())
    ) {
      formIsValid = false;
      errors["org_values"] = "*Please type value for this field type.";
    }

    this.setState({
      errors: errors,
    });
    return formIsValid;
  }

  handleSelectChange(event) {
    console.log("handleInputChange:", event);
    let values = [];
    for (let i = 0; i < event.length; i++) {
      let data = event[i];
      values.push({ value: data.value, ref: data.ref });
    }
    this.setState({
      org_values: values,
    });
  }

  handleOrgDelete = (id) => (e) => {
    this.setState({ organizationDeleteModal: true, selectedId: id });
  };

  closeOrgDeleteModal = (e) => {
    this.setState({ organizationDeleteModal: false });
  };

  openOrgDeleteMoal = (e) => {
    this.setState({ organizationDeleteModal: true });
  };

  confirmOrgDelete = (e) => {
    this.props.deleteOrganisation(this.state.selectedId, this.props);
    this.setState({ organizationDeleteModal: false, selectedId: "" });
  };

  // Contact Submit
  onContactSubmit = (e) => {
    e.preventDefault();

    if (this.validateContactForm()) {
      var current_user = this.props.auth_user ? this.props.auth_user._id : "";
      const {
        contact_column,
        contact_editable,
        contact_sortable,
        contact_filterable,
        contact_required,
        contact_position,
        contact_type,
        contact_values,
      } = this.state;

      var formData = {
        user: current_user,
        table_name: "Contact",
        slug_name: "contact",
        column_name: contact_column.trim(),
        column_type: contact_type,
        is_editable: contact_editable,
        is_sortable: contact_sortable,
        is_filterable: contact_filterable,
        is_required: contact_required,
        position: contact_position,
        values: contact_values,
      };

      console.log("formData:", formData);

      const config = {
        headers: {
          "content-type": "application/json",
        },
      };
      this.props.addContact(formData, config, this.props);
      this.setState({
        contactModal: false,
        contact_column: "",
        contact_editable: false,
        contact_sortable: false,
        contact_filterable: false,
        contact_required: false,
        contact_position: this.props.contacts.length + 1,
        contact_type: "Text",
        contact_values: [],
      });
    }
  };

  validateContactForm() {
    const { contact_column, contact_type, contact_values } = this.state;

    let errors = {};
    let formIsValid = true;

    if (!contact_column.trim()) {
      formIsValid = false;
      errors["contact_column"] = "*Please enter column.";
    }

    if (
      contact_values &&
      contact_values.length === 0 &&
      ["choice", "inherit"].includes(contact_type.toLocaleLowerCase())
    ) {
      formIsValid = false;
      errors["contact_values"] = "*Please type value for this field type.";
    }

    this.setState({
      errors: errors,
    });
    return formIsValid;
  }

  handleSelectChange2(event) {
    console.log("handleInputChange2:", event);
    let values = [];
    for (let i = 0; i < event.length; i++) {
      let data = event[i];
      values.push({ value: data.value, ref: data.ref });
    }
    this.setState({
      contact_values: values,
    });
  }

  handleContactDelete = (id) => (e) => {
    this.setState({ contactDeleteModal: true, selectedId: id });
  };

  closeContactDeleteModal = (e) => {
    this.setState({ contactDeleteModal: false });
  };

  openContactDeleteMoal = (e) => {
    this.setState({ contactDeleteModal: true });
  };

  confirmContactDelete = (e) => {
    this.props.deleteContact(this.state.selectedId, this.props);
    this.setState({ contactDeleteModal: false, selectedId: "" });
  };

  // Deal Submit
  onDealSubmit = (e) => {
    e.preventDefault();

    if (this.validateDealForm()) {
      var current_user = this.props.auth_user ? this.props.auth_user._id : "";
      const {
        deal_column,
        deal_editable,
        deal_sortable,
        deal_filterable,
        deal_required,
        deal_position,
        deal_type,
        deal_values,
      } = this.state;

      var formData = {
        user: current_user,
        table_name: "Deal",
        slug_name: "deal",
        column_name: deal_column.trim(),
        column_type: deal_type,
        is_editable: deal_editable,
        is_sortable: deal_sortable,
        is_filterable: deal_filterable,
        is_required: deal_required,
        position: deal_position,
        values: deal_values,
      };

      console.log("formData:", formData);

      const config = {
        headers: {
          "content-type": "application/json",
        },
      };
      this.props.addDeal(formData, config, this.props);
      this.setState({
        dealModal: false,
        deal_column: "",
        deal_editable: false,
        deal_sortable: false,
        deal_filterable: false,
        deal_required: false,
        deal_position: this.props.deals.length + 1,
        deal_type: "Text",
        deal_values: [],
      });
    }
  };

  validateDealForm() {
    const { deal_column, deal_type, deal_values } = this.state;

    let errors = {};
    let formIsValid = true;

    if (!deal_column.trim()) {
      formIsValid = false;
      errors["deal_column"] = "*Please enter column.";
    }

    if (
      deal_values &&
      deal_values.length === 0 &&
      ["choice", "inherit"].includes(deal_type.toLocaleLowerCase())
    ) {
      formIsValid = false;
      errors["deal_values"] = "*Please type value for this field type.";
    }

    this.setState({
      errors: errors,
    });
    return formIsValid;
  }

  handleSelectChange3(event) {
    console.log("handleInputChange3:", event);
    let values = [];
    for (let i = 0; i < event.length; i++) {
      let data = event[i];
      values.push({ value: data.value, ref: data.ref });
    }
    this.setState({
      deal_values: values,
    });
  }

  handleDealDelete = (id, slug) => (e) => {
    this.setState({ dealDeleteModal: true, selectedId: id });
  };
  closeDealDeleteModal = (e) => {
    this.setState({ dealDeleteModal: false });
  };
  openDealDeleteMoal = (e) => {
    this.setState({ dealDeleteModal: true });
  };
  confirmDealDelete = (e) => {
    this.props.deleteDeal(this.state.selectedId, this.props);
    this.setState({ dealDeleteModal: false, selectedId: "" });
  };

  editStage = (id, old_data) => (event) => {
    // console.log(`id :${id} | name : ${event.target.name} | value : ${event.target.value} | old_data : ${name}`);
    let { type, name, value, checked } = event.target;
    console.log(
      `type:${type}, name:${name}, value:${value}, checked:${checked} `
    );

    if (!value.trim()) {
      event.target.value = old_data;
      value = old_data;
    }

    this.setState({
      [name]: value,
      selectedId: id,
    });
  };

  updateStageWith = (e) => {
    console.log("updateStageWith");
    const { selectedId, stage_title, stage_color } = this.state;
    console.log(
      `selectedId : ${selectedId} | stage_title : ${stage_title} | stage_color : ${stage_color}`
    );

    if (selectedId && (stage_title || stage_color)) {
      var current_user = this.props.auth_user ? this.props.auth_user._id : "";
      var formData = {
        user: current_user,
        stage: selectedId,
        name: stage_title,
        color: stage_color,
      };
      const config = {
        headers: {
          "content-type": "application/json",
        },
      };
      this.props.updateStage(formData, config, this.props);
    }
  };

  // Edit Organization
  handleOrgEdit = (org) => async (e) => {
    this.setState({
      org_column: org.column_name,
      org_editable: org.is_editable,
      org_sortable: org.is_sortable,
      org_filterable: org.is_filterable,
      org_required: org.is_required,
      org_position: org.position,
      org_type: org.column_type,
      org_values: org.values,
      organizationEditModal: true,
      selectedId: org._id,
    });
  };

  // Update Org
  onOrgEditSubmit = (e) => {
    e.preventDefault();

    if (this.validateOrgForm()) {
      var current_user = this.props.auth_user ? this.props.auth_user._id : "";
      const {
        org_column,
        org_editable,
        org_sortable,
        org_filterable,
        org_required,
        org_position,
        org_type,
        org_values,
        selectedId,
      } = this.state;

      var formData = {
        user: current_user,
        table_name: "Organization",
        slug_name: "org",
        column_name: org_column.trim(),
        column_type: org_type,
        is_editable: org_editable,
        is_sortable: org_sortable,
        is_filterable: org_filterable,
        is_required: org_required,
        position: org_position,
        values: org_values,
        _id: selectedId,
      };

      console.log("formData:", formData);

      const config = {
        headers: {
          "content-type": "application/json",
        },
      };

      this.props.updateOrganisation(formData, config, this.props);
      this.setState({
        organizationEditModal: false,
        org_column: "",
        org_editable: false,
        org_sortable: false,
        org_filterable: false,
        org_required: false,
        org_position: this.props.organisations.length + 1,
        org_type: "Text",
        org_values: [],
        selectedId: "",
      });
    }
  };

  // Edit Contact
  handleContactEdit = (contact) => async (e) => {
    this.setState({
      contact_column: contact.column_name,
      contact_editable: contact.is_editable,
      contact_sortable: contact.is_sortable,
      contact_filterable: contact.is_filterable,
      contact_required: contact.is_required,
      contact_position: contact.position,
      contact_type: contact.column_type,
      contact_values: contact.values,
      contactEditModal: true,
      selectedId: contact._id,
    });
  };

  // Update Contact
  onContactEditSubmit = (e) => {
    e.preventDefault();
    if (this.validateContactForm()) {
      var current_user = this.props.auth_user ? this.props.auth_user._id : "";
      const {
        contact_column,
        contact_editable,
        contact_sortable,
        contact_filterable,
        contact_required,
        contact_position,
        contact_type,
        contact_values,
        selectedId,
      } = this.state;

      var formData = {
        user: current_user,
        table_name: "Contact",
        slug_name: "contact",
        column_name: contact_column.trim(),
        column_type: contact_type,
        is_editable: contact_editable,
        is_sortable: contact_sortable,
        is_filterable: contact_filterable,
        is_required: contact_required,
        position: contact_position,
        values: contact_values,
        _id: selectedId,
      };

      console.log("formData:", formData);

      const config = {
        headers: {
          "content-type": "application/json",
        },
      };

      this.props.updateContact(formData, config, this.props);
      this.setState({
        contactEditModal: false,
        contact_column: "",
        contact_editable: false,
        contact_sortable: false,
        contact_filterable: false,
        contact_required: false,
        contact_position: this.props.contacts.length + 1,
        contact_type: "Text",
        contact_values: [],
        selectedId: "",
      });
    }
  };

  // Edit Deal
  handleDealEdit = (deal) => async (e) => {
    this.setState({
      deal_column: deal.column_name,
      deal_editable: deal.is_editable,
      deal_sortable: deal.is_sortable,
      deal_filterable: deal.is_filterable,
      deal_required: deal.is_required,
      deal_position: deal.position,
      deal_type: deal.column_type,
      deal_values: deal.values,
      dealEditModal: true,
      selectedId: deal._id,
    });
  };

  // Update Deal
  onDealEditSubmit = (e) => {
    e.preventDefault();
    if (this.validateDealForm()) {
      var current_user = this.props.auth_user ? this.props.auth_user._id : "";
      const {
        deal_column,
        deal_editable,
        deal_sortable,
        deal_filterable,
        deal_required,
        deal_position,
        deal_type,
        deal_values,
        selectedId,
      } = this.state;

      var formData = {
        user: current_user,
        table_name: "Deal",
        slug_name: "deal",
        column_name: deal_column.trim(),
        column_type: deal_type,
        is_editable: deal_editable,
        is_sortable: deal_sortable,
        is_filterable: deal_filterable,
        is_required: deal_required,
        position: deal_position,
        values: deal_values,
        _id: selectedId,
      };

      console.log("formData:", formData);

      const config = {
        headers: {
          "content-type": "application/json",
        },
      };

      this.props.updateDeal(formData, config, this.props);
      this.setState({
        dealEditModal: false,
        deal_column: "",
        deal_editable: false,
        deal_sortable: false,
        deal_filterable: false,
        deal_required: false,
        deal_position: this.props.deals.length + 1,
        deal_type: "Text",
        deal_values: [],
        selectedId: "",
      });
    }
  };

  handleOnDragEnd_2 = async (result) => {
    if (!result.destination || result.source.index === result.destination.index)
      return;
    console.log("handleOnDragEnd_2s:", result);
    let changedFrom = result.source.droppableId;
    var formData = {
      fieldId: result.draggableId,
      last_position: result.source.index,
      current_position: result.destination.index,
      slug_name:(changedFrom == 'org_table') ? "org" : ((changedFrom == 'contact_table') ? "contact" : ((changedFrom == 'deal_table') ? "deal" : "")),
    };
    const config = {
      headers: {
        "content-type": "application/json",
      },
    };
    console.log("formData:", formData, " config:", config);
    await this.props.changeFieldPosition(formData, config, this.props);
    if (changedFrom == "org_table") {
      await this.props.getOrganisations();
    } else if (changedFrom == "contact_table") {
      await this.props.getContacts();
    } else if (changedFrom == "deal_table") {
      await this.props.getDeals();
    }
  };

  render() {
    const {
      stage_title,
      stage_color,
      org_column,
      org_position,
      contact_column,
      contact_position,
      deal_column,
      deal_position,
    } = this.state;
    return (
      <>
        <Helmet>
          <title>Configuration</title>
        </Helmet>
        <Layout title="Fields Setting">
          <div className="container-fluid">
            {/* Page Heading */}
            {/* Content Row */}
            <div className="row">
              <div className="col-lg-12">
                {/* Overflow Hidden */}
                <div className="card shadow mb-4">
                  <div className="card-header py-3">
                    <h6 className="m-0 font-weight-bold text-primary">
                      Sales Board
                    </h6>
                  </div>

                  <DragDropContext onDragEnd={this.handleOnDragEnd.bind(this)}>
                    <div className="card-body stageCard">
                      <Droppable droppableId="droppable" direction="horizontal">
                        {(provided) => (
                          <div
                            // className="row"
                            style={stageMain}
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                          >
                            {this.props.stages.map(
                              ({ _id, name, color, position }, index) => (
                                <Draggable
                                  key={_id}
                                  draggableId={_id}
                                  index={position}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      className="col-lg-2 col-sm-4 col-xs-12 mb-3"
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      style={getItemStyle(
                                        snapshot.isDragging,
                                        provided.draggableProps.style
                                      )}
                                    >
                                      <div className="sales-board-stage-card-title mb-2">
                                        Stage {index + 1}
                                        <i
                                          className="fa fa-trash float-right"
                                          style={{
                                            cursor: "pointer",
                                            color: "red",
                                            position: "relative",
                                            top: "6px",
                                          }}
                                          onClick={this.handleStageDelete(_id)}
                                        />
                                      </div>
                                      <div className="card border-bottom-secondary">
                                        <div className="card-body sales-board-stage-card-body">
                                          <div className="row no-gutters align-items-center">
                                            <form className="w-100">
                                              <div className="mb-2">
                                                <label
                                                  htmlFor=""
                                                  className="form-label"
                                                >
                                                  Name
                                                </label>
                                                <input
                                                  type="text"
                                                  className="form-control height-30px"
                                                  defaultValue={name}
                                                  name="stage_title"
                                                  onBlur={this.updateStageWith.bind(
                                                    this
                                                  )}
                                                  onChange={this.editStage(
                                                    _id,
                                                    name
                                                  )}
                                                />
                                              </div>
                                              <div className="mb-2">
                                                <label
                                                  htmlFor=""
                                                  className="form-label"
                                                >
                                                  Color
                                                </label>
                                                <input
                                                  type="color"
                                                  className="form-control height-30px"
                                                  defaultValue={color}
                                                  name="stage_color"
                                                  onBlur={this.updateStageWith.bind(
                                                    this
                                                  )}
                                                  onChange={this.editStage(
                                                    _id,
                                                    name
                                                  )}
                                                />
                                              </div>
                                            </form>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              )
                            )}
                            {provided.placeholder}
                            <div className="col-xl-2 col-md-4 mb-3">
                              <div
                                style={{ position: "relative", top: "18px" }}
                                className="sales-board-stage-card-title text-center"
                              >
                                Stage {this.props.stages.length + 1}
                              </div>
                              <div
                                style={{ marginTop: "50px", cursor: "pointer" }}
                                className="text-center"
                              >
                                <a
                                  onClick={(e) =>
                                    this.setState({ stagesModal: true })
                                  }
                                >
                                  <img
                                    style={{ height: "50px" }}
                                    className="rounded"
                                    src={`assets/img/plus_inside_circle_370092.png`}
                                    alt="user"
                                  />
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </DragDropContext>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-12">
                {/* Overflow Hidden */}
                <div className="card shadow mb-4">
                  <div className="card-header py-3">
                    <h6 className="m-0 font-weight-bold text-primary">
                      Organizations
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table
                        className="table table-bordered"
                        id="dataTable"
                        width="100%"
                        cellSpacing={0}
                      >
                        <thead>
                          <tr>
                            <th width="2%" />
                            <th>Column</th>
                            <th>Position</th>
                            <th>Editable</th>
                            <th>Sortable</th>
                            <th>Filterable</th>
                            <th>Required</th>
                            <th>Type</th>
                            <th>Values</th>
                            <th width="2%" />
                            <th width="2%" />
                          </tr>
                        </thead>
                        <DragDropContext
                          onDragEnd={this.handleOnDragEnd_2.bind(this)}
                        >
                          <Droppable droppableId="org_table">
                            {(provided) => (
                              <tbody
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                              >
                                {this.props.organisations &&
                                this.props.organisations.length > 0 ? (
                                  this.props.organisations.map(
                                    (organisation, index) => (
                                      <Draggable
                                        key={organisation._id}
                                        draggableId={organisation._id}
                                        index={organisation.position}
                                      >
                                        {(provided, snapshot) => (
                                          <tr
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={getTableRowStyle(
                                              snapshot.isDragging,
                                              provided.draggableProps.style
                                            )}
                                          >
                                            <td className="text-center">
                                              <label className="checkbox-label">
                                                <input
                                                  type="checkbox"
                                                  onChange={(e) =>
                                                    console.log(e)
                                                  }
                                                />
                                                <span className="geekmark" />
                                              </label>
                                            </td>
                                            <td style={{ width: "150px" }}>
                                              {organisation.column_name}
                                            </td>
                                            <td style={{ width: "150px" }}>
                                              {organisation.position}
                                            </td>
                                            <td style={{ width: "150px" }}>
                                              <label className="checkbox-label">
                                                <input
                                                  type="checkbox"
                                                  name="editable"
                                                  checked={
                                                    organisation.is_editable
                                                  }
                                                  onChange={() => {}}
                                                />
                                                <span className="geekmark" />
                                              </label>
                                            </td>
                                            <td style={{ width: "150px" }}>
                                              <label className="checkbox-label">
                                                <input
                                                  type="checkbox"
                                                  name="sortable"
                                                  checked={
                                                    organisation.is_sortable
                                                  }
                                                  onChange={() => {}}
                                                />
                                                <span className="geekmark" />
                                              </label>
                                            </td>
                                            <td style={{ width: "150px" }}>
                                              <label className="checkbox-label">
                                                <input
                                                  type="checkbox"
                                                  name="filterable"
                                                  checked={
                                                    organisation.is_filterable
                                                  }
                                                  onChange={() => {}}
                                                />
                                                <span className="geekmark" />
                                              </label>
                                            </td>
                                            <td style={{ width: "150px" }}>
                                              <label className="checkbox-label">
                                                <input
                                                  type="checkbox"
                                                  name="required"
                                                  checked={
                                                    organisation.is_required
                                                  }
                                                  onChange={() => {}}
                                                />
                                                <span className="geekmark" />
                                              </label>
                                            </td>
                                            <td style={{ width: "100px" }}>
                                              {organisation.column_type}
                                            </td>
                                            <td style={{ width: "300px" }}>
                                              {organisation.values &&
                                              organisation.values.length > 0
                                                ? organisation.values.map(
                                                    (value, index) =>
                                                      value["label"] +
                                                      (organisation.values
                                                        .length ===
                                                      index + 1
                                                        ? ""
                                                        : ", ")
                                                  )
                                                : null}
                                            </td>
                                            <td
                                              style={{ width: "30px" }}
                                              className="text-center"
                                            >
                                              <i
                                                onClick={this.handleOrgEdit(
                                                  organisation
                                                )}
                                                className="fa fa-edit"
                                                style={{
                                                  cursor: "pointer",
                                                  color: "blue",
                                                }}
                                              />
                                            </td>
                                            <td
                                              style={{ width: "30px" }}
                                              className="text-center"
                                            >
                                              <i
                                                onClick={this.handleOrgDelete(
                                                  organisation._id
                                                )}
                                                className="fa fa-trash"
                                                style={{
                                                  cursor: "pointer",
                                                  color: "red",
                                                }}
                                              />
                                            </td>
                                          </tr>
                                        )}
                                      </Draggable>
                                    )
                                  )
                                ) : (
                                  <tr>
                                    <td className="text-center" colSpan="10">
                                      No Records
                                    </td>
                                  </tr>
                                )}
                                {provided.placeholder}
                              </tbody>
                            )}
                          </Droppable>
                        </DragDropContext>
                      </table>
                    </div>
                    <div>
                      <a
                        onClick={(e) =>
                          this.setState({ organizationModal: true })
                        }
                      >
                        <img
                          style={{ height: "30px", cursor: "pointer" }}
                          className="rounded"
                          src={`assets/img/plus_inside_circle_370092.png`}
                          alt="user"
                        />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-12">
                {/* Overflow Hidden */}
                <div className="card shadow mb-4">
                  <div className="card-header py-3">
                    <h6 className="m-0 font-weight-bold text-primary">
                      Contacts
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table
                        className="table table-bordered"
                        id="dataTable"
                        width="100%"
                        cellSpacing={0}
                      >
                        <thead>
                          <tr>
                            <th width="2%" />
                            <th>Column</th>
                            <th>Position</th>
                            <th>Editable</th>
                            <th>Sortable</th>
                            <th>Filterable</th>
                            <th>Required</th>
                            <th>Type</th>
                            <th>Values</th>
                            <th width="2%" />
                            <th width="2%" />
                          </tr>
                        </thead>
                        <DragDropContext
                          onDragEnd={this.handleOnDragEnd_2.bind(this)}
                        >
                          <Droppable droppableId="contact_table">
                            {(provided) => (
                              <tbody
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                              >
                                {this.props.contacts &&
                                this.props.contacts.length > 0 ? (
                                  this.props.contacts.map((contact, index) => (
                                    <Draggable
                                      key={contact._id}
                                      draggableId={contact._id}
                                      index={contact.position}
                                    >
                                      {(provided, snapshot) => (
                                        <tr
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          style={getTableRowStyle(
                                            snapshot.isDragging,
                                            provided.draggableProps.style
                                          )}
                                        >
                                          <td className="text-center">
                                            <label className="checkbox-label">
                                              <input type="checkbox" />
                                              <span className="geekmark" />
                                            </label>
                                          </td>
                                          <td style={{ width: "150px" }}>
                                            {contact.column_name}
                                          </td>
                                          <td style={{ width: "150px" }}>
                                            {contact.position}
                                          </td>
                                          <td style={{ width: "150px" }}>
                                            <label className="checkbox-label">
                                              <input
                                                type="checkbox"
                                                name="editable"
                                                checked={contact.is_editable}
                                                onChange={() => {}}
                                              />
                                              <span className="geekmark" />
                                            </label>
                                          </td>
                                          <td style={{ width: "150px" }}>
                                            <label className="checkbox-label">
                                              <input
                                                type="checkbox"
                                                name="sortable"
                                                checked={contact.is_sortable}
                                                onChange={() => {}}
                                              />
                                              <span className="geekmark" />
                                            </label>
                                          </td>
                                          <td style={{ width: "150px" }}>
                                            <label className="checkbox-label">
                                              <input
                                                type="checkbox"
                                                name="filterable"
                                                checked={contact.is_filterable}
                                                onChange={() => {}}
                                              />
                                              <span className="geekmark" />
                                            </label>
                                          </td>
                                          <td style={{ width: "150px" }}>
                                            <label className="checkbox-label">
                                              <input
                                                type="checkbox"
                                                name="required"
                                                checked={contact.is_required}
                                                onChange={() => {}}
                                              />
                                              <span className="geekmark" />
                                            </label>
                                          </td>
                                          <td style={{ width: "100px" }}>
                                            {contact.column_type}
                                          </td>
                                          <td style={{ width: "300px" }}>
                                            {contact.values &&
                                            contact.values.length > 0
                                              ? contact.values.map(
                                                  (value, index) =>
                                                    value["label"] +
                                                    (contact.values.length ===
                                                    index + 1
                                                      ? ""
                                                      : ", ")
                                                )
                                              : null}
                                          </td>

                                          <td
                                            style={{ width: "30px" }}
                                            className="text-center"
                                          >
                                            <i
                                              onClick={this.handleContactEdit(
                                                contact
                                              )}
                                              className="fa fa-edit"
                                              style={{
                                                cursor: "pointer",
                                                color: "blue",
                                              }}
                                            />
                                          </td>
                                          <td
                                            style={{ width: "30px" }}
                                            className="text-center"
                                          >
                                            <i
                                              onClick={this.handleContactDelete(
                                                contact._id,
                                                contact.slug
                                              )}
                                              className="fa fa-trash"
                                              style={{
                                                cursor: "pointer",
                                                color: "red",
                                              }}
                                            />
                                          </td>
                                        </tr>
                                      )}
                                    </Draggable>
                                  ))
                                ) : (
                                  <tr>
                                    <td className="text-center" colSpan="10">
                                      No Records
                                    </td>
                                  </tr>
                                )}
                                {provided.placeholder}
                              </tbody>
                            )}
                          </Droppable>
                        </DragDropContext>
                      </table>
                    </div>
                    <div>
                      <a onClick={(e) => this.setState({ contactModal: true })}>
                        <img
                          style={{ height: "30px", cursor: "pointer" }}
                          className="rounded"
                          src={`assets/img/plus_inside_circle_370092.png`}
                          alt="user"
                        />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-lg-12">
                <div className="card shadow mb-4">
                  <div className="card-header py-3">
                    <h6 className="m-0 font-weight-bold text-primary">Deals</h6>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table
                        className="table table-bordered"
                        id="dataTable"
                        width="100%"
                        cellSpacing={0}
                      >
                        <thead>
                          <tr>
                            <th width="2%" />
                            <th>Column</th>
                            <th>Position</th>
                            <th>Editable</th>
                            <th>Sortable</th>
                            <th>Filterable</th>
                            <th>Required</th>
                            <th>Type</th>
                            <th>Values</th>
                            <th width="2%" />
                            <th width="2%" />
                          </tr>
                        </thead>
                        <DragDropContext
                          onDragEnd={this.handleOnDragEnd_2.bind(this)}
                        >
                          <Droppable droppableId="deal_table">
                            {(provided) => (
                              <tbody
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                              >
                                {this.props.deals &&
                                this.props.deals.length > 0 ? (
                                  this.props.deals.map((deal, index) => (
                                    <Draggable
                                      key={deal._id}
                                      draggableId={deal._id}
                                      index={deal.position}
                                    >
                                      {(provided, snapshot) => (
                                        <tr
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          style={getTableRowStyle(
                                            snapshot.isDragging,
                                            provided.draggableProps.style
                                          )}
                                        >
                                          <td className="text-center">
                                            <label className="checkbox-label">
                                              <input type="checkbox" />
                                              <span className="geekmark" />
                                            </label>
                                          </td>
                                          <td style={{ width: "150px" }}>
                                            {deal.column_name}
                                          </td>
                                          <td style={{ width: "150px" }}>
                                            {deal.position}
                                          </td>
                                          <td style={{ width: "150px" }}>
                                            <label className="checkbox-label">
                                              <input
                                                type="checkbox"
                                                name="editable"
                                                checked={deal.is_editable}
                                                onChange={() => {}}
                                              />
                                              <span className="geekmark" />
                                            </label>
                                          </td>
                                          <td style={{ width: "150px" }}>
                                            <label className="checkbox-label">
                                              <input
                                                type="checkbox"
                                                name="sortable"
                                                checked={deal.is_sortable}
                                                onChange={() => {}}
                                              />
                                              <span className="geekmark" />
                                            </label>
                                          </td>
                                          <td style={{ width: "150px" }}>
                                            <label className="checkbox-label">
                                              <input
                                                type="checkbox"
                                                name="filterable"
                                                checked={deal.is_filterable}
                                                onChange={() => {}}
                                              />
                                              <span className="geekmark" />
                                            </label>
                                          </td>
                                          <td style={{ width: "150px" }}>
                                            <label className="checkbox-label">
                                              <input
                                                type="checkbox"
                                                name="required"
                                                checked={deal.is_required}
                                                onChange={() => {}}
                                              />
                                              <span className="geekmark" />
                                            </label>
                                          </td>
                                          <td style={{ width: "100px" }}>
                                            {deal.column_type}
                                          </td>
                                          <td style={{ width: "300px" }}>
                                            {deal.values &&
                                            deal.values.length > 0
                                              ? deal.values.map(
                                                  (value, index) =>
                                                    value["label"] +
                                                    (deal.values.length ===
                                                    index + 1
                                                      ? ""
                                                      : ", ")
                                                )
                                              : null}
                                          </td>
                                          <td
                                            style={{ width: "30px" }}
                                            className="text-center"
                                          >
                                            <i
                                              onClick={this.handleDealEdit(
                                                deal
                                              )}
                                              className="fa fa-edit"
                                              style={{
                                                cursor: "pointer",
                                                color: "blue",
                                              }}
                                            />
                                          </td>
                                          <td
                                            style={{ width: "30px" }}
                                            className="text-center"
                                          >
                                            <i
                                              onClick={this.handleDealDelete(
                                                deal._id,
                                                deal.slug
                                              )}
                                              className="fa fa-trash"
                                              style={{
                                                cursor: "pointer",
                                                color: "red",
                                              }}
                                            />
                                          </td>
                                        </tr>
                                      )}
                                    </Draggable>
                                  ))
                                ) : (
                                  <tr>
                                    <td className="text-center" colSpan="10">
                                      No Records
                                    </td>
                                  </tr>
                                )}
                                {provided.placeholder}
                              </tbody>
                            )}
                          </Droppable>
                        </DragDropContext>
                      </table>
                    </div>
                    <div>
                      <a onClick={(e) => this.setState({ dealModal: true })}>
                        <img
                          style={{ height: "30px", cursor: "pointer" }}
                          className="rounded"
                          src={`assets/img/plus_inside_circle_370092.png`}
                          alt="user"
                        />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Stage Modal */}
          <Modal
            show={this.state.stageDeleteModal}
            onHide={this.closeStageDeleteModal}
            centered
            aria-labelledby="contained-modal-title-vcenter"
            size="sm"
          >
            <Modal.Body>
              <div className="delete-popup">
                <div
                  className="close-icon"
                  onClick={this.closeStageDeleteModal}
                >
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
                    onClick={this.confirmStageDelete}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </Modal.Body>
          </Modal>
          {/* Delete Org Modal */}
          <Modal
            show={this.state.organizationDeleteModal}
            onHide={this.closeOrgDeleteModal}
            centered
            aria-labelledby="contained-modal-title-vcenter"
            size="sm"
          >
            <Modal.Body>
              <div className="delete-popup">
                <div className="close-icon" onClick={this.closeOrgDeleteModal}>
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
                    onClick={this.confirmOrgDelete}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </Modal.Body>
          </Modal>
          {/* Delete Contact Modal */}
          <Modal
            show={this.state.contactDeleteModal}
            onHide={this.closeContactDeleteModal}
            centered
            aria-labelledby="contained-modal-title-vcenter"
            size="sm"
          >
            <Modal.Body>
              <div className="delete-popup">
                <div
                  className="close-icon"
                  onClick={this.closeContactDeleteModal}
                >
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
                    onClick={this.confirmContactDelete}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </Modal.Body>
          </Modal>

          {/* Delete Deal Modal */}
          <Modal
            show={this.state.dealDeleteModal}
            onHide={this.closeDealDeleteModal}
            centered
            aria-labelledby="contained-modal-title-vcenter"
            size="sm"
          >
            <Modal.Body>
              <div className="delete-popup">
                <div className="close-icon" onClick={this.closeDealDeleteModal}>
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
                    onClick={this.confirmDealDelete}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </Modal.Body>
          </Modal>

          {/* Stage Modal */}
          <Modal
            show={this.state.stagesModal}
            onHide={(e) =>
              this.setState({
                stagesModal: false,
                errors: {},
                stage_title: "",
                stage_color: "",
              })
            }
            centered
            aria-labelledby="contained-modal-title-vcenter"
            size="md"
          >
            <form className="w-100" onSubmit={this.onStageSubmit}>
              <Modal.Header closebutton="true">
                <Modal.Title>New Stage</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <div className="mb-2">
                  <label htmlFor="" className="form-label">
                    Name
                  </label>
                  <input
                    type="text"
                    className="form-control height-30px"
                    name="stage_title"
                    onChange={this.handleInputChange}
                    value={stage_title}
                  />
                  <div className="text-danger">
                    {this.state.errors.stage_title}
                  </div>
                </div>
                <div className="mb-2">
                  <label htmlFor="" className="form-label">
                    Color
                  </label>
                  <input
                    type="color"
                    className="form-control height-30px"
                    name="stage_color"
                    onChange={this.handleInputChange}
                    value={stage_color}
                  />
                  <div className="text-danger">
                    {this.state.errors.stage_color}
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <button className="btn btn-md btn-primary mr-1">Save</button>
                <button
                  type="button"
                  className="btn btn-md btn-secondary"
                  onClick={(e) =>
                    this.setState({ stagesModal: false, errors: {} })
                  }
                >
                  Close
                </button>
              </Modal.Footer>
            </form>
          </Modal>

          {/* Organisation Modal */}
          <Modal
            show={this.state.organizationModal}
            onHide={(e) =>
              this.setState({
                organizationModal: false,
                errors: {},
                org_column: "",
                org_editable: false,
                org_sortable: false,
                org_filterable: false,
                org_required: false,
                org_position: this.props.organisations.length + 1,
                org_type: "Text",
                org_values: [],
              })
            }
            centered
            aria-labelledby="contained-modal-title-vcenter"
            size="md"
          >
            <form className="w-100" onSubmit={this.onOrgSubmit}>
              <Modal.Header closebutton="true">
                <Modal.Title>Add Organisation Field </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Group controlId="Column">
                  <Form.Label>Column</Form.Label>
                  <Form.Control
                    type="text"
                    className="height-30px"
                    name="org_column"
                    onChange={this.handleInputChange}
                    value={org_column}
                  />
                  <div className="text-danger">
                    {this.state.errors.org_column}
                  </div>
                </Form.Group>

                <Form.Group controlId="Position">
                  <Form.Label>Position</Form.Label>
                  <Form.Control
                    type="number"
                    className="height-30px"
                    name="org_position"
                    onChange={this.handleInputChange}
                    value={org_position}
                  />
                  <div className="text-danger">
                    {this.state.errors.org_position}
                  </div>
                </Form.Group>

                <Form.Group controlId="Editable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="org_editable"
                      value="editable"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Editable
                  </label>
                </Form.Group>

                <Form.Group controlId="Sortable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="org_sortable"
                      value="sortable"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Sortable
                  </label>
                </Form.Group>

                <Form.Group controlId="Filterable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="org_filterable"
                      value="filterable"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Filterable
                  </label>
                </Form.Group>

                <Form.Group controlId="Required">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="org_required"
                      value="required"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Required
                  </label>
                </Form.Group>

                <Form.Group controlId="optionType">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    as="select"
                    size="sm"
                    name="org_type"
                    onChange={this.handleInputChange}
                  >
                    {fieldTypes && fieldTypes.length > 0
                      ? fieldTypes.map(({ label, value }, index) => (
                          <option key={index} value={value}>
                            {label}
                          </option>
                        ))
                      : null}
                  </Form.Control>
                </Form.Group>

                <Form.Group controlId="Values">
                  <Form.Label>Values</Form.Label>
                  {/* <Form.Control type="text" className="height-30px" /> */}
                  <Select
                    isMulti
                    // defaultValue={colourOptions[1]}
                    options={this.state.groupedOptions}
                    formatGroupLabel={formatGroupLabel}
                    onChange={this.handleSelectChange}
                    name="org_values"
                  />
                  <div className="text-danger">
                    {this.state.errors.org_values}
                  </div>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <button className="btn btn-md btn-primary  mr-1">Save</button>
                <button
                  type="button"
                  className="btn btn-md btn-secondary"
                  onClick={(e) =>
                    this.setState({
                      organizationModal: false,
                      errors: {},
                      org_column: "",
                      org_editable: false,
                      org_sortable: false,
                      org_filterable: false,
                      org_required: false,
                      org_position: this.props.organisations.length + 1,
                      org_type: "Text",
                      org_values: [],
                    })
                  }
                >
                  {" "}
                  Close
                </button>
              </Modal.Footer>
            </form>
          </Modal>

          {/* Organisation Edit Modal */}
          <Modal
            show={this.state.organizationEditModal}
            onHide={(e) =>
              this.setState({
                organizationEditModal: false,
                errors: {},
                org_column: "",
                org_editable: false,
                org_sortable: false,
                org_filterable: false,
                org_required: false,
                org_position: this.props.organisations.length + 1,
                org_type: "Text",
                org_values: [],
              })
            }
            centered
            aria-labelledby="contained-modal-title-vcenter"
            size="md"
          >
            <form className="w-100" onSubmit={this.onOrgEditSubmit}>
              <Modal.Header closebutton="true">
                <Modal.Title>Edit Organisation Field </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Group controlId="Column">
                  <Form.Label>Column</Form.Label>
                  <Form.Control
                    type="text"
                    className="height-30px"
                    name="org_column"
                    // defaultValue={this.props.organisation_detail.column_name}
                    value={this.state.org_column}
                    onChange={this.handleInputChange}
                  />
                  <div className="text-danger">
                    {this.state.errors.org_column}
                  </div>
                </Form.Group>

                <Form.Group controlId="Position">
                  <Form.Label>Position</Form.Label>
                  <Form.Control
                    type="number"
                    className="height-30px"
                    name="org_position"
                    // defaultValue={this.props.organisation_detail.column_name}
                    value={this.state.org_position}
                    onChange={this.handleInputChange}
                  />
                  <div className="text-danger">
                    {this.state.errors.org_position}
                  </div>
                </Form.Group>

                <Form.Group controlId="Editable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="org_editable"
                      checked={this.state.org_editable}
                      value="editable"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Editable
                  </label>
                </Form.Group>

                <Form.Group controlId="Sortable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="org_sortable"
                      checked={this.state.org_sortable}
                      value="sortable"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Sortable
                  </label>
                </Form.Group>

                <Form.Group controlId="Filterable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="org_filterable"
                      checked={this.state.org_filterable}
                      value="filterable"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Filterable
                  </label>
                </Form.Group>

                <Form.Group controlId="Required">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="org_required"
                      checked={this.state.org_required}
                      value="required"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Required
                  </label>
                </Form.Group>

                <Form.Group controlId="optionType">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    as="select"
                    size="sm"
                    name="org_type"
                    onChange={this.handleInputChange}
                    value={this.state.org_type}
                  >
                    {fieldTypes && fieldTypes.length > 0
                      ? fieldTypes.map(({ label, value }, index) => (
                          <option key={index} value={value}>
                            {label}
                          </option>
                        ))
                      : null}
                  </Form.Control>
                </Form.Group>

                <Form.Group controlId="Values">
                  <Form.Label>Values</Form.Label>
                  <Select
                    isMulti
                    defaultValue={
                      this.state.org_values ? this.state.org_values : []
                    }
                    options={this.state.groupedOptions}
                    formatGroupLabel={formatGroupLabel}
                    onChange={this.handleSelectChange}
                    name="org_values"
                  />
                  <div className="text-danger">
                    {this.state.errors.org_values}
                  </div>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <button className="btn btn-md btn-primary   mr-1">Save</button>
                <button
                  type="button"
                  className="btn btn-md btn-secondary"
                  onClick={(e) =>
                    this.setState({
                      organizationEditModal: false,
                      errors: {},
                      org_column: "",
                      org_editable: false,
                      org_sortable: false,
                      org_filterable: false,
                      org_required: false,
                      org_position: this.props.organisations.length + 1,
                      org_type: "Text",
                      org_values: [],
                    })
                  }
                >
                  {" "}
                  Close
                </button>
              </Modal.Footer>
            </form>
          </Modal>
          {/* Contact Modal */}
          <Modal
            show={this.state.contactModal}
            onHide={(e) =>
              this.setState({
                contactModal: false,
                errors: {},
                contact_column: "",
                contact_editable: false,
                contact_sortable: false,
                contact_filterable: false,
                contact_required: false,
                contact_position: this.props.contacts.length + 1,
                contact_type: "Text",
                contact_values: [],
              })
            }
            centered
            aria-labelledby="contained-modal-title-vcenter"
            size="md"
          >
            <form className="w-100" onSubmit={this.onContactSubmit}>
              <Modal.Header closebutton="true">
                <Modal.Title>New Contact Field</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Group controlId="Column">
                  <Form.Label>Column</Form.Label>
                  <Form.Control
                    type="text"
                    className="height-30px"
                    name="contact_column"
                    onChange={this.handleInputChange}
                    value={contact_column}
                  />
                  <div className="text-danger">
                    {this.state.errors.contact_column}
                  </div>
                </Form.Group>

                <Form.Group controlId="Position">
                  <Form.Label>Position</Form.Label>
                  <Form.Control
                    type="number"
                    className="height-30px"
                    name="contact_position"
                    onChange={this.handleInputChange}
                    value={contact_position}
                  />
                  <div className="text-danger">
                    {this.state.errors.contact_position}
                  </div>
                </Form.Group>

                <Form.Group controlId="Editable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="contact_editable"
                      value="editable"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Editable
                  </label>
                </Form.Group>

                <Form.Group controlId="Sortable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="contact_sortable"
                      value="sortable"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Sortable
                  </label>
                </Form.Group>

                <Form.Group controlId="Filterable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="contact_filterable"
                      value="filterable"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Filterable
                  </label>
                </Form.Group>

                <Form.Group controlId="Required">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="contact_required"
                      value="required"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Required
                  </label>
                </Form.Group>

                <Form.Group controlId="optionType">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    as="select"
                    size="sm"
                    name="contact_type"
                    onChange={this.handleInputChange}
                  >
                    {fieldTypes && fieldTypes.length > 0
                      ? fieldTypes.map(({ label, value }, index) => (
                          <option key={index} value={value}>
                            {label}
                          </option>
                        ))
                      : null}
                  </Form.Control>
                </Form.Group>

                <Form.Group controlId="Values">
                  <Form.Label>Values</Form.Label>
                  {/* <Form.Control type="text" className="height-30px" /> */}
                  <Select
                    isMulti
                    options={this.state.groupedOptions}
                    formatGroupLabel={formatGroupLabel}
                    onChange={this.handleSelectChange2}
                    name="contact_values"
                  />
                  <div className="text-danger">
                    {this.state.errors.contact_values}
                  </div>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <button className="btn btn-md btn-primary mr-1">Save</button>
                <button
                  type="button"
                  className="btn btn-md btn-secondary"
                  onClick={(e) =>
                    this.setState({
                      contactModal: false,
                      errors: {},
                      contact_column: "",
                      contact_editable: false,
                      contact_sortable: false,
                      contact_filterable: false,
                      contact_required: false,
                      contact_position: this.props.contacts.length + 1,
                      contact_type: "Text",
                      contact_values: [],
                    })
                  }
                >
                  {" "}
                  Close
                </button>
              </Modal.Footer>
            </form>
          </Modal>

          {/* Contact Edit Modal */}
          <Modal
            show={this.state.contactEditModal}
            onHide={(e) =>
              this.setState({
                contactEditModal: false,
                errors: {},
                contact_column: "",
                contact_editable: false,
                contact_sortable: false,
                contact_filterable: false,
                contact_required: false,
                contact_position: this.props.contacts.length + 1,
                contact_type: "Text",
                contact_values: [],
              })
            }
            centered
            aria-labelledby="contained-modal-title-vcenter"
            size="md"
          >
            <form className="w-100" onSubmit={this.onContactEditSubmit}>
              <Modal.Header closebutton="true">
                <Modal.Title>Edit Contact Field</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Group controlId="Column">
                  <Form.Label>Column</Form.Label>
                  <Form.Control
                    type="text"
                    className="height-30px"
                    name="contact_column"
                    onChange={this.handleInputChange}
                    value={this.state.contact_column}
                  />
                  <div className="text-danger">
                    {this.state.errors.contact_column}
                  </div>
                </Form.Group>

                <Form.Group controlId="Position">
                  <Form.Label>Position</Form.Label>
                  <Form.Control
                    type="number"
                    className="height-30px"
                    name="contact_position"
                    onChange={this.handleInputChange}
                    value={this.state.contact_position}
                  />
                  <div className="text-danger">
                    {this.state.errors.contact_position}
                  </div>
                </Form.Group>

                <Form.Group controlId="Editable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="contact_editable"
                      value="editable"
                      checked={this.state.contact_editable}
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Editable
                  </label>
                </Form.Group>

                <Form.Group controlId="Sortable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="contact_sortable"
                      value="sortable"
                      checked={this.state.contact_sortable}
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Sortable
                  </label>
                </Form.Group>

                <Form.Group controlId="Filterable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="contact_filterable"
                      value="filterable"
                      checked={this.state.contact_filterable}
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Filterable
                  </label>
                </Form.Group>

                <Form.Group controlId="Required">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="contact_required"
                      value="required"
                      checked={this.state.contact_required}
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Required
                  </label>
                </Form.Group>

                <Form.Group controlId="optionType">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    as="select"
                    size="sm"
                    name="contact_type"
                    onChange={this.handleInputChange}
                    value={this.state.contact_type}
                  >
                    {fieldTypes && fieldTypes.length > 0
                      ? fieldTypes.map(({ label, value }, index) => (
                          <option key={index} value={value}>
                            {label}
                          </option>
                        ))
                      : null}
                  </Form.Control>
                </Form.Group>

                <Form.Group controlId="Values">
                  <Form.Label>Values</Form.Label>
                  <Select
                    isMulti
                    defaultValue={
                      this.state.contact_values ? this.state.contact_values : []
                    }
                    options={this.state.groupedOptions}
                    formatGroupLabel={formatGroupLabel}
                    onChange={this.handleSelectChange2}
                    name="contact_values"
                  />
                  <div className="text-danger">
                    {this.state.errors.contact_values}
                  </div>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <button className="btn btn-md btn-primary  mr-1">Save</button>
                <button
                  type="button"
                  className="btn btn-md btn-secondary"
                  onClick={(e) =>
                    this.setState({
                      contactEditModal: false,
                      errors: {},
                      contact_column: "",
                      contact_editable: false,
                      contact_sortable: false,
                      contact_filterable: false,
                      contact_required: false,
                      contact_position: this.props.contacts.length + 1,
                      contact_type: "Text",
                      contact_values: [],
                    })
                  }
                >
                  {" "}
                  Close
                </button>
              </Modal.Footer>
            </form>
          </Modal>

          {/* Deal Modal */}
          <Modal
            show={this.state.dealModal}
            onHide={(e) =>
              this.setState({
                dealModal: false,
                errors: {},
                deal_column: "",
                deal_editable: false,
                deal_sortable: false,
                deal_filterable: false,
                deal_required: false,
                deal_position: this.props.deals.length + 1,
                deal_type: "Text",
                deal_values: [],
              })
            }
            centered
            aria-labelledby="contained-modal-title-vcenter"
            size="md"
          >
            <form className="w-100" onSubmit={this.onDealSubmit}>
              <Modal.Header closebutton="true">
                <Modal.Title>New Deal Field</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Group controlId="Column">
                  <Form.Label>Column</Form.Label>
                  <Form.Control
                    type="text"
                    className="height-30px"
                    name="deal_column"
                    onChange={this.handleInputChange}
                    value={deal_column}
                  />
                  <div className="text-danger">
                    {this.state.errors.deal_column}
                  </div>
                </Form.Group>

                <Form.Group controlId="Position">
                  <Form.Label>Position</Form.Label>
                  <Form.Control
                    type="number"
                    className="height-30px"
                    name="deal_position"
                    onChange={this.handleInputChange}
                    value={deal_position}
                  />
                  <div className="text-danger">
                    {this.state.errors.deal_position}
                  </div>
                </Form.Group>

                <Form.Group controlId="Editable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="deal_editable"
                      value="editable"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Editable
                  </label>
                </Form.Group>

                <Form.Group controlId="Sortable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="deal_sortable"
                      value="sortable"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Sortable
                  </label>
                </Form.Group>

                <Form.Group controlId="Filterable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="deal_filterable"
                      value="filterable"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Filterable
                  </label>
                </Form.Group>

                <Form.Group controlId="Required">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="deal_required"
                      value="required"
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Required
                  </label>
                </Form.Group>

                <Form.Group controlId="optionType">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    as="select"
                    size="sm"
                    name="deal_type"
                    onChange={this.handleInputChange}
                  >
                    {fieldTypes && fieldTypes.length > 0
                      ? fieldTypes.map(({ label, value }, index) => (
                          <option key={index} value={value}>
                            {label}
                          </option>
                        ))
                      : null}
                  </Form.Control>
                </Form.Group>

                <Form.Group controlId="Values">
                  <Form.Label>Values</Form.Label>
                  {/* <Form.Control type="text" className="height-30px" /> */}
                  <Select
                    isMulti
                    options={this.state.groupedOptions}
                    formatGroupLabel={formatGroupLabel}
                    onChange={this.handleSelectChange3}
                    name="deal_values"
                  />
                  <div className="text-danger">
                    {this.state.errors.deal_values}
                  </div>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <button className="btn btn-md btn-primary  mr-1">Save</button>
                <button
                  type="button"
                  className="btn btn-md btn-secondary"
                  onClick={(e) =>
                    this.setState({
                      dealModal: false,
                      errors: {},
                      deal_column: "",
                      deal_editable: false,
                      deal_sortable: false,
                      deal_filterable: false,
                      deal_required: false,
                      deal_position: this.props.deals.length + 1,
                      deal_type: "Text",
                      deal_values: [],
                    })
                  }
                >
                  {" "}
                  Close
                </button>
              </Modal.Footer>
            </form>
          </Modal>

          {/* Deal Edit Modal */}
          <Modal
            show={this.state.dealEditModal}
            onHide={(e) =>
              this.setState({
                dealEditModal: false,
                errors: {},
                deal_column: "",
                deal_editable: false,
                deal_sortable: false,
                deal_filterable: false,
                deal_required: false,
                deal_position: this.props.deals.length + 1,
                deal_type: "Text",
                deal_values: [],
              })
            }
            centered
            aria-labelledby="contained-modal-title-vcenter"
            size="md"
          >
            <form className="w-100" onSubmit={this.onDealEditSubmit}>
              <Modal.Header closebutton="true">
                <Modal.Title>Edit Deal Field</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form.Group controlId="Column">
                  <Form.Label>Column</Form.Label>
                  <Form.Control
                    type="text"
                    className="height-30px"
                    name="deal_column"
                    onChange={this.handleInputChange}
                    value={this.state.deal_column}
                  />
                  <div className="text-danger">
                    {this.state.errors.deal_column}
                  </div>
                </Form.Group>

                <Form.Group controlId="Position">
                  <Form.Label>Position</Form.Label>
                  <Form.Control
                    type="number"
                    className="height-30px"
                    name="deal_position"
                    onChange={this.handleInputChange}
                    value={this.state.deal_position}
                  />
                  <div className="text-danger">
                    {this.state.errors.deal_position}
                  </div>
                </Form.Group>

                <Form.Group controlId="Editable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="deal_editable"
                      value="editable"
                      checked={this.state.deal_editable}
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Editable
                  </label>
                </Form.Group>

                <Form.Group controlId="Sortable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="deal_sortable"
                      value="sortable"
                      checked={this.state.deal_sortable}
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Sortable
                  </label>
                </Form.Group>

                <Form.Group controlId="Filterable">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="deal_filterable"
                      value="filterable"
                      checked={this.state.deal_filterable}
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Filterable
                  </label>
                </Form.Group>

                <Form.Group controlId="Required">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="deal_required"
                      value="required"
                      checked={this.state.deal_required}
                      onChange={this.handleInputChange}
                    />
                    <span className="geekmark" /> Required
                  </label>
                </Form.Group>

                <Form.Group controlId="optionType">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    as="select"
                    size="sm"
                    name="deal_type"
                    onChange={this.handleInputChange}
                    value={this.state.deal_type}
                  >
                    {fieldTypes && fieldTypes.length > 0
                      ? fieldTypes.map(({ label, value }, index) => (
                          <option key={index} value={value}>
                            {label}
                          </option>
                        ))
                      : null}
                  </Form.Control>
                </Form.Group>

                <Form.Group controlId="Values">
                  <Form.Label>Values</Form.Label>
                  <Select
                    isMulti
                    defaultValue={
                      this.state.deal_values ? this.state.deal_values : []
                    }
                    options={this.state.groupedOptions}
                    formatGroupLabel={formatGroupLabel}
                    onChange={this.handleSelectChange3}
                    name="deal_values"
                  />
                  <div className="text-danger">
                    {this.state.errors.deal_values}
                  </div>
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <button className="btn btn-md btn-primary mr-1">Save</button>
                <button
                  type="button"
                  className="btn btn-md btn-secondary"
                  onClick={(e) =>
                    this.setState({
                      dealEditModal: false,
                      errors: {},
                      deal_column: "",
                      deal_editable: false,
                      deal_sortable: false,
                      deal_filterable: false,
                      deal_required: false,
                      deal_position: this.props.deals.length + 1,
                      deal_type: "Text",
                      deal_values: [],
                    })
                  }
                >
                  {" "}
                  Close
                </button>
              </Modal.Footer>
            </form>
          </Modal>
        </Layout>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  auth_user: state.auth.user,
  stages: state.stage.list,
  organisations: state.organisation.list,
  organisation_detail: state.organisation.single,
  contacts: state.contact.list,
  deals: state.deal.list,
  countries: state.country.list,
  industries: state.industry.list,
  clusters: state.cluster.list,
});
const mapDispatchToProps = {
  addStage,
  getStages,
  deleteStage,
  changeStagePosition,
  updateStage,
  changeFieldPosition,
  addOrganisation,
  getOrganisations,
  deleteOrganisation,
  updateOrganisation,
  getOrganisation,
  addContact,
  getContacts,
  deleteContact,
  updateContact,
  addDeal,
  getDeals,
  deleteDeal,
  updateDeal,
  getAllCountries,
  getAllIndustries,
  getAllClusters,
};
export default connect(mapStateToProps, mapDispatchToProps)(Configuration);
