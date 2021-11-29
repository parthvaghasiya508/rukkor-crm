const express = require("express");
const Router = express.Router();
const { Organization, Contact, Deal, Log, Note, Country, Industry, Cluster, Stage, Notification, Setting, User } = require("../model");
var moment = require('moment-timezone');
var mailer = require("../utils/mailer");
var { convertToSlug, dynamicSort } = require("../utils/helpers");
const {
  FrontOrgLimit
} = require("../utils/limits");
const fs = require("fs");


// Defined Get All Organisation
Router.get("/all", async function (req, res) {
  try {
    let response_arr = [];
    console.log("req.query:",req.query);
    var referenceId = (req.query.referenceId) ? req.query.referenceId : '';
    var user_id = (req.query.user_id) ? req.query.user_id : '';
    var main_search_keyword = (req.query.main_search_keyword) ? req.query.main_search_keyword : '';
    
    var filter = {};
    // if(user_id){
    //   filter = {...filter, user:user_id}
    // }
    if(referenceId){
      filter = { ...filter, _id: referenceId };
    }
    let sort_by = '_id';
    let order_by = 'desc';
    if(req.query.sort_by && req.query.order_by){
      sort_by = req.query.sort_by;
      order_by = req.query.order_by;
    }
    const getData = await Organization.find(filter, {}).lean();
    
    if(getData && getData.length > 0){
      for (const d of getData) {  
        let matched_search_query = false;
        for (const key in d) {
          if (d.hasOwnProperty(key)) {
            var field_value = d[key];
            if(typeof field_value == 'object'){
              let ref = field_value.ref;
              if(ref == 'country'){
                const country_detail = await Country.findOne({ _id:field_value.value },{title:1}).lean();
                if(country_detail){
                  d[key] = country_detail.title;
                }
                else{
                  d[key] = "-";
                }                
              }
              if(ref == 'industry'){
                const industry_detail = await Industry.findOne({ _id:field_value.value },{title:1}).lean();
                if(industry_detail){
                  d[key] = industry_detail.title;
                }
                else{
                  d[key] = "-";
                }
              }
              if(ref == 'cluster'){
                const cluster_detail = await Cluster.findOne({ _id:field_value.value },{title:1}).lean();
                if(cluster_detail){
                  d[key] = cluster_detail.title;
                }
                else{
                  d[key] = "-";
                } 
              }
              if(ref == 'stage'){
                const stage_detail = await Stage.findOne({ _id:field_value.value },{name:1}).lean();
                if(stage_detail){
                  d[key] = stage_detail.name;
                }
                else{
                  d[key] = "-";
                } 
              }
              if(ref == ''){
                d[key] = "";
              }
            }
            // console.log("field_value:",d[key]);
            if(d[key].toString().toLocaleLowerCase().includes(main_search_keyword.toString().toLocaleLowerCase())){
              matched_search_query = true;
            }
          }
        } 
        // console.log("matched_search_query:",matched_search_query);
        if(!matched_search_query && main_search_keyword) continue;
        response_arr.push(d);
      }
    }

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = FrontOrgLimit;
    const totalRecords = response_arr.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);
    var start_record = skipRecords+1 ;
    var end_record = page*recordsPerPage ;
    let recordRange = '';
    if(start_record == totalRecords){
      recordRange = `${start_record} of ${totalRecords}`;
    }
    else if(end_record > totalRecords){
      recordRange = `${start_record}-${totalRecords} of ${totalRecords}`;
    }
    else{
      recordRange = `${start_record}-${end_record} of ${totalRecords}`;
    }

    // Sort and Paginate
    if(sort_by && order_by){
      response_arr = response_arr.sort(dynamicSort(sort_by, order_by));
    }
    response_arr = response_arr.slice(skipRecords);
    response_arr = response_arr.slice(0,recordsPerPage);

    res.status(200).json({
      success: true,
      msg: "Organisation get successfully",
      organisations: response_arr,
      pagination:{ totalPages:totalPages, currentPage:page, totalRecords:totalRecords, recordRange:recordRange }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Add New Organisation
Router.post("/add", async function (req, res) {
  const mongoose = require("mongoose");
  const Schema = mongoose.Schema;
  try {
    console.log("Data:", req.body);
    let fields = {};
    let response_arr = {};
    let dataFields = req.body;
    for (const key in dataFields) {
      if (dataFields.hasOwnProperty(key)) {
        // console.log(`fields[key]:`,dataFields[key]);
        // console.log(`fields[key]:`,typeof dataFields[key]);
        if(typeof dataFields[key] == 'object'){
          fields[key] = Object;  
        }
        else if(!['user'].includes(key.toLocaleLowerCase())) {
          fields[key] = String;  
        }          
      }
    }
    // console.log(fields);
    mongoose.model('Organization').schema.add(fields);
    const organization = await new Organization(req.body).save();

    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    // Manage Log : Start
    let log_param = {
      user:req.body.user,
      action:'organization_created',
      organization:organization._id,
      description:'Organisation has been created by'
    };
    const log = await new Log(log_param).save();
    // Manage Log : End
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
   
    res.status(200).json({
      success: true,
      msg: "Organisation added successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Filter All Organisation
Router.post("/filter", async function (req, res) {
  try {
    console.log("param:", req.body);
    let filter = {};
    var response_arr = [];
    let dataFields = req.body;
    for (const key in dataFields) {
      if (dataFields.hasOwnProperty(key)) {
        // const element = object[key];
        if(dataFields[key] !=="") {
          if(typeof dataFields[key] == 'object'){
            filter =  { ...filter, [key]:dataFields[key] }
          }
          else if(['user'].includes(key.toLocaleLowerCase())){
            filter =  { ...filter, [key]:dataFields[key] }
          }          
          else{
            filter =  { ...filter, [key]:{'$regex' : dataFields[key].toString() , '$options' : 'i'} }
          }
        }            
      }
    }
    // console.log("filter:",filter);
    const data = await Organization.find(filter, {}).lean();
    if(data && data.length > 0){
      for (const d of data) {  
        for (const key in d) {
          if (d.hasOwnProperty(key)) {
            var field_value = d[key];
            if(typeof field_value == 'object'){
              let ref = field_value.ref;
              if(ref == 'country'){
                const country_detail = await Country.findOne({ _id:field_value.value },{title:1}).lean();
                if(country_detail){
                  d[key] = country_detail.title;
                }
                else{
                  d[key] = "-";
                }                
              }
              if(ref == 'industry'){
                const industry_detail = await Industry.findOne({ _id:field_value.value },{title:1}).lean();
                if(industry_detail){
                  d[key] = industry_detail.title;
                }
                else{
                  d[key] = "-";
                }
              }
              if(ref == 'cluster'){
                const cluster_detail = await Cluster.findOne({ _id:field_value.value },{title:1}).lean();
                if(cluster_detail){
                  d[key] = cluster_detail.title;
                }
                else{
                  d[key] = "-";
                }
              }
              if(ref == 'stage'){
                const stage_detail = await Stage.findOne({ _id:field_value.value },{name:1}).lean();
                if(stage_detail){
                  d[key] = stage_detail.name;
                }
                else{
                  d[key] = "-";
                }
              }
              if(ref == ''){
                d[key] = "";
              }
            }
          }
        }                
        response_arr.push(d);
      }
    }

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = FrontOrgLimit;
    const totalRecords = response_arr.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page * recordsPerPage - recordsPerPage);
    var start_record = skipRecords+1 ;
    var end_record = page*recordsPerPage ;
    let recordRange = '';
    if(start_record == totalRecords){
      recordRange = `${start_record} of ${totalRecords}`;
    }
    else if(end_record > totalRecords){
      recordRange = `${start_record}-${totalRecords} of ${totalRecords}`;
    }
    else{
      recordRange = `${start_record}-${end_record} of ${totalRecords}`;
    }

    // Sort and Paginate
    if(req.query.sort_by && req.query.order_by){
      response_arr = response_arr.sort(dynamicSort(req.query.sort_by, req.query.order_by));
    }
    response_arr = response_arr.slice(skipRecords);
    response_arr = response_arr.slice(0,recordsPerPage);

    res.status(200).json({
      success: true,
      msg: "Organisation get successfully",
      organisations: response_arr,
      pagination:{ totalPages:totalPages, currentPage:page, totalRecords:totalRecords, recordRange:recordRange }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Get Single Organisation
Router.get("/get/:id", async function (req, res) {
  try {
    let response_arr = {};
    console.log("req.params:",req.params);

    const edit = await Organization.findOne({ _id:req.params.id }, {}).lean();
    const detail = await Organization.findOne({ _id:req.params.id }, {})
    .lean();

    let set_detail = {};
    if(detail){
      const d = detail;
      for (const key in d) {
        if (d.hasOwnProperty(key)) {
          // console.log(`key:${key} | d:${d[key]}`);
          var field_value = d[key];
          if(typeof field_value == 'object'){
            // console.log("field_value:",field_value);
            let ref = field_value.ref;
            if(ref == 'country'){
              const country_detail = await Country.findOne({ _id:field_value.value },{title:1}).lean();
              if(country_detail){
                d[key] = country_detail.title;
              }
              else{
                d[key] = "-";
              }              
            }
            if(ref == 'industry'){
              const industry_detail = await Industry.findOne({ _id:field_value.value },{title:1}).lean();
              if(industry_detail){
                d[key] = industry_detail.title;
              }
              else{
                d[key] = "-";
              }  
            }
            if(ref == 'cluster'){
              const cluster_detail = await Cluster.findOne({ _id:field_value.value },{title:1}).lean();
              if(cluster_detail){
                d[key] = cluster_detail.title;
              }
              else{
                d[key] = "-";
              } 
            }
            if(ref == 'stage'){
              const stage_detail = await Stage.findOne({ _id:field_value.value },{name:1}).lean();
              if(stage_detail){
                d[key] = stage_detail.name;
              }
              else{
                d[key] = "-";
              }              
            }
            if(ref == ''){
              d[key] = "";
            }
          }
        }
      }      
      set_detail = d;
    }

    let edit_detail = {};
    if(edit){
      const ed = edit;
      for (const key in ed) {
        if (ed.hasOwnProperty(key)) {
          // console.log(`key:${key} | d:${ed[key]}`);
          var field_value = ed[key];
          if(typeof field_value == 'object'){
            // console.log("field_value:",field_value);
            let ref = field_value.ref;
            let value = field_value.value;
            if(ref == 'country'){
              const country_detail = await Country.findOne({ _id:field_value.value },{_id:1}).lean();
              if(country_detail){
                ed[key] = { ref:ref, value:country_detail._id } ;
              }
              else{
                ed[key] = "-";
              }              
            }
            if(ref == 'industry'){
              const industry_detail = await Industry.findOne({ _id:field_value.value },{_id:1}).lean();
              if(industry_detail){
                ed[key] =  { ref:ref, value:industry_detail._id };
              }
              else{
                ed[key] = "-";
              }              
            }
            if(ref == 'cluster'){
              const cluster_detail = await Cluster.findOne({ _id:field_value.value },{_id:1}).lean();
              if(cluster_detail){
                ed[key] = { ref:ref, value:cluster_detail._id };
              }
              else{
                ed[key] = "-";
              }              
            }
            if(ref == 'stage'){
              const stage_detail = await Stage.findOne({ _id:field_value.value },{_id:1}).lean();
              if(stage_detail){
                ed[key] = { ref:ref, value:stage_detail._id };
              }
              else{
                ed[key] = "-";
              }              
            }
            if(ref == ''){
              ed[key] = { ref:"", value:"" };
            }
          }
        }
      }      
      edit_detail = ed;
    }

    console.log("edit:",edit, "detail:",set_detail);
    res.status(200).json({
      success: true,
      msg: "Organisation get successfully",
      detail: set_detail,
      edit: edit_detail,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Update Organisation
Router.post("/update", async function (req, res) {
  const mongoose = require("mongoose");
  const Schema = mongoose.Schema;
  try {
    let response_arr = {};
    console.log("Data:", req.body);

    // Check Existing
    const check_exist = await Organization.findById(req.body._id);
    if(!check_exist){
      res.status(200).json({
        success: false,
        msg: "Organisation not found",
      });
    }

    let fields = {};
    let finalData = {};
    let dataFields = req.body.data;
    for (const key in dataFields) {
      if (dataFields.hasOwnProperty(key)) {
        // const element = object[key];
        if(typeof dataFields[key] == 'object'){
          fields[key] = Object;  
        }        
        else if(!['user'].includes(key.toLocaleLowerCase())) {
          fields[key] = String;
        }
        if(!['user'].includes(key.toLocaleLowerCase())){
          finalData[key] = dataFields[key];  
        }        
      }
    }
    mongoose.model('Organization').schema.add(fields);
    const organization = await Organization.findOneAndUpdate( { _id: req.body._id },{ $set: finalData }, { multi: true, new: true });
    // console.log("organizationxxxxxxxxxx:",organization);

    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    // Manage Log : Start
    let log_param = {
      user:req.body.data.user,
      action:'edit_detail',
      organization:req.body._id,
      description:'Organisation details are edited by'
    };
    const log = await new Log(log_param).save();
    // Manage Log : End
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    const list = await Organization.findOne({_id:req.body._id}, {})
    .lean();
    if(list){
      let d = list;
      for (const key in d) {
        if (d.hasOwnProperty(key)) {
          // console.log(`key:${key} | d:${d[key]}`);
          var field_value = d[key];
          if(typeof field_value == 'object'){
            // console.log("field_value:",field_value);
            let ref = field_value.ref;
            if(ref == 'country'){
              const country_detail = await Country.findOne({ _id:field_value.value },{title:1}).lean();
              if(country_detail){
                d[key] = country_detail.title;
              }
              else{
                d[key] = "-";
              }              
            }
            if(ref == 'industry'){
              const industry_detail = await Industry.findOne({ _id:field_value.value },{title:1}).lean();
              if(industry_detail){
                d[key] = industry_detail.title;
              }
              else{
                d[key] = "-";
              }              
            }
            if(ref == 'cluster'){
              const cluster_detail = await Cluster.findOne({ _id:field_value.value },{title:1}).lean();
              if(cluster_detail){
                d[key] = cluster_detail.title;
              }
              else{
                d[key] = "-";
              }
            }
            if(ref == 'stage'){
              const stage_detail = await Stage.findOne({ _id:field_value.value },{name:1}).lean();
              if(stage_detail){
                d[key] = stage_detail.name;
              }
              else{
                d[key] = "-";
              }              
            }
            if(ref == ''){
              d[key] = "";
            }
          }
        }
      }
      response_arr = d;
    }

    const edit = await Organization.findOne({_id:req.body._id}, {}).lean();
    let edit_detail = {};
    if(edit){
      let ed = edit;
      for (const key in ed) {
        if (ed.hasOwnProperty(key)) {
          // console.log(`key:${key} | d:${ed[key]}`);
          var field_value = ed[key];
          if(typeof field_value == 'object'){
            // console.log("field_value:",field_value);
            let ref = field_value.ref;
            if(ref == 'country'){
              const country_detail = await Country.findOne({ _id:field_value.value },{title:1}).lean();
              if(country_detail){
                ed[key] = country_detail.title;
              }
              else{
                ed[key] = "-";
              }              
            }
            if(ref == 'industry'){
              const industry_detail = await Industry.findOne({ _id:field_value.value },{title:1}).lean();
              if(industry_detail){
                ed[key] = industry_detail.title;
              }
              else{
                ed[key] = "-";
              }
            }
            if(ref == 'cluster'){
              const cluster_detail = await Cluster.findOne({ _id:field_value.value },{title:1}).lean();
              if(cluster_detail){
                ed[key] = cluster_detail.title;
              }
              else{
                ed[key] = "-";
              }
            }
            if(ref == 'stage'){
              const stage_detail = await Stage.findOne({ _id:field_value.value },{name:1}).lean();
              if(stage_detail){
                ed[key] = stage_detail.name;
              }
              else{
                ed[key] = "-";
              }              
            }
            if(ref == ''){
              ed[key] = { ref:"", value:"" };
            }
          }
        }
      }
      edit_detail = ed;
    }

    res.status(200).json({
      success: true,
      msg: "Organisation updated successfully",
      list: response_arr,
      edit: edit_detail,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Add New Organisation Notes
Router.post("/addNotes", async function (req, res) {
  try {
    console.log("Data:", req.body);
    let response_arr = {};
    var fullUrl = req.protocol + "://" + req.get("host");
    var timezone = req.query.timezone ? req.query.timezone : "Etc/UTC";

    // Add Notes
    const saved_note = await new Note(req.body).save();
    
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    // Manage Log : Start
    let log_param = {
      user:req.body.user,
      action:'note_add',
      organization:req.body.organization,
      description:'Organization Notes are added by',
      note_message:req.body.description
    };

    const log = await new Log(log_param).save();
    // Manage Log : End
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    // Fetch Notes
    const notes = await Note.find({_id:saved_note._id}).populate({ path:'organization' }).populate({ path:'user', select:{ username:1, photo:1, _id:1 } }).lean();
    if(notes && notes.length > 0){
      for (const note of notes) {
        var title = '';
        var ref_id = '';
        if(note.notes_type === 'organization'){
          title = (note.organization && note.organization.organization) ? note.organization.organization : '';
          ref_id = (note.organization && note.organization._id) ? note.organization._id : '';
        }
        else if(note.notes_type === 'contact'){
          title = (note.contact && note.contact.contact_name) ? note.contact.contact_name : '';
          ref_id = (note.contact && note.contact._id) ? note.contact._id : '';
        }
        else if(note.notes_type === "deal") {
          // Fetch Deal Contact Name Obj
          let contact_detail = note.deal.contact_name;
          let contact_data = {};
          if(contact_detail && contact_detail.ref === 'contact'){
            contact_data = await Contact.findOne({_id:contact_detail.value}).lean();
          }
          title = note.deal && contact_data && contact_data.contact_name ? contact_data.contact_name : "";
          ref_id = (note.deal && note.deal._id) ? note.deal._id : '';
        }

        response_arr = {
          "_id":note._id,
          "ref_id":ref_id,
          "title":title,
          "sender_id": note && note.user ? note.user._id : "",
          "sender": note && note.user ? note.user.username : "Sender",
          "sender_photo": note && note.user && note.user.photo && fs.existsSync(`./uploads/${note.user.photo}`)
            ? `${fullUrl}/uploads/${note.user.photo}` : "",
          "notes":note.description,
          "notes_type":note.notes_type,          
          "created_at":moment(note.created_at).tz(timezone).format('YYYY-MM-DD H:mm:ss')
        };
      }
    }
    res.status(200).json({
      success: true,
      msg: "Notes added successfully",
      note: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Get Organisation Log
Router.get("/logs/all", async function (req, res) {
  try {
    const response_arr = [];
    console.log("req.query:",req.query);
    var filter = {};
    if(req.query.orgId){
      filter = {...filter, organization:req.query.orgId}
    }
    var timezone = req.query.timezone ? req.query.timezone : "Etc/UTC";
    const data = await Log.find(filter, {}).populate({ path:'user',select:{ username:1 } }).lean();

    if(data && data.length > 0){
      for (const d of data) {
        d.created_at = moment(d.created_at).tz(timezone).format('YYYY-MM-DD HH:mm:ss');
        d.username = (d.user && d.user.username) ? d.user.username : '';
        response_arr.push(d);
      }
    }

    res.status(200).json({
      success: true,
      msg: "Logs get successfully",
      logs: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Get Organisation Notes
Router.get("/notes/all", async function (req, res) {
  try {
    const response_arr = [];
    console.log("Data:", req.body);
    var fullUrl = req.protocol + "://" + req.get("host");
    var filter = {};
    if(req.query.orgId){
      filter = { ...filter, organization: req.query.orgId}
    }
    var timezone = req.query.timezone ? req.query.timezone : "Etc/UTC";
    
    const notes = await Note.find(filter).populate({ path:'organization'}).populate({ path:'contact'}).populate({ path:'deal'}).populate({ path:'user', select:{ username:1, photo:1, _id:1 } }).lean();

    // console.log("notes:",notes);
    if(notes && notes.length > 0){
      for (const note of notes) {

        var title = '';
        var ref_id = '';
        if(note.notes_type === 'organization'){
          title = (note.organization && note.organization.organization) ? note.organization.organization : '';
          ref_id = (note.organization && note.organization._id) ? note.organization._id : '';
        }
        else if(note.notes_type === 'contact'){
          title = (note.contact && note.contact.contact_name) ? note.contact.contact_name : '';
          ref_id = (note.contact && note.contact._id) ? note.contact._id : '';
        }
        else if(note.notes_type === "deal") {
          // Fetch Deal Contact Name Obj
          let contact_detail = (note.deal && note.deal.contact_name) ? note.deal.contact_name : '';
          let contact_data = {};
          if(contact_detail && contact_detail.ref === 'contact'){
            contact_data = await Contact.findOne({_id:contact_detail.value}).lean();
          }
          title = note.deal && contact_data && contact_data.contact_name ? contact_data.contact_name : "";
          ref_id = (note.deal && note.deal._id) ? note.deal._id : '';
        }

        response_arr.push({
          "_id":note._id,
          "ref_id":ref_id,
          "title":title,
          "sender_id": note && note.user ? note.user._id : "",
          "sender": note && note.user ? note.user.username : "Sender",
          "sender_photo": note && note.user && note.user.photo && fs.existsSync(`./uploads/${note.user.photo}`)
            ? `${fullUrl}/uploads/${note.user.photo}` : "",
          "notes":note.description,
          "notes_type":note.notes_type,
          "created_at":moment(note.created_at).tz(timezone).format('YYYY-MM-DD HH:mm:ss')
        });
      }
    }
    res.status(200).json({
      success: true,
      msg: "Notes get successfully",
      notes: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Delete Organisation
Router.delete("/delete/:id", async function (req, res) {
  try {
    console.log("req.params:",req.params);
    // Get Data
    const org = await Organization.findById(req.params.id);
    if (!org) {
      return res.status(200).json({
        success: false,
        msg: "No data found",
      });
    }

    await Organization.findByIdAndRemove({ _id: req.params.id });
    await Contact.remove({ organization: req.params.id });
    await Deal.remove({ organization: req.params.id });
    await Log.remove({ organization: req.params.id });
    await Note.remove({ organization: req.params.id });

    res.status(200).json({
      success: true,
      msg: "Organisation deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Import Organizations
Router.post("/import", async function (req, res) {
  try {
    const mongoose = require("mongoose");
    const Schema = mongoose.Schema;
    
    const response_arr = [];
    console.log("Body:",req.body);
    const user = (req.body.user) ? req.body.user : '';
    const rows = (req.body.rows) ? req.body.rows : [];

    let fields = {};
    let new_data_arr = [];
    let failed_data_arr = [];
    if(rows && rows.length > 0){
      for (const [index, row] of rows.entries()) {
        // for (const row of rows) {
        let newObj = {user:user};
        let failed_flag = false;
        let error = '';
        for (const rkey in row) {
          if (row.hasOwnProperty(rkey)) {
            let newKey = convertToSlug(rkey);
            let column_value = row[rkey];
            
            // Manage Table Column 
            if(index == 0){
              if(['industry','country','cluster'].includes(newKey)) {
                fields[newKey] = Object;
              }
              else{
                fields[newKey] = String;  
              }
            }
            
            if(newKey == 'country'  && column_value){             
              const countryDetail = await Country.findOneAndUpdate({ title:{'$regex' : `^${column_value}$` , '$options' : 'i'}},{ title: column_value, status:1, user:user },{new: true,upsert: true}).lean();

              // console.log("countryDetail:",countryDetail);
              if(countryDetail && countryDetail._id){
                column_value = {
                  "ref": "country",
                  "value": countryDetail._id.toString()
                }
              }
              else{
                column_value = "";
                error = 'country_not_found';
                failed_flag = true;
              }
            }
            else if(newKey == 'industry'  && column_value){
              const industryDetail = await Industry.findOneAndUpdate({ title:{'$regex' : `^${column_value}$` , '$options' : 'i'} }, { title: column_value, status:1, user:user }, {new: true,upsert: true, fields:{_id:1,title:1}} ).lean();
              // console.log("industryDetail:",industryDetail);
              if(industryDetail && industryDetail._id){
                column_value = {
                  "ref": "industry",
                  "value": industryDetail._id.toString()
                }
              }
              else{
                column_value = "";
                error = 'industry_not_found';
                failed_flag = true;
              }
            }
            else if(newKey == 'cluster'  && column_value){
              const clusterDetail = await Cluster.findOneAndUpdate({ title:{'$regex' : `^${column_value}$` , '$options' : 'i'}},{title:column_value,status:1,user:user},{new:true,upsert:true,fields:{_id:1,title:1}}).lean();
              // console.log("clusterDetail:",clusterDetail);
              if(clusterDetail && clusterDetail._id){
                column_value = {
                  "ref": "cluster",
                  "value": clusterDetail._id.toString()
                }
              }
              else{
                column_value = "";
                error = 'cluster_not_found';
                failed_flag = true;
              }
            }
            else if(newKey == 'organization'  && column_value){
              // Check Organization Unique Validation
              const check_unique_organization = await Organization.find({ organization:{'$regex' : `^${column_value}$` , '$options' : 'i'}}).count();
              if(check_unique_organization > 0){
                error = 'organization_already';
                failed_flag = true;
              }
            }
            else if(newKey == 'organization_no'  && column_value){
              // Check Organization Number Unique Validation
              const check_unique_organization_no = await Organization.find({ organization_no:{'$regex' : `^${column_value}$` , '$options' : 'i'}}).count();
              if(check_unique_organization_no > 0){
                error = 'organization_no_already';
                failed_flag = true;
              }
            }
            
            if(error){
              newObj = {...newObj, error:error};
            }
            newObj = {...newObj, [newKey]:column_value};
          }
        }
        if(!failed_flag){
          new_data_arr.push(newObj)
        }
        else{
          failed_data_arr.push(newObj);
        }
      }
      // console.log("fields:",fields);
      // console.log("new_data_arr:",new_data_arr);
      // console.log("failed_data_arr:",failed_data_arr);
      mongoose.model('Organization').schema.add(fields);
    }
    const organizations = await Organization.insertMany(new_data_arr);
    // console.log("organization:",organizations);

    if(organizations.length > 0){
      for (const organization of organizations) {
        //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        // Manage Log : Start
        let log_param = {
          user:req.body.user,
          action:'organization_created',
          organization:organization._id,
          description:'Organisation has been created by'
        };
        const log = await new Log(log_param).save();
        // Manage Log : End
        //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      }     

      res.status(200).json({
        success: true,
        msg: "Organization import successfully!",
        total_count: rows.length,
        success_count: organizations.length,
        failed_count: failed_data_arr.length,
        failed_records: failed_data_arr,
      });
    }
    else{
      res.status(200).json({
        success: false,
        msg: "Organization could not imported! May be they are already exists!",
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


module.exports = Router;
