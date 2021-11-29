const express = require("express");
const Router = express.Router();
const { Organization, Contact, Deal, Log, Note, Country, Industry, Cluster, Stage, Notification, Setting, User  } = require("../model");
// var moment = require('moment'); 
var moment = require('moment-timezone');
var mailer = require("../utils/mailer");
var { convertToSlug,dynamicSort } = require("../utils/helpers");
const {
  FrontContactLimit
} = require("../utils/limits");
const fs = require("fs");


// Defined Get All Contact
Router.get("/all", async function (req, res) {
  try {
    var response_arr = [];
    // console.log("req.query:",req.query);
    var user_id = (req.query.user_id) ? req.query.user_id : '';
    var referenceId = (req.query.referenceId) ? req.query.referenceId : '';
    var main_search_keyword = (req.query.main_search_keyword) ? req.query.main_search_keyword : '';

    var filter = {};
    // if(user_id){
    //   filter = {...filter, user:user_id}
    // }
    if(referenceId){
      filter = { ...filter, _id: referenceId };
    }
    if(req.query.org_id){
      filter = {...filter, organization:{ ref:"organization", value:req.query.org_id}}
    }
    let sort_by = '_id';
    let order_by = 'desc';
    if(req.query.sort_by && req.query.order_by){
      sort_by = req.query.sort_by;
      order_by = req.query.order_by;
    }
    const data = await Contact.find(filter, {}).lean();
    if(data && data.length > 0){
      for (const d of data) {
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
              if(ref == 'organization'){
                const organization_detail = await Organization.findOne({ _id:field_value.value },{organization:1}).lean();
                if(organization_detail){
                  d[key] = (organization_detail && organization_detail.organization) ? organization_detail.organization : "-";
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
        if(!matched_search_query && main_search_keyword) continue;               
        response_arr.push(d);
      }
    }

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = FrontContactLimit;
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
      msg: "Contact get successfully",
      contacts: response_arr,
      pagination:{ totalPages:totalPages, currentPage:page, totalRecords:totalRecords, recordRange:recordRange }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Add New Contact
Router.post("/add", async function (req, res) {
  const mongoose = require("mongoose");
  const Schema = mongoose.Schema;
  try {
    console.log("Data:", req.body);
    let fields = {};
    let getOrganization= {};
    let getPhone= {};
    let getEmail= {};
    let response_arr = {};
    let dataFields = req.body;
    for (const key in dataFields) {
      if (dataFields.hasOwnProperty(key)) {
        if(typeof dataFields[key] == 'object'){
          fields[key] = Object;
          if(dataFields[key] && dataFields[key]["ref"] == 'organization'){
            getOrganization = dataFields[key];
          }
        }
        else if(!['user'].includes(key.toLocaleLowerCase())) {
          if(key.toLocaleLowerCase() === 'phone'){
            getPhone[key] = dataFields[key];
          }
          else if(key.toLocaleLowerCase() === 'email'){
            getEmail[key] = dataFields[key];
          }
          fields[key] = String;  
        }            
      }
    }
    mongoose.model('Contact').schema.add(fields);

    // Check Phone Unique Validation
    if(getPhone && getPhone['phone']){
      const check_unique_phone = await Contact.find({ phone:getPhone['phone'] }).count();
      if(check_unique_phone > 0){
        return res.status(200).json({
          success: false,
          msg: "Phone already registered.",
        });
      }
    }

    // Check Email Unique Validation
    if(getEmail && getEmail['email']){
      const check_unique_email = await Contact.find({ email:getEmail['email'] }).count();
      if(check_unique_email > 0){
        return res.status(200).json({
          success: false,
          msg: "Email already registered.",
        });
      }
    }
    
    const contact = await new Contact(req.body).save();

    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    // Manage Log : Start
    let log_param = {
      user:req.body.user,
      action:'contact_created',
      contact:contact._id,
      description:'Contact has been created by'
    };
    if(getOrganization && getOrganization.value){
      log_param['organization'] = getOrganization.value;
    }
    const log = await new Log(log_param).save();
    // Manage Log : End
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    res.status(200).json({
      success: true,
      msg: "Contact added successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Filter All Contact
Router.post("/filter", async function (req, res) {
  try {
    console.log("param:", req.body);
    let filter = {};
    var response_arr = [];
    let dataFields = req.body;
    for (const key in dataFields) {
      if (dataFields.hasOwnProperty(key)) {
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
    const data = await Contact.find(filter, {}).sort({ "updated_at": -1 }).lean();
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
              if(ref == 'organization'){
                const organization_detail = await Organization.findOne({ _id:field_value.value },{organization:1}).lean();
                if(organization_detail){
                  d[key] = (organization_detail && organization_detail.organization) ? organization_detail.organization : "-";
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
    const recordsPerPage = FrontContactLimit;
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
      msg: "Contact get successfully",
      contacts: response_arr,
      pagination:{ totalPages:totalPages, currentPage:page, totalRecords:totalRecords, recordRange:recordRange }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Get Single Contact
Router.get("/get/:id", async function (req, res) {
  try {
    let response_arr = {};
    console.log("req.params:",req.params);

    const edit = await Contact.findOne({ _id:req.params.id }, {}).lean();

    const detail = await Contact.findOne({ _id:req.params.id }, {}).lean();

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
            if(ref == 'organization'){
              const organization_detail = await Organization.findOne({ _id:field_value.value },{organization:1}).lean();
              if(organization_detail){
                d[key] = (organization_detail && organization_detail.organization) ? organization_detail.organization : "-";
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
                ed[key] = { ref:ref, value:industry_detail._id } ;
              }
              else{
                ed[key] = "-";
              }
            }
            if(ref == 'cluster'){
              const cluster_detail = await Cluster.findOne({ _id:field_value.value },{_id:1}).lean();
              if(cluster_detail){
                ed[key] = { ref:ref, value:cluster_detail._id } ;
              }
              else{
                ed[key] = "-";
              }
            }
            if(ref == 'stage'){
              const stage_detail = await Stage.findOne({ _id:field_value.value },{_id:1}).lean();
              if(stage_detail){
                ed[key] = { ref:ref, value:stage_detail._id } ;
              }
              else{
                ed[key] = "-";
              }
            }
            if(ref == 'organization'){
              const organization_detail = await Organization.findOne({ _id:field_value.value },{_id:1}).lean();
              if(organization_detail){
                ed[key] = { ref:ref, value:organization_detail._id } ;
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

    // console.log("edit:",edit, "detail:",set_detail);
    res.status(200).json({
      success: true,
      msg: "Contact get successfully",
      detail: set_detail,
      edit: edit_detail,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Update Contact
Router.post("/update", async function (req, res) {
  const mongoose = require("mongoose");
  const Schema = mongoose.Schema;
  try {
    let response_arr = {};
    console.log("Data:", req.body);

    // Check Existing
    const check_exist = await Contact.findById(req.body._id);
    if(!check_exist){
      res.status(200).json({
        success: false,
        msg: "Contact not found",
      });
    }

    let fields = {};
    let getOrganization= {};
    let getPhone= {};
    let getEmail= {};
    let finalData = {};
    let dataFields = req.body.data;
    for (const key in dataFields) {
      if (dataFields.hasOwnProperty(key)) {
        // const element = object[key];        
        if(typeof dataFields[key] == 'object'){
          fields[key] = Object;  
          if(dataFields[key] && dataFields[key]["ref"] == 'organization'){
            getOrganization = dataFields[key];
          }
        }        
        else if(!['user'].includes(key.toLocaleLowerCase())) {
          fields[key] = String;
          if(key.toLocaleLowerCase() === 'phone'){
            getPhone[key] = dataFields[key];
          }
          else if(key.toLocaleLowerCase() === 'email'){
            getEmail[key] = dataFields[key];
          }
        }
        if(!['user'].includes(key.toLocaleLowerCase())){
          finalData[key] = dataFields[key];  
        }        
      }
    }
    mongoose.model('Contact').schema.add(fields);

    // Check Phone Unique Validation
    if(getPhone && getPhone['phone']){
      const check_unique_phone = await Contact.find({ "phone":getPhone['phone'], "_id": { $ne: req.body._id } }).count();
      if(check_unique_phone > 0){
        return res.status(200).json({
          success: false,
          msg: "Phone already registered.",
        });
      }
    }

    // Check Email Unique Validation
    if(getEmail && getEmail['email']){
      const check_unique_email = await Contact.find({ email:getEmail['email'], "_id": { $ne: req.body._id } }).count();
      if(check_unique_email > 0){
        return res.status(200).json({
          success: false,
          msg: "Email already registered.",
        });
      }
    }

    const contact = await Contact.findOneAndUpdate( { _id: req.body._id },{ $set: finalData }, { multi: true, new: true });

    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    // Manage Log : Start
    let log_param = {
      user:req.body.data.user,
      action:'edit_detail',
      contact:contact._id,
      description:'Contact details are edited by'
    };
    if(getOrganization && getOrganization.value){
      log_param['organization'] = getOrganization.value;
    }
    const log = await new Log(log_param).save();
    // Manage Log : End
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    const list = await Contact.findOne({_id:req.body._id}, {}).lean();
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
            if(ref == 'organization'){
              const organization_detail = await Organization.findOne({ _id:field_value.value },{organization:1}).lean();
              if(organization_detail){
                d[key] = (organization_detail && organization_detail.organization) ? organization_detail.organization : "-";
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

    const edit = await Contact.findOne({_id:req.body._id}, {}).lean();
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
            if(ref == 'organization'){
              const organization_detail = await Organization.findOne({ _id:field_value.value },{organization:1}).lean();
              if(organization_detail){
                ed[key] = (organization_detail && organization_detail.organization) ? organization_detail.organization : "-";
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
      msg: "Contact updated successfully",
      list: response_arr,
      edit: edit_detail,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Add New Contact Notes
Router.post("/addNotes", async function (req, res) {
  try {
    console.log("Data:", req.body);
    let response_arr = {};
    var fullUrl = req.protocol + "://" + req.get("host");
    var timezone = req.query.timezone ? req.query.timezone : "Etc/UTC";

    // Add Notes
    const saved_note = await new Note(req.body).save();  

    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    // Send Mail and Notification to owner : Start
    
    // Fetch Reciever Detail
    const get_rec_user = await Contact.findOne({_id:req.body.contact},{}).populate({ path:'user', select:{ username:1, email:1, photo:1 } }).lean();

    // Fetch Sender Detail
    const get_sender_detail = await User.findOne({_id:saved_note.user}).lean();
    // console.log("get_sender_detail:",get_sender_detail);

    if(get_rec_user){
      // Check Notification Settings
      const notification_settings = await Setting.findOne({user:get_rec_user.user._id}).lean();

      // console.log("get_rec_user:",get_rec_user);
      // Send Notes Mail
      if(notification_settings && notification_settings.new_notes_email){
        var mailOptions = {
          to: get_rec_user.user.email,
          from: process.env.MAILER_EMAIL_ID,
          template: "notes-email",
          subject: "New Notes Added!",
          context: {
            name: get_rec_user.user.username,
            sender: get_sender_detail.username,
            module_name:`Contact:${get_rec_user.contact_name}`,
            notes:saved_note.description,
            logo:fullUrl+'/uploads/assets/logo.png'
          },
        };
        mailer.sendMail(mailOptions);
      }

      // Send Notes Notification
      if(notification_settings && notification_settings.new_notes_notification){
        let notes_param = {
          user:get_rec_user.user._id,
          from:saved_note.user,
          messsage:`${get_sender_detail.username} added new note on your Contact:${get_rec_user.contact_name}`,
        }
        const send_note = await new Notification(notes_param).save();
      }
    }

    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    // Manage Log : Start
    let log_param = {
      user:req.body.user,
      action:'note_add',
      contact:req.body.contact,
      description:'Contact Notes are added by',
      note_message:req.body.description
    };
    if(req.body.organization){
      log_param['organization'] = req.body.organization;
    }
    // if(req.body.contact){
    //   log_param['contact'] = req.body.contact
    // }
    const log = await new Log(log_param).save();
    // Manage Log : End
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    // Fetch Notes
    const notes = await Note.find({_id:saved_note._id}).populate({ path:'contact' }).populate({ path:'deal' }).populate({ path:'user', select:{ username:1, photo:1, _id:1 } }).lean();
    if(notes && notes.length > 0){
      for (const note of notes) {
        var title = '';
        var ref_id = '';
        if(note.notes_type === 'contact'){
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

        response_arr= {
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

// Defined Get Contact Log
Router.get("/logs/all", async function (req, res) {
  try {
    const response_arr = [];
    console.log("req.query:",req.query);
    var filter = {};
    if(req.query.contact_id){
      filter = {...filter, contact:req.query.contact_id}
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

// Defined Get Contact Notes
Router.get("/notes/all", async function (req, res) {
  try {
    const response_arr = [];
    console.log("Data:", req.body);
    var fullUrl = req.protocol + "://" + req.get("host");
    var filter = {};
    if(req.query.contact_id){
      filter = { ...filter, contact: req.query.contact_id}
    }
    var timezone = req.query.timezone ? req.query.timezone : "Etc/UTC";
    const notes = await Note.find(filter).populate({ path:'contact'}).populate({ path:'deal' }).populate({ path:'user', select:{ username:1, photo:1, _id:1 } }).lean();

    if(notes && notes.length > 0){
      for (const note of notes) {
        var title = '';
        var ref_id = '';
        if(note.notes_type === 'contact'){
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

// Defined Delete Contact
Router.delete("/delete/:id", async function (req, res) {
  try {
    console.log("req.params:",req.params);
    // Get Data
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(200).json({
        success: false,
        msg: "No data found",
      });
    }

    await Contact.findByIdAndRemove({ _id: req.params.id });
    await Deal.remove({ contact: req.params.id });
    await Log.remove({ contact: req.params.id });
    await Note.remove({ contact: req.params.id });

    res.status(200).json({
      success: true,
      msg: "Contact deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Import Contacts
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
              if(['organization','country'].includes(newKey)) {
                fields[newKey] = Object;
              }
              else{
                fields[newKey] = String;  
              }
            }
            
            if(newKey == 'organization' && column_value){
              const orgDetail = await Organization.findOne({ organization:{'$regex' : `^${column_value}$` , '$options' : 'i'} }, {organization:1}).lean();
              // console.log("orgDetail:",orgDetail);
              if(orgDetail && orgDetail._id){
                column_value = {
                  "ref": "organization",
                  "value": orgDetail._id.toString()
                }
              }
              else{
                column_value = "";
                error = 'organization_not_found';
                failed_flag = true;
              }              
            }
            else if(newKey == 'country'  && column_value){
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
            else if(newKey == 'phone'  && column_value){
              // Check Phone Unique Validation
              const check_unique_phone = await Contact.find({ phone:column_value }).count();
              if(check_unique_phone > 0){
                error = 'phone_already';
                failed_flag = true;
              }
            }
            else if(newKey == 'email'  && column_value){
              // Check Email Unique Validation
              if(column_value){
                const check_unique_email = await Contact.find({ email:column_value }).count();
                if(check_unique_email > 0){
                  error = 'email_already';
                  failed_flag = true;
                }
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
      mongoose.model('Contact').schema.add(fields);
    }
    const contacts = await Contact.insertMany(new_data_arr);
    // console.log("contact:",contacts);

    if(contacts.length > 0){
      for (const contact of contacts) {
        //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
        // Manage Log : Start
        let log_param = {
          user:user,
          action:'contact_created',
          contact:contact._id,
          description:'Contact has been created by'
        };
        if(contact.organization && contact.organization.value){
          log_param['organization'] = contact.organization.value;
        }
        const log = await new Log(log_param).save();
        // Manage Log : End
        //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      }     

      res.status(200).json({
        success: true,
        msg: "Contact import successfully!",
        total_count: rows.length,
        success_count: contacts.length,
        failed_count: failed_data_arr.length,
        failed_records: failed_data_arr,
      });
    }
    else{
      res.status(200).json({
        success: false,
        msg: "Contact could not imported! May be they are already exists!",
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


module.exports = Router;
