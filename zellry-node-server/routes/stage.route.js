const express = require("express");
const Router = express.Router();
const {
  Organization,
  Contact,
  Deal,
  Log,
  Note,
  Country,
  Industry,
  Cluster,
  Stage,
  DealStage,
  DealAction,
  Notification,
  Setting,
  User,
} = require("../model");
var moment = require("moment");
const fs = require("fs");

// Defined Get All Stage
Router.get("/all", async function (req, res) {
  try {
    const response_arr = [];
    var fullUrl = req.protocol + "://" + req.get("host");
    var all_cards_arr = [];
    var user_id = req.query.user_id ? req.query.user_id : "";
    var deal_user = req.query.deal_user ? req.query.deal_user : "";
    const stages = await Stage.find({}, {}).sort({ position: 1 }).lean();
    if (stages && stages.length > 0) {
      for (const stage of stages) {
        var deal_response_arr = [];
        const deals = await Deal.find({"stage.value": stage._id.toString(), "responsible.value":user_id.toString()}).sort({ "updated_at": "-1" }).lean();
        if (deals && deals.length > 0) {
          for (const deal_info of deals) {
            // console.log("deal_info:", deal_info);
            let organization_detail = {};
            let contact_detail = {};
            let user_detail = {};
            // Get Deal Table Each Field
            if (deal_info) {
              for (var deal_key in deal_info) {
                var deal_field = deal_info[deal_key];
                if (typeof deal_field == "object" && deal_field !== null) {
                  let ref = deal_field.ref ? deal_field.ref : "";
                  let value = deal_field.value ? deal_field.value : "";
                  //Fetch Organization
                  if (ref === "organization") {
                    organization_detail = await Organization.findOne({
                      _id: value,
                    }).lean();
                  }
                  //Fetch Contact
                  else if (ref === "contact") {
                    contact_detail = await Contact.findOne({
                      _id: value,
                    }).lean();
                  }
                  //Fetch User
                  else if (ref === "user") {
                    user_detail = await User.findOne({
                      _id: value,
                    }).lean();
                  }
                }
              }

              // Fetch Deal Action
              let deal_action = {};
              let deal_action_default_value = 2;
              let responsible_user = (deal_info.responsible && deal_info.responsible['value']) ? deal_info.responsible['value'] : null;
              deal_action = await DealAction.findOne({ deal: deal_info._id, user: responsible_user, action: { $ne: "deal_cancel" }}).sort({ updated_at: -1 });
              deal_action_default_value = !deal_action ? 2 : (deal_action.action && deal_action.action === "deal_won" ? 1 : (deal_action.action && deal_action.action === "deal_cancel" ? 3 : 0));
              if(deal_action_default_value == 2){
                deal_response_arr.push({
                  id: deal_info && deal_info._id ? deal_info._id : "",
                  deal_id: deal_info && deal_info._id ? deal_info._id : "",
                  contact_id:
                    contact_detail && contact_detail._id
                      ? contact_detail._id
                      : "",
                  contact_name:
                    contact_detail && contact_detail.contact_name
                      ? contact_detail.contact_name
                      : "",
                  organization_id:
                    organization_detail && organization_detail._id
                      ? organization_detail._id
                      : "",
                  organization:
                    organization_detail &&
                    organization_detail.organization
                      ? organization_detail.organization
                      : "",
                  value: deal_info && deal_info.value ? deal_info.value : "",
                  est_close_date:
                    deal_info && deal_info.est_close_date
                      ? moment(deal_info.est_close_date).format("YYYY-MM-DD")
                      : "",
                  est_close_date_original:
                    deal_info && deal_info.est_close_date
                      ? deal_info.est_close_date
                      : "",
                  follow_up:
                    deal_info && deal_info.follow_up ? moment(deal_info.follow_up).format("YYYY-MM-DD") : "",
                  follow_up_original:
                    deal_info && deal_info.follow_up ? deal_info.follow_up : "",
                  responsible:user_detail && user_detail.username ? user_detail.username : "",
                  user_photo:user_detail && user_detail.photo && fs.existsSync(`./uploads/${user_detail.photo}`) ? `${fullUrl}/uploads/${user_detail.photo}` : "",
                  is_deal_won: !deal_action
                    ? 2
                    : deal_action.action && deal_action.action === "deal_won"
                    ? 1
                    : 0,
                });
                all_cards_arr.push({
                  id: deal_info && deal_info._id ? deal_info._id : "",
                });
              }
            }      
          }
        }
        response_arr.push({
          id: stage._id ? stage._id : "",
          title: stage.name ? stage.name : "",
          color: stage.color ? stage.color : "",
          position: stage.position ? stage.position : "",
          total_card: deal_response_arr.length,
          cards: deal_response_arr,
        });
      }
    }

    res.status(200).json({
      success: true,
      msg: "Stage get successfully",
      stages: response_arr,
      card_count: all_cards_arr.length,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Update stage
Router.post("/update", async function (req, res) {
  try {
    const response_arr = [];
    const mongoose = require("mongoose");
    var fullUrl = req.protocol + "://" + req.get("host");
    let user_id = req.body.user;
    let stage_title = req.body.stage_title;
    console.log("params:",req.body);
    let finalData = {};
    let fields = {};
    if(req.body.stage){
      finalData['stage'] = req.body.stage;
      fields['stage'] = Object;
    }
    mongoose.model("Deal").schema.add(fields);
    console.log("finalData:",finalData);
    const updated = await Deal.findOneAndUpdate({ "_id": req.body.deal },{ $set: finalData },{ multi: true, new: true, returnNewDocument: true });
    console.log("updated::",updated);

    if (updated) {
      //:::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
      // Send Mail and Notification to owner : Start

      // Fetch Reciever Detail
      const get_rec_user = await Deal.findOne({ _id: req.body.deal }, {})
        .populate({ path: "user", select: { username: 1, email: 1, photo: 1 } })
        .lean();

      // Fetch Sender Detail
      const get_sender_detail = await User.findOne({ _id: user_id }).lean();
      // console.log("get_sender_detail:", get_sender_detail);

      if (get_rec_user) {
        // Check Notification Settings
        const notification_settings = await Setting.findOne({
          user: get_rec_user.user._id,
        }).lean();
        // console.log("get_rec_user:", get_rec_user);
        // Send Notes Notification
        if (
          notification_settings &&
          notification_settings.change_deal_status_notification && (get_rec_user.user._id.toString() !== get_sender_detail._id.toString())
        ) {
          let notes_param = {
            user: get_rec_user.user._id,
            from: get_sender_detail._id,
            message: `Deal Stage is changed to ${stage_title} by ${get_sender_detail.username} from salesboard.`,
            // message: `${get_sender_detail.username} changed deal stage from salesboard.`,
            type:'edit_detail',
            deal:req.body.deal,
          };
          const send_note = await new Notification(notes_param).save();
        }
      }
    }

    res.status(200).json({
      success: true,
      msg: "Stage updated successfully"
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Delete Deal stage
Router.post("/deleteDealStage", async function (req, res) {
  try {
    const response_arr = [];
    var fullUrl = req.protocol + "://" + req.get("host");
    var all_cards_arr = [];
    let user_id = req.body.user;
    let deal_id = req.body.deal_id;

    await Deal.findByIdAndRemove({ _id: deal_id });
    await DealStage.remove({ deal: deal_id });
    await DealAction.remove({ deal: deal_id });
    await Log.remove({ deal: deal_id });
    await Note.remove({ deal: deal_id });
    
    res.status(200).json({
      success: true,
      msg: "Deal removed successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Filter Deal stage
Router.post("/filter", async function (req, res) {
  try {
    console.log("param:", req.body);
    var fullUrl = req.protocol + "://" + req.get("host");
    let user_id = '';
    let filter = {};
    let getStage = {};
    var getDealStatus = "";
    var deal_response_arr = [];
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
              else if (["stage"].includes(key.toLocaleLowerCase())) {
                getStage = dataFields[key];
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
            user_id = dataFields[key];
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
    // Get Stage Data
    var response_arr = [];
    var all_cards_arr = [];
    const stages = await Stage.find({}, {}).sort({ position: 1 }).lean();

    if (stages && stages.length > 0) {
      for (const stage of stages) {
        var deal_response_arr = [];
        if(getStage.value === stage._id.toString()){
          filter['stage'] = { ref:"stage", value:getStage.value.toString() };
          
          var deals =  await Deal.find(filter, {}).sort({ "updated_at": "-1" }).lean();
          // console.log("hasStage:",getStage.value,"filter:",filter,"deals.length:",deals.length);
        }
        else{
          if(getStage && getStage.value){            
            var deals = await Deal.find({"stage.value": stage._id.toString()},{}).sort({ "updated_at": "-1" }).lean();
          }
          else{
            filter['stage'] = { ref:"stage", value:stage._id.toString() };
            var deals = await Deal.find(filter,{}).sort({ "updated_at": "-1" }).lean();
          }
          // console.log("filter:",filter," | deals:",deals.length);
          // console.log("hasNoStage:","filter:",filter,"deals.length:",deals.length);
        }

        if (deals && deals.length > 0) {
          for (const deal_info of deals) {
            // console.log("deal_info:", deal_info);
            let organization_detail = {};
            let contact_detail = {};
            let user_detail = {};
            // Get Deal Table Each Field
            if (deal_info) {
              for (var deal_key in deal_info) {
                var deal_field = deal_info[deal_key];
                if (typeof deal_field == "object"  && deal_field !== null) {
                  let ref = deal_field.ref ? deal_field.ref : "";
                  let value = deal_field.value ? deal_field.value : "";
                  //Fetch Organization
                  if (ref === "organization") {
                    organization_detail = await Organization.findOne({
                      _id: value,
                    }).lean();
                  }
                  //Fetch Contact
                  else if (ref === "contact") {
                    contact_detail = await Contact.findOne({
                      _id: value,
                    }).lean();
                  }
                  //Fetch User
                  else if (ref === "user") {
                    user_detail = await User.findOne({
                      _id: value,
                    }).lean();
                  }
                }
              }
            }

            // Fetch Deal Action
            let deal_action = {};
            let deal_action_default_value = 2;
            if (deal_info) {     
              console.log('deal_info:yes',"user_id:",user_id,"deal_action:",deal_action); 
              deal_action = await DealAction.findOne({
                deal: deal_info._id,
                user: user_id, action: { $ne: "deal_cancel" }
              }).sort({ updated_at: -1 });
              
            }
            deal_action_default_value = !deal_action ? 2 : (deal_action.action && deal_action.action === "deal_won" ? 1 : (deal_action.action && deal_action.action === "deal_cancel" ? 3 : 0));
            if(deal_action_default_value == 2){
              deal_response_arr.push({
                id: deal_info && deal_info._id ? deal_info._id : "",
                deal_id: deal_info && deal_info._id ? deal_info._id : "",
                contact_id:
                  contact_detail && contact_detail._id
                    ? contact_detail._id
                    : "",
                contact_name:
                  contact_detail && contact_detail.contact_name
                    ? contact_detail.contact_name
                    : "",
                organization_id:
                  organization_detail && organization_detail._id
                    ? organization_detail._id
                    : "",
                organization:
                  organization_detail &&
                  organization_detail.organization
                    ? organization_detail.organization
                    : "",
                value: deal_info && deal_info.value ? deal_info.value : "",
                est_close_date:
                  deal_info && deal_info.est_close_date
                    ? moment(deal_info.est_close_date).format("YYYY-MM-DD")
                    : "",
                est_close_date_original:
                  deal_info && deal_info.est_close_date
                    ? deal_info.est_close_date
                    : "",
                follow_up:
                  deal_info && deal_info.follow_up ? moment(deal_info.follow_up).format("YYYY-MM-DD") : "",
                follow_up_original:
                  deal_info && deal_info.follow_up ? deal_info.follow_up : "",
                responsible:user_detail && user_detail.username ? user_detail.username : "",
                user_photo:user_detail && user_detail.photo && fs.existsSync(`./uploads/${user_detail.photo}`) ? `${fullUrl}/uploads/${user_detail.photo}` : "",
                is_deal_won: !deal_action
                  ? 2
                  : deal_action.action && deal_action.action === "deal_won"
                  ? 1
                  : 0,
              });
              all_cards_arr.push({
                id: deal_info._id,
              });
            }            
          }
        }
        
        response_arr.push({
          id: stage._id ? stage._id : "",
          title: stage.name ? stage.name : "",
          color: stage.color ? stage.color : "",
          position: stage.position ? stage.position : "",
          total_card: deal_response_arr.length,
          cards: deal_response_arr,
        });
      }
    }

    if(getDealStatus){
      response_arr = response_arr.map((st)=> {

        if(getStage && getStage.value){
          if(st.id == getStage.value){
            return {
              ...st,
              cards:st.cards.filter((c) => c.is_deal_won == getDealStatus),
            }
          }
          else {
            return st;
          }
        }
        else{
          return {
            ...st,
            cards:st.cards.filter((c) => c.is_deal_won == getDealStatus),
          }
        }        
      });
    }

    res.status(200).json({
      success: true,
      msg: "Deal get successfully",
      stages: response_arr,
      card_count: all_cards_arr.length,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = Router;
