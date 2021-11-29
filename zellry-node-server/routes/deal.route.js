const express = require("express");
const Router = express.Router();
const { Organization, Contact, Deal, Log, Note, Country, Industry, Cluster, Stage, DealStage, DealAction,  Notification, Setting, User, Reason } = require("../model");
// var moment = require("moment");
var moment = require('moment-timezone');
var mailer = require("../utils/mailer");
const helpers = require('../utils/helpers');
const {
  CancelDealLimit,
  FrontDealLimit
} = require("../utils/limits");
const fs = require("fs");

// Defined Get All Deal
Router.get("/all", async function (req, res) {
  try {
    var response_arr = [];
    var fullUrl = req.protocol + "://" + req.get("host");
    var deal_user = (req.query.deal_user) ? req.query.deal_user : '';
    var user_id = (req.query.user_id) ? req.query.user_id : '';
    var referenceId = (req.query.referenceId) ? req.query.referenceId : '';
    var dealStatus = (req.query.dealStatus) ? req.query.dealStatus : '';
    var page = (req.query.page) ? req.query.page : '';
    var timezone = req.query.timezone ? req.query.timezone : "Etc/UTC";
    var main_search_keyword = (req.query.main_search_keyword) ? req.query.main_search_keyword : '';

    var filter = {};
    if (user_id) {
      filter = { ...filter,"responsible.value":user_id.toString() };
    }
    if(referenceId){
      filter = { ...filter, _id: referenceId };
    }
    let sort_by = '_id';
    let order_by = 'desc';
    if(req.query.sort_by && req.query.order_by){
      sort_by = req.query.sort_by;
      order_by = req.query.order_by;
    }
    const data = await Deal.find(filter, {}).lean();
    if (data && data.length > 0) {
      for (const d of data) {
        // Fetch Deal Action
        let deal_action = {};
        let responsible_user = (d.responsible && d.responsible['value']) ? d.responsible['value'] : null;
        if(responsible_user){
          deal_action = await DealAction.findOne({deal: d._id,user: responsible_user, action: { $ne: "deal_cancel" }},{action:1}).sort({ updated_at: -1 });
        }
        d['is_deal_won']= !deal_action ? 2 : (deal_action.action && deal_action.action === "deal_won" ? 1 : (deal_action.action && deal_action.action === "deal_cancel" ? 3 : 0));
        const deal_status_obj = helpers.deal_status.find(ele => ele.value==d['is_deal_won']);
        d['deal_status']= (deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '';
        let matched_search_query = false;
        for (const key in d) {
          if (d.hasOwnProperty(key)) {
            var field_value = d[key];
            if(typeof field_value == 'object' && field_value !== null){
              let ref = field_value.ref;
              if(ref == 'country'){
                const country_detail = await Country.findOne({ _id:field_value.value },{title:1}).lean();
                if(country_detail){
                  d[key] = country_detail.title;
                }
                else{
                  d[key] ="-";
                }                
              }
              if(ref == 'industry'){
                const industry_detail = await Industry.findOne({ _id:field_value.value },{title:1}).lean();
                if(industry_detail){
                  d[key] = industry_detail.title;
                }
                else{
                  d[key] ="-";
                }                
              }
              if(ref == 'cluster'){
                const cluster_detail = await Cluster.findOne({ _id:field_value.value },{title:1}).lean();
                if(cluster_detail){
                  d[key] = cluster_detail.title;
                }
                else{
                  d[key] ="-";
                }
              }
              if(ref == 'stage'){
                const stage_detail = await Stage.findOne({ _id:field_value.value },{name:1,color:1}).lean();
                d[key] = (stage_detail && stage_detail.name) ? stage_detail.name : '';
                d["stage_color"] = (stage_detail && stage_detail.color) ? stage_detail.color : '';
              }
              if(ref == 'organization'){
                const organization_detail = await Organization.findOne({ _id:field_value.value },{organization:1}).lean();
                if(organization_detail){
                  d[key] = (organization_detail && organization_detail.organization) ? organization_detail.organization : "-";
                }
                else{
                  d[key] ="-";
                }                
              }
              if(ref == 'contact'){
                const contact_detail = await Contact.findOne({ _id:field_value.value },{contact_name:1,email:1,phone:1}).lean();
                if(contact_detail){
                  d[key] = (contact_detail && contact_detail.contact_name) ? contact_detail.contact_name : "-";
                  d['phone'] = (contact_detail && contact_detail.phone) ? contact_detail.phone : "";
                  d['email'] = (contact_detail && contact_detail.email) ? contact_detail.email : "";
                }
                else{
                  d[key] ="-";
                }                
              }
              if(ref == 'user'){
                const user_detail = await User.findOne({ _id:field_value.value, status:1 },{username:1,photo:1}).lean();
                if(user_detail){
                  d[key] = (user_detail && user_detail.username) ? user_detail.username : "-";
                  let photo = user_detail.photo && fs.existsSync(`./uploads/${user_detail.photo}`) ? `${fullUrl}/uploads/${user_detail.photo}` : "";
                  d["user_photo"] = photo;
                }
                else{
                  d[key] ="-";
                }                
              }
              if(ref == ''){
                d[key] = "";
              }
            }
            if(['est_close_date'].includes(key.toLocaleLowerCase())){
              d[key] = (d[key]) ? moment(d[key]).tz(timezone).format("DD-MM-YYYY") : "";
            }
            if(['follow_up'].includes(key.toLocaleLowerCase())){
              d[key] = (d[key]) ? moment(d[key]).tz(timezone).format("DD-MM-YYYY HH:mm") : "";
            }
            if(d[key].toString().toLocaleLowerCase().includes(main_search_keyword.toString().toLocaleLowerCase()) || (d['phone'] && d['phone'].toString().toLocaleLowerCase().includes(main_search_keyword.toString().toLocaleLowerCase())) || (d['email'] && d['email'].toString().toLocaleLowerCase().includes(main_search_keyword.toString().toLocaleLowerCase()))){
              matched_search_query = true;
            }
          }
        }
        // if((page && page == 'calender' && +d['is_deal_won'] !== 2) || (dealStatus && +d['is_deal_won'] !== +dealStatus)){
        if(dealStatus && +d['is_deal_won'] !== +dealStatus){
          continue;
        }
        if(!matched_search_query && main_search_keyword) continue;
        response_arr.push(d);       
      }
    }

    const page1 = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = FrontDealLimit;
    const totalRecords = response_arr.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page1 * recordsPerPage - recordsPerPage);
    var start_record = skipRecords+1 ;
    var end_record = page1*recordsPerPage ;
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
      response_arr = response_arr.sort(helpers.dynamicSort(sort_by, order_by));
    }

    if(page && page == 'calender'){
    }
    else{
      response_arr = response_arr.slice(skipRecords);
      response_arr = response_arr.slice(0,recordsPerPage);
    }
    
    res.status(200).json({
      success: true,
      msg: "Deal get successfully",
      deals: response_arr,
      pagination:{ totalPages:totalPages, currentPage:page1, totalRecords:totalRecords, recordRange:recordRange }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Add New Deal
Router.post("/add", async function (req, res) {
  const mongoose = require("mongoose");
  const Schema = mongoose.Schema;
  try {
    console.log("Data:", req.body);
    var fullUrl = req.protocol + "://" + req.get("host");
    let fields = {};
    let getOrganization= {};
    let getContact= {};
    let getStage= {};
    var getUser = "";
    let response_arr = {};
    let dataFields = req.body;
    for (const key in dataFields) {
      if (dataFields.hasOwnProperty(key)) {
        if(typeof dataFields[key] == 'object'){
          fields[key] = Object; 
          if(dataFields[key] && dataFields[key]["ref"] == 'organization'){
            getOrganization = dataFields[key];
          }
          if(dataFields[key] && dataFields[key]["ref"] == 'contact'){
            getContact = dataFields[key];
          }
          if(dataFields[key] && dataFields[key]["ref"] == 'stage'){
            getStage = dataFields[key];
          } 
        }
        else if(['est_close_date','follow_up'].includes(key.toLocaleLowerCase())){
          fields[key] = Date;  
        }
        else if(['user'].includes(key.toLocaleLowerCase())) {
          var getUser = dataFields[key];
        } 
        else {
          fields[key] = String;  
        }  
      }
    }
    mongoose.model("Deal").schema.add(fields);
    const deal = await new Deal(req.body).save();
    
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    // Manage Log : Start
    let log_param = {
      user:req.body.user,
      action:'deal_created',
      deal: deal._id,
      description:'Deal has been created by'
    };
    if(getOrganization && getOrganization.value){
      log_param['organization'] = getOrganization.value;
    }
    if(getContact && getContact.value){
      log_param['contact'] = getContact.value;
    }
    const log = await new Log(log_param).save();
    // Manage Log : End
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::    

    res.status(200).json({
      success: true,
      msg: "Deal added successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Filter All Deal
Router.post("/filter", async function (req, res) {
  try {
    console.log("param:", req.body);
    var fullUrl = req.protocol + "://" + req.get("host");
    let filter = {};
    var page = (req.query.page) ? req.query.page : '';
    var getStage = "";
    var getUser = "";
    var getDealStatus = "";
    var response_arr = [];
    let dataFields = req.body;
    for (const key in dataFields) {
      if (dataFields.hasOwnProperty(key)) {        
        if (dataFields[key] !== "") {
          // console.log("typeof :",key,typeof dataFields[key]);
          if (typeof dataFields[key] == "object") {
            if(["est_close_date","follow_up"].includes(key.toLocaleLowerCase())){
              let start_date = dataFields[key][0];
              let end_date = dataFields[key][1];            
              // console.log("start_date:",start_date,"  |end_date:",end_date);
              filter = { ...filter, [key]: {$gte: new Date(new Date(start_date).setHours(00, 00, 00)),
                $lt: new Date(new Date(end_date).setHours(23, 59, 59))} };
            }
            else if(dataFields[key] && dataFields[key]['value']){
              if(["deal_status"].includes(key.toLocaleLowerCase())){
                getDealStatus = dataFields[key]['value'];
              }
              else if(!["deal_status"].includes(key.toLocaleLowerCase())){
                filter = { ...filter, [key]: dataFields[key] };
              }              
            }
            else if(dataFields[key] && ["responsible"].includes(key.toLocaleLowerCase())) {
              let new_data = dataFields[key].map((item) => {
                return {
                  ref:"user",
                  value:item
                }
              });
              console.log("dtaa:",dataFields[key]);
              filter = { ...filter, [key]: {$in:new_data} };
            }     
          } else if (["user"].includes(key.toLocaleLowerCase())) {
            var getUser = dataFields[key];
          }
          else {
            filter = {
              ...filter,
              [key]: { $regex: dataFields[key].toString(), $options: "i" },
            };
          }
        }
      }
    }
    console.log("filter:", filter);
    const data = await Deal.find(filter, {}).lean();
    if (data && data.length > 0) {
      for (const d of data) { 
       // Fetch Deal Action
        let deal_action = {};
        let responsible_user = (d.responsible && d.responsible['value']) ? d.responsible['value'] : null;
        if(responsible_user){
          deal_action = await DealAction.findOne({ deal: d._id, user: responsible_user, action: { $ne: "deal_cancel" }}).sort({ updated_at: -1 });
        }
        // else if(getUser){
        //   deal_action = await DealAction.findOne({deal: d._id,user: getUser, action: { $ne: "deal_cancel" }}).sort({ updated_at: -1 });
        // }
        d['is_deal_won']= !deal_action ? 2 : (deal_action.action && deal_action.action === "deal_won" ? 1 : (deal_action.action && deal_action.action === "deal_cancel" ? 3 : 0));
        const deal_status_obj = helpers.deal_status.find(ele => ele.value==d['is_deal_won']);
        d['deal_status']= (deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '';
        if(getDealStatus && +d.is_deal_won !==  +getDealStatus){
          continue;
        }        
        for (const key in d) {
          if (d.hasOwnProperty(key)) {
            var field_value = d[key];
            if(typeof field_value == 'object' && field_value !== null){
              let ref = field_value.ref;
              if(ref == 'country'){
                const country_detail = await Country.findOne({ _id:field_value.value },{title:1}).lean();
                if(country_detail){
                  d[key] = country_detail.title;
                }
                else{
                  d[key] ="-";
                }                
              }
              if(ref == 'industry'){
                const industry_detail = await Industry.findOne({ _id:field_value.value },{title:1}).lean();
                if(industry_detail){
                  d[key] = industry_detail.title;
                }
                else{
                  d[key] ="-";
                }                
              }
              if(ref == 'cluster'){
                const cluster_detail = await Cluster.findOne({ _id:field_value.value },{title:1}).lean();
                if(cluster_detail){
                  d[key] = cluster_detail.title;
                }
                else{
                  d[key] ="-";
                }
              }
              if(ref == 'stage'){
                const stage_detail = await Stage.findOne({ _id:field_value.value },{name:1, _id:1,color:1}).lean();
                d[key] = (stage_detail && stage_detail.name) ? stage_detail.name : '';
                d["stage_id"] = (stage_detail && stage_detail._id) ? stage_detail._id : '';
                d["stage_color"] = (stage_detail && stage_detail.color) ? stage_detail.color : '';
              }
              if(ref == 'organization'){
                const organization_detail = await Organization.findOne({ _id:field_value.value },{organization:1}).lean();
                if(organization_detail){
                  d[key] = (organization_detail && organization_detail.organization) ? organization_detail.organization : "-";
                }
                else{
                  d[key] ="-";
                }                
              }
              if(ref == 'contact'){
                const contact_detail = await Contact.findOne({ _id:field_value.value },{contact_name:1,phone:1,email:1}).lean();
                if(contact_detail){
                  d[key] = (contact_detail && contact_detail.contact_name) ? contact_detail.contact_name : "-";
                  d['phone'] = (contact_detail && contact_detail.phone) ? contact_detail.phone : "";
                  d['email'] = (contact_detail && contact_detail.email) ? contact_detail.email : "";
                }
                else{
                  d[key] ="-";
                }                
              }
              if(ref == 'user'){
                const user_detail = await User.findOne({ _id:field_value.value, status:1 },{username:1,photo:1}).lean();
                if(user_detail){
                  d[key] = (user_detail && user_detail.username) ? user_detail.username : "-";
                  let photo = user_detail.photo && fs.existsSync(`./uploads/${user_detail.photo}`) ? `${fullUrl}/uploads/${user_detail.photo}` : "";
                  d["user_photo"] = photo;
                }
                else{
                  d[key] ="-";
                }                
              }
              if(ref == ''){
                d[key] = "";
              }
            }
            if(['est_close_date'].includes(key.toLocaleLowerCase())){
              d[key] = (d[key]) ? moment(d[key]).format("DD-MM-YYYY") : '';
            }
            if(['follow_up'].includes(key.toLocaleLowerCase())){
              d[key] = (d[key]) ? moment(d[key]).format("DD-MM-YYYY HH:mm:ss") : '';
            }
          }
        }                
        response_arr.push(d);
      }
    }
    const page1 = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = FrontDealLimit;
    const totalRecords = response_arr.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    const skipRecords = parseInt(page1 * recordsPerPage - recordsPerPage);
    var start_record = skipRecords+1 ;
    var end_record = page1*recordsPerPage ;
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
      response_arr = response_arr.sort(helpers.dynamicSort(req.query.sort_by, req.query.order_by));
    }

    if(page && page == 'calender'){
    }
    else{
      response_arr = response_arr.slice(skipRecords);
      response_arr = response_arr.slice(0,recordsPerPage);
    }
 
    res.status(200).json({
      success: true,
      msg: "Deal get successfully",
      deals: response_arr,
      pagination:{ totalPages:totalPages, currentPage:page1, totalRecords:totalRecords, recordRange:recordRange }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Get Single Deal
Router.get("/get/:id", async function (req, res) {
  try {
    let response_arr = {};
    var fullUrl = req.protocol + "://" + req.get("host");
    console.log("req.params:", req.params);
    var user_id = (req.query.user_id) ? req.query.user_id : '';
    var timezone = req.query.timezone ? req.query.timezone : "Etc/UTC";

    const edit = await Deal.findOne({ _id: req.params.id }, {}).lean();
    const detail = await Deal.findOne({ _id: req.params.id }, {}).lean();

    let set_detail = {};
    if (detail) {
      const d = detail;      
      // Fetch Deal Action
      let deal_action = {};
      let responsible_user = (d.responsible && d.responsible['value']) ? d.responsible['value'] : null;
      if(responsible_user){
        deal_action = await DealAction.findOne({deal: d._id,user: responsible_user, action: { $ne: "deal_cancel" }}).sort({ updated_at: -1 });
      }
      d['is_deal_won']= !deal_action ? 2 : (deal_action.action && deal_action.action === "deal_won" ? 1 : (deal_action.action && deal_action.action === "deal_cancel" ? 3 : 0));
      const deal_status_obj = helpers.deal_status.find(ele => ele.value==d['is_deal_won']);
      d['deal_status']= (deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '';

      for (const key in d) {
        if (d.hasOwnProperty(key)) {
          // console.log(`key:${key} | d:${d[key]}`);
          var field_value = d[key];
          if(typeof field_value == 'object'  && field_value !== null){
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
              const stage_detail = await Stage.findOne({ _id:field_value.value },{name:1,color:1}).lean();
              d[key] = (stage_detail && stage_detail.name) ? stage_detail.name : '';
              d["stage_color"] = (stage_detail && stage_detail.color) ? stage_detail.color : '' ;
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
            if(ref == 'contact'){
              const contact_detail = await Contact.findOne({ _id:field_value.value },{contact_name:1,phone:1,email:1}).lean();
              if(contact_detail){
                d[key] = (contact_detail && contact_detail.contact_name) ? contact_detail.contact_name : "-";
                d['phone'] = (contact_detail && contact_detail.phone) ? contact_detail.phone : "";
                d['email'] = (contact_detail && contact_detail.email) ? contact_detail.email : "";
              }
              else{
                d[key] = "-";
              }              
            }
            if(ref == 'user'){
              const user_detail = await User.findOne({ _id:field_value.value, status:1 },{username:1,photo:1}).lean();
              if(user_detail){
                d[key] = (user_detail && user_detail.username) ? user_detail.username : "-";
                let photo = user_detail.photo && fs.existsSync(`./uploads/${user_detail.photo}`) ? `${fullUrl}/uploads/${user_detail.photo}` : "";
                d["user_photo"] = photo;
              }
              else{
                d[key] ="-";
              }                
            }
            if(ref == ''){
              d[key] = "";
            }
          }
          if(['est_close_date'].includes(key.toLocaleLowerCase())){
            d[key] = (d[key]) ? moment(d[key]).tz(timezone).format("DD-MM-YYYY") : "";
          }
          if(['follow_up'].includes(key.toLocaleLowerCase())){
            d[key] = (d[key]) ? moment(d[key]).tz(timezone).format("DD-MM-YYYY HH:mm") : "";
          }
        }
      }
      set_detail = d;
    }

    let set_edit = {};
    if(edit){
      const ed = edit;
      for (const key in ed) {
        if (ed.hasOwnProperty(key)) {
          // console.log(`key:${key} | d:${ed[key]}`);
          var field_value = ed[key];
          if(typeof field_value == 'object'  && field_value !== null){
            // console.log("field_value:",field_value);
            let ref = field_value.ref;
            let value = field_value.value;
            if(ref == 'country'){
              const country_detail = await Country.findOne({ _id:field_value.value },{_id:1});
              if(country_detail){
                ed[key] = { ref:ref, value:country_detail._id } ;
              }
              else{
                ed[key] = "" ;
              }              
            }
            if(ref == 'industry'){
              const industry_detail = await Industry.findOne({ _id:field_value.value },{_id:1});
              if(industry_detail){
                ed[key] =  { ref:ref, value:industry_detail._id };
              }
              else{
                ed[key] = "" ;
              }              
            }
            if(ref == 'cluster'){
              const cluster_detail = await Cluster.findOne({ _id:field_value.value },{_id:1});
              if(cluster_detail){
                ed[key] = { ref:ref, value:cluster_detail._id };
              }
              else{
                ed[key] = "" ;
              }              
            }
            if(ref == 'stage'){
              const stage_detail = await Stage.findOne({ _id:field_value.value },{_id:1});
              ed[key] = (stage_detail) ? { ref:ref, value:stage_detail._id } : '';
            }
            if(ref == 'organization'){
              const organization_detail = await Organization.findOne({ _id:field_value.value },{_id:1});
              if(organization_detail){
                ed[key] = { ref:ref, value:organization_detail._id };
              }
              else{
                ed[key] = "" ;
              }              
            }
            if(ref == 'contact'){
              const contact_detail = await Contact.findOne({ _id:field_value.value },{_id:1});
              if(contact_detail){
                ed[key] = { ref:ref, value:contact_detail._id };
              }
              else{
                ed[key] = "" ;
              }              
            }
            if(ref == 'user'){
              const user_detail = await User.findOne({ _id:field_value.value, status:1 },{_id:1}).lean();
              if(user_detail){
                ed[key] = { ref:ref, value:user_detail._id };
              }
              else{
                ed[key] = "" ;
              }                
            }
            if(ref == ''){
              ed[key] = {ref:"",value:""};
            }
          }
          if(['est_close_date'].includes(key.toLocaleLowerCase())){
            ed[key] = (ed[key]) ? moment(ed[key]).tz(timezone).format("YYYY-MM-DD") : "";
          }
          if(['follow_up'].includes(key.toLocaleLowerCase())){
            ed[key] = (ed[key]) ? moment(ed[key]).tz(timezone).format("YYYY-MM-DD HH:mm:ss") : "";
          }
        }
      }      
      set_edit = ed;
    }

    // console.log("edit:", edit, "detail:", set_detail);
    res.status(200).json({
      success: true,
      msg: "Deal get successfully",
      detail: set_detail,
      edit: set_edit,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Update Deal
Router.post("/update", async function (req, res) {
  const mongoose = require("mongoose");
  const Schema = mongoose.Schema;
  try {
    let response_arr = {};
    var fullUrl = req.protocol + "://" + req.get("host");
    console.log("Data:", req.body);
    var timezone = req.body.timezone ? req.body.timezone : "Etc/UTC";

    // Check Existing
    const check_exist = await Deal.findById(req.body._id);
    if (!check_exist) {
      res.status(200).json({
        success: false,
        msg: "Deal not found",
      });
    }

    let fields = {};
    let finalData = {};
    let getOrganization = {};
    let getContact = {};
    let getStage = {};
    let getUser = "";
    let dataFields = req.body.data;
    for (const key in dataFields) {
      if (dataFields.hasOwnProperty(key)) {
        if(typeof dataFields[key] == 'object'){
          fields[key] = Object;
          if(dataFields[key] && dataFields[key]["ref"] == 'organization'){
            getOrganization = dataFields[key];
          }
          if(dataFields[key] && dataFields[key]["ref"] == 'contact'){
            getContact = dataFields[key];
          }
          if(dataFields[key] && dataFields[key]["ref"] == 'stage'){
            getStage = dataFields[key];
          } 
        }
        else if(['est_close_date','follow_up'].includes(key.toLocaleLowerCase())){
          fields[key] = Date;  
        }
        else if(!['user'].includes(key.toLocaleLowerCase())) {
          fields[key] = String;
        }
        if(!['user'].includes(key.toLocaleLowerCase())){
          finalData[key] = dataFields[key];  
        }

        if(['user'].includes(key.toLocaleLowerCase())){
          getUser = dataFields[key];  
        }
      }
    }
    mongoose.model("Deal").schema.add(fields);
    const deal = await Deal.findOneAndUpdate({ _id: req.body._id },{ $set: finalData },{ multi: true, new: true });
    
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    // Manage Log : Start
    let log_param = {
      user:req.body.data.user,
      action:'edit_detail',
      deal:deal._id,
      description:'Deal details are edited by'
    };
    if(getOrganization && getOrganization.value){
      log_param['organization'] = getOrganization.value;
    }
    if(getContact && getContact.value){
      log_param['contact'] = getContact.value;
    }
    const log = await new Log(log_param).save();
    // Manage Log : End
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    // Send Mail and Notification to owner : Start
    // Fetch Reciever Detail
    const get_rec_user = await Deal.findOne({_id:req.body._id},{}).populate({ path:'user', select:{ username:1, email:1, photo:1 } }).lean();
    // Fetch Sender Detail
    const get_sender_detail = await User.findOne({_id:req.body.data.user}).lean();
    // console.log("get_sender_detail:",get_sender_detail);
    if(get_rec_user){
      // Check Notification Settings
      const notification_settings = await Setting.findOne({user:get_rec_user.user._id}).lean();
      // console.log("get_rec_user:",get_rec_user);
     
      // Send Notes Notification
      if(notification_settings && notification_settings.edit_detail_notification && (get_rec_user.user._id.toString() !== get_sender_detail._id.toString())){
        let notes_param = {
          user:get_rec_user.user._id,
          from:get_sender_detail._id,
          messsage:'',
          type:'edit_detail',
          deal:req.body._id,
        }
        const send_note = await new Notification(notes_param).save();
      }
    }
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    // Find Latest Deal Stage
    const edit = await Deal.findOne({ _id: req.body._id }, {}).lean();
    let setEdit = {};
    if(edit){
      let ed = edit;

      // Fetch Deal Action
      let deal_action = {};
      let responsible_user = (ed.responsible && ed.responsible['value']) ? ed.responsible['value'] : null;
      if(responsible_user){
        deal_action = await DealAction.findOne({deal: ed._id,user: responsible_user, action: { $ne: "deal_cancel" }}).sort({ updated_at: -1 });
      }
      ed['is_deal_won']= !deal_action ? 2 : (deal_action.action && deal_action.action === "deal_won" ? 1 : (deal_action.action && deal_action.action === "deal_cancel" ? 3 : 0));
      const deal_status_obj = helpers.deal_status.find(ele => ele.value==ed['is_deal_won']);
      ed['deal_status']= (deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '';

      for (const key in ed) {
        if (ed.hasOwnProperty(key)) {
          // console.log(`key:${key} | d:${ed[key]}`);
          var field_value = ed[key];
          if(typeof field_value == 'object' && field_value !== null){
            // console.log("field_value:",field_value);
            let ref = field_value.ref;
            if(ref == 'country'){
              const country_detail = await Country.findOne({ _id:field_value.value },{title:1});
              if(country_detail){
                ed[key] = country_detail.title;
              }
              else{
                ed[key] ="-";
              }              
            }
            if(ref == 'industry'){
              const industry_detail = await Industry.findOne({ _id:field_value.value },{title:1});
              if(industry_detail){
                ed[key] = industry_detail.title;
              }
              else{
                ed[key] ="-";
              }
            }
            if(ref == 'cluster'){
              const cluster_detail = await Cluster.findOne({ _id:field_value.value },{title:1});
              if(cluster_detail){
                ed[key] = cluster_detail.title;
              }
              else{
                ed[key] ="-";
              }
            }
            if(ref == 'stage'){
              const stage_detail = await Stage.findOne({ _id:field_value.value },{name:1});
              ed[key] = stage_detail.name;
            }
            if(ref == 'organization'){
              const organization_detail = await Organization.findOne({ _id:field_value.value },{organization:1});
              if(organization_detail){
                ed[key] = (organization_detail && organization_detail.organization) ? organization_detail.organization : "-";
              }
              else{
                ed[key] ="-";
              }              
            }
            if(ref == 'contact'){
              const contact_detail = await Contact.findOne({ _id:field_value.value },{contact_name:1}).lean();
              if(contact_detail){
                ed[key] = (contact_detail && contact_detail.contact_name) ? contact_detail.contact_name : "-";
              }
              else{
                ed[key] ="-";
              }              
            }
            if(ref == 'user'){
              const user_detail = await User.findOne({ _id:field_value.value },{username:1,photo:1}).lean();
              if(user_detail){
                ed[key] = (user_detail && user_detail.username) ? user_detail.username : "-";
                let photo = user_detail.photo && fs.existsSync(`./uploads/${user_detail.photo}`) ? `${fullUrl}/uploads/${user_detail.photo}` : "";
                ed["user_photo"] = photo;
              }
              else{
                ed[key] ="-";
              }                
            }
            if(ref == ''){
              ed[key] = {ref:"",value:""};
            }
          }
          if(['est_close_date'].includes(key.toLocaleLowerCase())){
            ed[key] = (ed[key]) ? moment(ed[key]).tz(timezone).format("DD-MM-YYYY") : "";
          }
          if(['follow_up'].includes(key.toLocaleLowerCase())){
            ed[key] = (ed[key]) ? moment(ed[key]).tz(timezone).format("DD-MM-YYYY HH:mm:ss") : "";
          }
        }
      }
      setEdit = ed;
    }

    const list = await Deal.findOne({ _id: req.body._id }, {}).lean();
    if(list){
      let d = list;

      // Fetch Deal Action
      let deal_action = {};
      let responsible_user = (d.responsible && d.responsible['value']) ? d.responsible['value'] : null;
      if(responsible_user){
        deal_action = await DealAction.findOne({deal: d._id,user: responsible_user, action: { $ne: "deal_cancel" }}).sort({ updated_at: -1 });
      }
      d['is_deal_won']= !deal_action ? 2 : (deal_action.action && deal_action.action === "deal_won" ? 1 : (deal_action.action && deal_action.action === "deal_cancel" ? 3 : 0));
      const deal_status_obj = helpers.deal_status.find(ele => ele.value==d['is_deal_won']);
      d['deal_status']= (deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '';

      for (const key in d) {
        if (d.hasOwnProperty(key)) {
          var field_value = d[key];
          if(typeof field_value == 'object' && field_value !== null){
            let ref = field_value.ref;
            if(ref == 'country'){
              const country_detail = await Country.findOne({ _id:field_value.value },{title:1}).lean();
              d[key] = country_detail.title;
            }
            if(ref == 'industry'){
              const industry_detail = await Industry.findOne({ _id:field_value.value },{title:1}).lean();
              if(industry_detail){
                d[key] = industry_detail.title;
              }
              else{
                d[key] ="-";
              }              
            }
            if(ref == 'cluster'){
              const cluster_detail = await Cluster.findOne({ _id:field_value.value },{title:1}).lean();
              if(cluster_detail){
                d[key] = cluster_detail.title;
              }
              else{
                d[key] ="-";
              }
            }
            if(ref == 'stage'){
              const stage_detail = await Stage.findOne({ _id:field_value.value },{name:1,color:1}).lean();
              d[key] = (stage_detail && stage_detail.name) ? stage_detail.name : '';
              d["stage_color"] = (stage_detail && stage_detail.color) ? stage_detail.color : '' ;
            }
            if(ref == 'organization'){
              const organization_detail = await Organization.findOne({ _id:field_value.value },{organization:1}).lean();
              if(organization_detail){
                d[key] = (organization_detail && organization_detail.organization) ? organization_detail.organization : "-";
              }
              else{
                d[key] ="-";
              }              
            }
            if(ref == 'contact'){
              const contact_detail = await Contact.findOne({ _id:field_value.value },{contact_name:1,phone:1,email:1}).lean();
              if(contact_detail){
                d[key] = (contact_detail && contact_detail.contact_name) ? contact_detail.contact_name : "-";
                d['phone'] = (contact_detail && contact_detail.phone) ? contact_detail.phone : "";
                d['email'] = (contact_detail && contact_detail.email) ? contact_detail.email : "";
              }
              else{
                d[key] ="-";
              }              
            }
            if(ref == 'user'){
              const user_detail = await User.findOne({ _id:field_value.value },{username:1,photo:1}).lean();
              if(user_detail){
                d[key] = (user_detail && user_detail.username) ? user_detail.username : "-";
                let photo = user_detail.photo && fs.existsSync(`./uploads/${user_detail.photo}`) ? `${fullUrl}/uploads/${user_detail.photo}` : "";
                d["user_photo"] = photo;
              }
              else{
                d[key] ="-";
              }                
            }
            if(ref == ''){
              d[key] = "";
            }
          }
          if(['est_close_date'].includes(key.toLocaleLowerCase())){
            d[key] = (d[key]) ? moment(d[key]).tz(timezone).format("DD-MM-YYYY") : "";
          }
          if(['follow_up'].includes(key.toLocaleLowerCase())){
            d[key] = (d[key]) ? moment(d[key]).tz(timezone).format("DD-MM-YYYY HH:mm:ss") : "";
          }
        }
      }
      response_arr = d;
    }

    res.status(200).json({
      success: true,
      msg: "Deal updated successfully",
      list: response_arr,
      edit: setEdit,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Add New Deal Notes
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
    const get_rec_user = await Deal.findOne({_id:req.body.deal},{}).populate({ path:'user', select:{ username:1, email:1, photo:1 } }).lean();
    let responsible_detail = "";
    if(get_rec_user && get_rec_user.responsible && typeof get_rec_user.responsible == 'object' && get_rec_user.responsible.ref=='user' && get_rec_user.responsible.value){
      responsible_detail = await User.findOne({_id:get_rec_user.responsible.value},{username:1}).lean();
    }
    // console.log("responsible_detail:",responsible_detail," | get_rec_user.responsible:",get_rec_user.responsible," | typeof get_rec_user.responsible:",typeof get_rec_user.responsible);

    // Fetch Sender Detail
    const get_sender_detail = await User.findOne({_id:saved_note.user}).lean();
    // console.log("get_sender_detail:",get_sender_detail);

    if(get_rec_user){
      // Check Notification Settings
      const notification_settings = await Setting.findOne({user:get_rec_user.user._id}).lean();

      // console.log("get_rec_user:",get_rec_user);
      // Send Notes Mail
      if(notification_settings && notification_settings.new_notes_email && (get_rec_user.user._id.toString() !== get_sender_detail._id.toString())){
        var mailOptions = {
          to: get_rec_user.user.email,
          from: process.env.MAILER_EMAIL_ID,
          template: "notes-email",
          subject: "New Notes Added!",
          context: {
            name: get_rec_user.user.username,
            sender: get_sender_detail.username,
            module_name:`Deal Responsible:${(responsible_detail && responsible_detail.username) ? responsible_detail.username : ''}`,
            notes:saved_note.description,
            logo:fullUrl+'/uploads/assets/logo.png'
          },
        };
        mailer.sendMail(mailOptions);
      }

      // Send Notes Notification
      if(notification_settings && notification_settings.new_notes_notification && (get_rec_user.user._id.toString() !== get_sender_detail._id.toString())){
        let notes_param = {
          user:get_rec_user.user._id,
          from:get_sender_detail._id,
          message:saved_note.description,
          type:'add_deal_note',
          deal:req.body.deal,
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
      deal:req.body.deal,
      description:'Deal Notes are added by',
      note_message:req.body.description
    };
    if(req.body.organization){
      log_param['organization'] = req.body.organization;
    }
    if(req.body.contact){
      log_param['contact'] = req.body.contact
    }
    const log = await new Log(log_param).save();
    // Manage Log : End
    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    // Fetch Notes
    const notes = await Note.find({ _id: saved_note._id })
      .populate({ path:'deal' })
      .populate({ path: "user", select: { username: 1, photo: 1, _id:1 } })
      .lean();
      if (notes && notes.length > 0) {
        for (const note of notes) {
          var title = "";
          var ref_id = '';
          if (note.notes_type === "deal") {
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
            _id: note._id,
            ref_id:ref_id,
            title: title,
            sender_id: note && note.user ? note.user._id : "",
            sender: note && note.user ? note.user.username : "Sender",
            sender_photo: note && note.user && note.user.photo && fs.existsSync(`./uploads/${note.user.photo}`)
              ? `${fullUrl}/uploads/${note.user.photo}` : "",
            notes: note.description,
            note_message: note.note_message ? note.note_message : '',
            notes_type: note.notes_type,
            created_at: moment(note.created_at).tz(timezone).format("YYYY-MM-DD HH:mm:ss"),
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

// Defined Get Deal Log
Router.get("/logs/all", async function (req, res) {
  try {
    const response_arr = [];
    console.log("req.query:", req.query);
    var filter = {};
    if (req.query.deal_id) {
      filter = { ...filter, deal: req.query.deal_id };
    }
    var timezone = req.query.timezone ? req.query.timezone : "Etc/UTC";
    const data = await Log.find(filter, {})
      .populate({ path: "user", select: { username: 1 } })
      .lean();

    if (data && data.length > 0) {
      for (const d of data) {
        d.created_at = moment(d.created_at).tz(timezone).format("YYYY-MM-DD HH:mm:ss");
        d.username = d.user && d.user.username ? d.user.username : "";
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

// Defined Get Deal Notes
Router.get("/notes/all", async function (req, res) {
  try {
    const response_arr = [];
    console.log("Data:", req.body);
    var fullUrl = req.protocol + "://" + req.get("host");
    var filter = { };
    if (req.query.deal_id) {
      filter = { ...filter, deal: req.query.deal_id };
    }
    var timezone = req.query.timezone ? req.query.timezone : "Etc/UTC";

    const notes = await Note.find(filter)
    .populate({ path:'deal' })
    .populate({ path: "user", select: { username: 1, photo: 1, _id:1 } })
      .lean();

    if (notes && notes.length > 0) {
      for (const note of notes) {
        var title = "";
        var ref_id = '';
        if (note.notes_type === "deal") {
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
          _id: note._id,
          ref_id:ref_id,
          title: title,
          sender_id: note && note.user ? note.user._id : "",
          sender: note && note.user ? note.user.username : "Sender",
          sender_photo: note && note.user && note.user.photo && fs.existsSync(`./uploads/${note.user.photo}`)
            ? `${fullUrl}/uploads/${note.user.photo}` : "",
          notes: note.description,
          notes_type: note.notes_type,
          note_message: note.note_message ? note.note_message : '',
          created_at: moment(note.created_at).tz(timezone).format("YYYY-MM-DD HH:mm:ss"),
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

// Defined Delete Deal
Router.delete("/delete/:id", async function (req, res) {
  try {
    console.log("req.params:", req.params);
    // Get Data
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(200).json({
        success: false,
        msg: "No data found",
      });
    }

    await Deal.findByIdAndRemove({ _id: req.params.id });
    await DealStage.remove({ deal: req.params.id });
    await DealAction.remove({ deal: req.params.id });
    await Log.remove({ deal: req.params.id });
    await Note.remove({ deal: req.params.id });

    res.status(200).json({
      success: true,
      msg: "Deal deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Update Deal Action
Router.post("/updateAction", async function (req, res) {
  try {
    console.log("Data:", req.body);

    // For Pending Deal
    if(req.body.action && req.body.action==='deal_pending'){
      await DealAction.remove({deal:req.body.deal,user:req.body.user});
      return res.status(200).json({
        success: true,
        msg: "Deal action changed to pending successfully.",
      });
    }

    // Find and Update
    const query = {deal:req.body.deal, user:req.body.user,action: req.body.action};
    const update = { $set: { action: req.body.action,reason:req.body.reason } };
    const options = { upsert: true };
    const updated = await DealAction.updateOne(query, update, options);

    // Manage Log : Start
    let log_param = {
      user: req.body.user,
      action: req.body.action,
      deal: req.body.deal,
      description: (req.body.action === "deal_won") ? "Deal won by" : (req.body.action === "deal_cancel") ? "Deal cancel by" : "Deal lost by",
    };
    const log = await new Log(log_param).save();
    // Manage Log : End


    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
    // Send Mail and Notification to owner : Start
    // Fetch Reciever Detail
    const get_rec_user = await Deal.findOne({_id:req.body.deal},{}).populate({ path:'user', select:{ username:1, email:1, photo:1 } }).lean();
    // Fetch Sender Detail
    const get_sender_detail = await User.findOne({_id:req.body.user}).lean();
    // console.log("get_sender_detail:",get_sender_detail);
    if(get_rec_user){
      // Check Notification Settings
      const notification_settings = await Setting.findOne({user:get_rec_user.user._id}).lean();
      // console.log("get_rec_user:",get_rec_user);
      // Send Notes Notification
      if(notification_settings && notification_settings.change_deal_status_notification && (get_rec_user.user._id.toString() !== get_sender_detail._id.toString())){
        let notes_param = {
          user:get_rec_user.user._id,
          from:get_sender_detail._id,
          message:req.body.action,
          type:'edit_deal_status',
          deal:req.body.deal,
        }
        const send_note = await new Notification(notes_param).save();
      }
    }

    //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::

    res.status(200).json({
      success: true,
      msg: "Deal action successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Import Deals
Router.post("/import", async function (req, res) {
  try {
    const mongoose = require("mongoose");
    const Schema = mongoose.Schema;
    
    const response_arr = [];
    console.log("Body:",req.body);
    const user = (req.body.user) ? req.body.user : '';
    const rows = (req.body.rows) ? req.body.rows : [];
    let responsible_user = '';
    let fields = {};
    let success_data_arr = [];
    let failed_data_arr = [];
    if(rows && rows.length > 0){
      for (const [index, row] of rows.entries()) {
        // for (const row of rows) {
        let newObj = {user:user};
        let failed_flag = false;
        let error = '';
        let deal_status = '';
        for (const rkey in row) {
          if (row.hasOwnProperty(rkey)) {
            let newKey = helpers.convertToSlug(rkey);
            let column_value = row[rkey];
            
            // Manage Table Column 
            if(index == 0){
              if(['organization','contact_name','responsible','stage'].includes(newKey)) {
                fields[newKey] = Object;
              }
              else if(['est_close_date','follow_up'].includes(newKey)){
                fields[newKey] = Date;  
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
            if(newKey == 'contact_name' && column_value){
              const contactDetail = await Contact.findOne({ contact_name:{'$regex' : `^${column_value}$` , '$options' : 'i'} }, {contact_name:1}).lean();
              // console.log("contactDetail:",contactDetail);
              if(contactDetail && contactDetail._id){
                column_value = {
                  "ref": "contact",
                  "value": contactDetail._id.toString()
                }
              }
              else{
                column_value = "";
                error = 'contact_name_not_found';
                failed_flag = true;
              }              
            }
            else if(newKey == 'responsible'  && column_value){
              const responsibleDetail = await User.findOne({ username:{'$regex' : `^${column_value}$` , '$options' : 'i'}, status:1 }, {username:1}).lean();
              // console.log("responsibleDetail:",responsibleDetail);
              if(responsibleDetail && responsibleDetail._id){
                column_value = {
                  "ref": "user",
                  "value": responsibleDetail._id.toString()
                }
                responsible_user = responsibleDetail._id;
              }
              else{
                column_value = "";
                error = 'responsible_user_not_found';
                failed_flag = true;
              }
            }
            else if(newKey == 'stage'  && column_value){
              const stageDetail = await Stage.findOne({ name:{'$regex' : `^${column_value}$` , '$options' : 'i'}}, {name:1}).lean();
              // console.log("stageDetail:",stageDetail);
              if(stageDetail && stageDetail._id){
                column_value = {
                  "ref": "stage",
                  "value": stageDetail._id.toString()
                }
              }
              else{
                column_value = "";
                error = 'stage_not_found';
                failed_flag = true;
              }
            }
            else if(newKey == 'deal_status'  && column_value){
              column_value = column_value.toLowerCase();
              deal_status = (column_value == 'won') ? 'deal_won' : ( (column_value == 'lost') ? 'deal_lost' : 'deal_pending' );
            }
            // else if(['est_close_date','follow_up'].includes(newKey)  && column_value){
              
            // }

            if(!['deal_status'].includes(newKey)) {
              if(error){
                newObj = {...newObj, error:error};
              }
              newObj = {...newObj, [newKey]:column_value};
            }            
          }
        }

        if(index == 0){
          mongoose.model('Deal').schema.add(fields);
        }
        if(!failed_flag){
          // new_data_arr.push(newObj)
          const deal = await new Deal(newObj).save();
          if(deal){
            success_data_arr.push(deal);
            //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
            // Manage Log : Start
            let log_param = {
              user:req.body.user,
              action:'deal_created',
              deal: deal._id,
              description:'Deal has been created by'
            };
            if(deal.organization && deal.organization.value){
              log_param['organization'] = deal.organization.value;
            }
            if(deal.contact_name && deal.contact_name.value){
              log_param['contact'] = deal.contact_name.value;
            }
            const log = await new Log(log_param).save();
            // Manage Log : End
            //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
            // Manage Deal Status : Start
            console.log("deal_statusLLL",deal_status);
            if(deal_status == 'deal_pending'){
              await DealAction.remove({deal:deal._id,user:req.body.user});
            }
            else if(responsible_user){
                console.log("ddd");
                // Find and Update
                const query = {deal:deal._id, user:responsible_user};
                const update = { $set: { action: deal_status,reason:'' } };
                const options = { upsert: true };
                const updated = await DealAction.updateOne(query, update, options);
                console.log("updated",updated);
            }
            // Manage Deal Status : End
            //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
          }
        }
        else{
          failed_data_arr.push(newObj);
        }
      }
      // console.log("fields:",fields);
      console.log("success_data_arr:",success_data_arr);
      console.log("failed_data_arr:",failed_data_arr);
    }
  
    if(failed_data_arr.length == 0){
      res.status(200).json({
        success: true,
        msg: "Deal import successfully!",
        total_count: rows.length,
        success_count: success_data_arr.length,
        failed_count: failed_data_arr.length,
        failed_records: failed_data_arr,
      });
    }
    else{
      res.status(200).json({
        success: false,
        msg: "Deal could not imported! May be they are already exists!",
        total_count: rows.length,
        success_count: success_data_arr.length,
        failed_count: failed_data_arr.length,
        failed_records: failed_data_arr,
      });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Get Deal Lost Reasons
Router.get("/allLostReasons", async function (req, res) {
  try {
    const response_arr = [];
   
    const reasons = await Reason.find({status:1}).lean();

    if (reasons && reasons.length > 0) {
      for (const reason of reasons) {
        response_arr.push({
          _id: reason._id,
          title: reason.title,
        });
      }
    }
    res.status(200).json({
      success: true,
      msg: "Reasons get successfully",
      reasons: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Get All Cancel Deal
Router.get("/allCancel", async function (req, res) {
  try {
    var fullUrl = req.protocol + "://" + req.get("host");
    var timezone = req.query.timezone ? req.query.timezone : "Etc/UTC";
    var response_arr = [];
    var deal_user = (req.query.deal_user) ? req.query.deal_user : '';
    var sort_by = (req.query.sort_by) ? req.query.sort_by : '';
    var order_by = (req.query.order_by) ? req.query.order_by : '';
    var date_range    = req.query.date_range ? req.query.date_range : '';
    var filter = {action:'deal_cancel' };
    var main_search_keyword = (req.query.main_search_keyword) ? req.query.main_search_keyword : '';

    if(deal_user){
      filter = { ...filter, user:deal_user };
    }

    if(date_range){
      let split_date  = date_range.split(",");
      let start_date  = split_date[0];
      let end_date    = split_date[1];            
      filter = { ...filter, 'updated_at': {$gte: new Date(new Date(start_date).setHours(00, 00, 00)),
        $lt: new Date(new Date(end_date).setHours(23, 59, 59))} };
    }
   
    var data = await DealAction.find(filter).lean({ virtuals: true }).sort({ _id: -1 });
    if(data && data.length > 0){
      for (const report of data) {
        let action_id = report._id;
        let deal_id = report.deal;
        let reason_id  = report.reason;
        let reported_user_id  = report.user;
        let organization = '';
        let contact_name = '';
        let phone = '';
        let email = '';
        let responsible = '';
        let lost_reason = '';
        let reported_user = '';
        let value = '';
        let matched_search_query = false;

        const dealInfo = await Deal.findById(deal_id,{contact_name:1,responsible:1,organization:1,value:1}).lean();
        if(dealInfo){
          if(dealInfo.organization && dealInfo.organization.value){
            const organizationInfo = await Organization.findById(dealInfo.organization.value, {organization:1}).lean();
            organization = (organizationInfo) ? organizationInfo.organization : '';
          }
          if(dealInfo.contact_name && dealInfo.contact_name.value){
            const contactInfo = await Contact.findById(dealInfo.contact_name.value, {contact_name:1,phone:1,email:1}).lean();
            contact_name = (contactInfo) ? contactInfo.contact_name : '';
            phone = (contactInfo) ? contactInfo.phone : '';
            email = (contactInfo) ? contactInfo.email : '';
          }
          if(dealInfo.responsible && dealInfo.responsible.value){
            const responsibleInfo = await User.findById(dealInfo.responsible.value, {username:1}).lean();
            responsible = (responsibleInfo) ? responsibleInfo.username : '';
          }          
          if(reason_id){
            const reasonInfo = await Reason.findById(reason_id, {title:1}).lean();
            lost_reason = (reasonInfo) ? reasonInfo.title : '';
          }
          if(reported_user_id){
            const reportUserInfo = await User.findById(reported_user_id, {username:1}).lean();
            reported_user = (reportUserInfo) ? reportUserInfo.username : '';
          }
          if(dealInfo.value){
            value = dealInfo.value;
          }      
          
          if (
            organization
              .toString()
              .toLocaleLowerCase()
              .includes(main_search_keyword.toString().toLocaleLowerCase()) ||
            contact_name
              .toString()
              .toLocaleLowerCase()
              .includes(main_search_keyword.toString().toLocaleLowerCase()) ||
            phone
                .toString()
                .toLocaleLowerCase()
                .includes(main_search_keyword.toString().toLocaleLowerCase()) ||
            email
                .toString()
                .toLocaleLowerCase()
                .includes(main_search_keyword.toString().toLocaleLowerCase()) ||
            lost_reason
                .toString()
                .toLocaleLowerCase()
                .includes(main_search_keyword.toString().toLocaleLowerCase()) ||
            value
                .toString()
                .toLocaleLowerCase()
                .includes(main_search_keyword.toString().toLocaleLowerCase())
          ) {
            matched_search_query = true;
          }

          if(!matched_search_query && main_search_keyword) continue; 
              
          // Get Deal Data
          response_arr.push({
            "_id":action_id,
            "deal_id":deal_id, 
            "organization":organization, 
            "contact_name":contact_name, 
            "phone":phone, 
            "email":email,
            "responsible":responsible, 
            "reported_user":reported_user,
            "lost_reason":lost_reason, 
            "value":value, 
            "action_date_time":moment(report.updated_at).tz(timezone).format("DD-MM-YYYY HH:mm:ss"),
          });
        }        
      }
    }

    const page = req.query.current_page ? req.query.current_page : 1;
    const recordsPerPage = CancelDealLimit;
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
      response_arr = response_arr.sort(helpers.dynamicSort(sort_by, order_by));
    }

    response_arr = response_arr.slice(skipRecords);
    response_arr = response_arr.slice(0,recordsPerPage);

    res.status(200).json({
      success: true,
      msg: "Cancel Deals get successfully",
      list: response_arr,
      pagination: { recordsPerPage, totalRecords, totalPages, currentPage:page, recordRange },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Delete Cancel Deal
Router.delete("/deleteCancel/:id", async function (req, res) {
  try {
    console.log("req.params:", req.params);
    // Get Data
    const deal = await DealAction.remove({_id:req.params.id});
    if (!deal) {
      return res.status(200).json({
        success: false,
        msg: "No data found",
      });
    }

    res.status(200).json({
      success: true,
      msg: "Cancel Deal deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});
module.exports = Router;
