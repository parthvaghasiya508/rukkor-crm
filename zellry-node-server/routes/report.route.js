const express = require("express");
const Router = express.Router();
const mongoose = require('mongoose');
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
const {months} = require('../utils/helpers');


// Defined Get All Stage
Router.get("/getPendingValuesWithStages", async function (req, res) {
  try {
    const response_arr = [];
    var fullUrl = req.protocol + "://" + req.get("host");
    var all_cards_arr = [];
    var user_id = req.query.user_id ? req.query.user_id : "";
    var responsible = req.query.responsible ? req.query.responsible : "";
    const stages = await Stage.find({}, {_id:1,name:1,color:1,position:1}).sort({ position: 1 }).lean();
    if (stages && stages.length > 0) {
      for (const stage of stages) {
        var deal_response_arr = [];        
        let deal_filter = {"stage.value": stage._id.toString()};
        if (responsible) {
          deal_filter = {
            ...deal_filter,
            "responsible.value":responsible.toString(),
          };
        }
        const deals = await Deal.find(deal_filter,{_id:1,value:1}).sort({ "updated_at": "-1" }).lean();
        let totalPendingValues = 0;
        let countDeal = 0;
        if (deals && deals.length > 0) {
          for (const deal_info of deals) {
            let user_detail = {};
            // Get Deal Table Each Field
            if (deal_info) {
              let deal_action_filter = {
                deal: deal_info._id,
                action: { $ne: "deal_cancel" }
              };
              if (responsible) {
                deal_action_filter = {
                  ...deal_action_filter,
                  user:responsible,
                };
              }
              for (var deal_key in deal_info) {
                var deal_field = deal_info[deal_key];
                if (typeof deal_field == "object" && deal_field !== null) {
                  let ref = deal_field.ref ? deal_field.ref : "";
                  let value = deal_field.value ? deal_field.value : "";
                  if (ref === "user") {
                    user_detail = await User.findOne({
                      _id: value,
                    }).lean();
                  }
                }
              }
              // Fetch Deal Action
              let deal_action = {};
              let deal_action_default_value = 2;
              deal_action = await DealAction.findOne(deal_action_filter,{action:1}).sort({ created_at: -1 });
              deal_action_default_value= !deal_action ? 2 : (deal_action.action && deal_action.action === "deal_won" ? 1 : (deal_action.action && deal_action.action === "deal_cancel" ? 3 : 0));
              if(deal_action_default_value == 2){
                let deal_value = deal_info && deal_info.value ? deal_info.value : 0;
                totalPendingValues += parseFloat(deal_value);
                countDeal ++;
              }
            }      
          }
        }
        response_arr.push({
          label: stage.name ? `${stage.name} (${countDeal} deals)` : "",
          value: totalPendingValues,
          color: stage.color ? stage.color : "",
          count_deal: countDeal,
        });
      }
    }

    res.status(200).json({
      success: true,
      msg: "Stage get successfully",
      data: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

Router.get("/getWonLostDealValues", async function (req, res) {
  try {
    const response_arr = [];
    var fullUrl = req.protocol + "://" + req.get("host");
    var user_id = req.query.user_id ? req.query.user_id : "";
    var responsible = req.query.responsible ? req.query.responsible : "";
    var date_range = req.query.date_range ? req.query.date_range : "";

    let filter = {};
    if(responsible){
      filter = { ...filter, user:responsible };
    }
    if(date_range){
      let split_date  = date_range.split(",");
      let start_date  = split_date[0];
      let end_date    = split_date[1];            
      filter = { ...filter, 'updated_at': {$gte: new Date(new Date(start_date).setHours(00, 00, 00)),
        $lt: new Date(new Date(end_date).setHours(23, 59, 59))} };
    }
  
    let deal_types = [{action:"deal_won", label:"Won Deal", color:''}, {action:"deal_lost",label:"Lost Deal",color:"#e44a00"}];
    for (const type of deal_types) {
      // Get Action Deals
      const getDeals = await DealAction.find({ ...filter, action:type.action },{deal:1}).sort({ updated_at: -1 });
      let dealIds = getDeals.map(d => d.deal);
      let deal_filter = {_id : { $in : dealIds } };
      if(responsible){
        deal_filter = { ...deal_filter, "responsible.value":responsible.toString(),  };        
      }
      const deals = await Deal.find(deal_filter,{_id:1,value:1}).lean();
      const totalValues = deals.reduce((acc, d) => (d.value) ? acc + parseFloat(d.value) : 0 , 0);
      let countDeal = deals.length;
      response_arr.push({
        value: totalValues,
        color: type.color,
        label: type.label ? `${type.label} (${countDeal} deals)` : "",
        count_deal: countDeal,
      });
    }
    res.status(200).json({
      success: true,
      msg: "Won/Lost get successfully",
      data: response_arr,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

Router.get("/getCancelledDealValues", async function (req, res) {
  try {
    const response_arr = [];
    var fullUrl = req.protocol + "://" + req.get("host");
    var user_id = req.query.user_id ? req.query.user_id : "";
    var cancelled_by = req.query.responsible ? req.query.responsible : "";
    var year = req.query.year ? req.query.year : "";

    let filter = {action:"deal_cancel"};
    if(cancelled_by){
      filter = {...filter, user:mongoose.Types.ObjectId(cancelled_by)};
    }
    for (const month of months) {
      
      let current_month = month.value;
      console.log("current_month:",current_month);
      if(year){
        filter = {...filter, year:parseInt(year), month:parseInt(current_month)};
      }
      const cancelled_deals = await DealAction.aggregate([
        {
          "$project":{
            "year":{"$year":"$updated_at"},
            "month":{"$month":"$updated_at"},
            "_id":"$_id",
            "deal":"$deal",
            "user":"$user",
            "action":"$action"
          }
        },
        {
          $match:filter
        }
      ]);
      console.log("cancelled_deals::",cancelled_deals);
      const dealIds = cancelled_deals.map(d => d.deal);

      // GET DEAL VALUES
      let deal_filter = {_id : { $in : dealIds } };
      if(cancelled_by){
        deal_filter = { ...deal_filter, "responsible.value":cancelled_by.toString(),  };        
      }
      const deals = await Deal.find(deal_filter,{_id:1,value:1}).lean();
      const totalValues = deals.reduce((acc, d) => (d.value) ? acc + parseFloat(d.value) : 0 , 0);
      let countDeal = deals.length;
      
      response_arr.push({
        value:totalValues,
        label: month.label ? `${month.label} (${countDeal} deals)` : "",
        count_deal: countDeal,
      });

    }
    res.status(200).json({
      success: true,
      msg: "Cancelled deal values get successfully",
      data: response_arr,
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

Router.get("/getNetDealValues", async function (req, res) {
  try {
    const response_arr = [];
    var fullUrl = req.protocol + "://" + req.get("host");
    var user_id = req.query.user_id ? req.query.user_id : "";
    var cancelled_by = req.query.responsible ? req.query.responsible : "";
    var year = req.query.year ? req.query.year : "";

    let filter = {};
    if(cancelled_by){
      filter = {...filter, user:mongoose.Types.ObjectId(cancelled_by)};
    }
    for (const month of months) {
      
      let current_month = month.value;
      console.log("current_month:",current_month);
      if(year){
        filter = {...filter, year:parseInt(year), month:parseInt(current_month)};
      }
      // GET CANCELLED DEALS
      const cancelled_deals = await DealAction.aggregate([
        {
          "$project":{
            "year":{"$year":"$updated_at"},
            "month":{"$month":"$updated_at"},
            "_id":"$_id",
            "deal":"$deal",
            "user":"$user",
            "action":"$action"
          }
        },
        {
          $match:{...filter, action:"deal_cancel"}
        }
      ]);
      const canceldealIds = cancelled_deals.map(d => d.deal);
      let deal_filter = {_id : { $in : canceldealIds } };
      if(cancelled_by){
        deal_filter = { ...deal_filter, "responsible.value":cancelled_by.toString(),  };        
      }
      const deals = await Deal.find(deal_filter,{_id:1,value:1}).lean();
      const totalCancelDealValues = deals.reduce((acc, d) => (d.value) ? acc + parseFloat(d.value) : 0 , 0);

      // GET WON DEALS
      const won_deals = await DealAction.aggregate([
        {
          "$project":{
            "year":{"$year":"$updated_at"},
            "month":{"$month":"$updated_at"},
            "_id":"$_id",
            "deal":"$deal",
            "user":"$user",
            "action":"$action"
          }
        },
        {
          $match:{...filter, action:"deal_won"}
        }
      ]);
      const wondealIds = won_deals.map(d => d.deal);
      let deal_filter1 = {_id : { $in : wondealIds } };
      if(cancelled_by){
        deal_filter1 = { ...deal_filter1, "responsible.value":cancelled_by.toString()};        
      }
      const wondeals = await Deal.find(deal_filter1,{_id:1,value:1}).lean();
      console.log("wondeals:",wondeals);
      const totalWonDealValues = wondeals.reduce((acc, d) =>(d.value) ? acc + parseFloat(d.value) : 0 , 0);
      console.log("totalWonDealValues:",totalWonDealValues,"totalCancelDealValues:",totalCancelDealValues);

      let netValue = totalWonDealValues - totalCancelDealValues;
      console.log("netValue:",netValue);

      let countWonDeal = wondeals.length;
      let countCancelledDeal = deals.length;

      response_arr.push({
        value:netValue,
        label: month.label ? `${month.label} (${countWonDeal} W. ${countCancelledDeal} C. )` : "",
        count_won_deal: countWonDeal,
        count_cancelled_deal: countCancelledDeal,
        total_won:totalWonDealValues,
        total_cancel:totalCancelDealValues,
      });
    }
    res.status(200).json({
      success: true,
      msg: "Cancelled deal values get successfully",
      data: response_arr,
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = Router;
