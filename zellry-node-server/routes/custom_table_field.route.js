const express = require("express");
const tableRouter = express.Router();
const helpers = require('../utils/helpers');
const fs = require("fs");
const { CustomTable,Country,Industry,Cluster,Stage, Organization, Contact, User } = require('../model');

// Defined Get Organisation Fields
tableRouter.get('/getOrganisationFields', async function (req, res) {
  try {
    const response_arr = [];
    const data = await CustomTable.find({ slug_name:'org' },{ table_name:1,column_name:1,column_slug:1,column_type:1, is_editable:1, is_sortable:1, is_filterable:1, is_required:1 }).lean().populate({path:'values',select: 'column_value ref -_id -custom_table'}).sort({'position':1});

    if(data && data.length > 0) {
      for (const d of data) {
        let column_slug = d.column_slug;
        let values = d.values;
        let new_values = [];
        if (values.length > 0) {
          for (const v of values) {
            let column_value = v.column_value;
            let ref = v.ref;
            if (ref && ref === "country") {
              const country = await Country.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(country){
                new_values.push({ value:country._id,label:country.title,ref:ref });
              }              
            } else if (ref && ref === "industry") {
              const industry = await Industry.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(industry){
                new_values.push({ value:industry._id,label:industry.title,ref:ref });
              }              
            } else if (ref && ref === "cluster") {
              const cluster = await Cluster.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(cluster){
                new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
              }
              
            } else if (ref && ref === "stage") {
              const stage = await Stage.findOne(
                { _id: column_value },
                { name: 1 }
              ).lean();
              if(stage){
                new_values.push( { value:stage._id,label:stage.name,ref:ref });
              }              
            } 
            else if (ref && ref === "deal_status") {
              const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
              new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
            }
            else {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            }
          }
          d.values = new_values;
        }        
        response_arr.push(d);
      }
    }
    res.status(200).json({
      success: true,
      msg: "Organisation get successfully",
      fields: response_arr,
    });

  } catch (error) {
    res.status(400).json({success: false, message:error.message});
  }
});

// Defined Get Contact Fields
tableRouter.get('/getContactFields', async function (req, res) {
  try {
    const response_arr = [];
    const data = await CustomTable.find({ slug_name:'contact' },{ table_name:1,column_name:1,column_slug:1,column_type:1, is_editable:1, is_sortable:1, is_filterable:1, is_required:1  }).lean().populate({path:'values',select: 'column_value ref -_id -custom_table'}).sort({'position':1});
    if(data && data.length > 0) {
      for (const d of data) {
        let column_slug = d.column_slug;
        let values = d.values;
        let new_values = [];
        if (values.length > 0) {
          for (const v of values) {
            let column_value = v.column_value;
            let ref = v.ref;
            if (ref && ref === "country") {
              const country = await Country.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(country){
                new_values.push({ value:country._id,label:country.title,ref:ref });
              }              
            } else if (ref && ref === "industry") {
              const industry = await Industry.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(industry){
                new_values.push({ value:industry._id,label:industry.title,ref:ref });
              }              
            } else if (ref && ref === "cluster") {
              const cluster = await Cluster.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(cluster){
                new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
              }              
            } else if (ref && ref === "stage") {
              const stage = await Stage.findOne(
                { _id: column_value },
                { name: 1 }
              ).lean();
              if(stage){
                new_values.push( { value:stage._id,label:stage.name,ref:ref });
              }
              
            } 
            else if (ref && ref === "deal_status") {
              const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
              new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
            }
            else if (ref && ref === "organization") {
              const organization = await Organization.find({ }, { organization: 1, country :1 }).lean();
              if(organization && organization.length > 0){
                for (const org of organization) {
                  let country_id = (org.country && org.country.value) ?  org.country.value : '';
                  let country_detail = {};
                  if(country_id){
                    country_detail = await Country.findOne({ _id:country_id }, { title: 1 }).lean();
                  }
                  new_values.push({ 
                    value:org._id,
                    label:org.organization,
                    ref:ref, 
                    country_id:(country_detail) ? country_detail._id : '', 
                    country_name:(country_detail) ? country_detail.title : '',
                  });
                }
              }              
            } else {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            }
          }
          d.values = new_values;
        }
        response_arr.push(d);
      }
    }
    res.status(200).json({
      success: true,
      msg: "Contact get successfully",
      fields: response_arr,
    });

  } catch (error) {
    res.status(400).json({success: false, message:error.message});
  }
});

// Defined Get Deal Fields
tableRouter.get('/getDealFields', async function (req, res) {
  try {
    const response_arr = [];
    var fullUrl = req.protocol + "://" + req.get("host");
    const data = await CustomTable.find({ slug_name:'deal' },{ table_name:1,column_name:1,column_slug:1,column_type:1, is_editable:1, is_sortable:1, is_filterable:1, is_required:1 }).lean().populate({path:'values',select: 'column_value ref -_id -custom_table'}).sort({'position':1});
    if(data && data.length > 0) {
      for (const d of data) {
        let column_slug = d.column_slug;
        let values = d.values;
        let new_values = [];
        if (values.length > 0) {
          for (const v of values) {
            let column_value = v.column_value;
            let ref = v.ref;
            if (ref && ref === "country") {
              const country = await Country.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(country){
                new_values.push({ value:country._id,label:country.title,ref:ref });
              }              
            } else if (ref && ref === "industry") {
              const industry = await Industry.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(industry){
                new_values.push({ value:industry._id,label:industry.title,ref:ref });
              }              
            } else if (ref && ref === "cluster") {
              const cluster = await Cluster.findOne(
                { _id: column_value },
                { title: 1 }
              ).lean();
              if(cluster){
                new_values.push({ value:cluster._id,label:cluster.title,ref:ref });
              }
              
            } else if (ref && ref === "stage") {
              const stage = await Stage.findOne(
                { _id: column_value },
                { name: 1 }
              ).lean();
              if(stage){
                new_values.push( { value:stage._id,label:stage.name,ref:ref });
              }
              
            } 
            else if (ref && ref === "deal_status") {
              const deal_status_obj = helpers.deal_status.find(ele => ele.value==column_value);
              new_values.push( { value:column_value,label:(deal_status_obj && deal_status_obj.label) ? deal_status_obj.label : '',ref:ref });             
            }
            else if (ref && ref === "organization") {
              const organization = await Organization.find({ }, { organization: 1 }).lean();
              if(organization && organization.length > 0){
                for (const org of organization) {
                  new_values.push({ value:org._id,label:org.organization,ref:ref });
                }
              }              
            } else if (ref && ref === "contact") {
              const contacts = await Contact.find({ }, { }).lean();
              if(contacts && contacts.length > 0){
                for (const contact of contacts) {
                  // new_values.push({ value:contact._id,label:contact.contact_name,ref:ref });
                }
              }              
            }
            else if (ref && ref === "user") {
              const users = await User.find({ role:2, status:1 }, { username:1,photo:1 }).lean();
              if(users && users.length > 0){
                for (const user of users) {
                  let photo = user.photo && fs.existsSync(`./uploads/${user.photo}`)
                    ? `${fullUrl}/uploads/${user.photo}`
                    : "";
                  new_values.push({ value:user._id,label:user.username,ref:ref, photo:photo });
                }
              }              
            }            
            else {
              new_values.push({ value:column_value,label:column_value,ref:ref });
            }
          }
          d.values = new_values;
        }
        response_arr.push(d);
      }
    }
    res.status(200).json({
      success: true,
      msg: "Deal get successfully",
      fields: response_arr,
    });

  } catch (error) {
    res.status(400).json({success: false, message:error.message});
  }
});

// Defined Get Organization Contact
tableRouter.post('/organizationContact', async function (req, res) {
  try {
    let filter = {};
    const response_arr = [];
    if(req.body.organization){
      filter['organization'] = req.body.organization;
    }
    const contacts = await Contact.find(filter, { }).lean();
    if(contacts && contacts.length > 0){
      for (const contact of contacts) {
        response_arr.push({ value:contact._id,label:contact.contact_name,ref:"contact" });
      }
    }
    res.status(200).json({
      success: true,
      msg: "Contact get successfully",
      contacts: response_arr,
    });

  } catch (error) {
    res.status(400).json({success: false, message:error.message});
  }
});
module.exports = tableRouter;