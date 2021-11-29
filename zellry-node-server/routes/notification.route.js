const express = require("express");
const Router = express.Router();
const { Notification, Deal, Contact } = require("../model");
// var moment = require("moment");
var moment = require('moment-timezone');

// Defined Get All Notification
Router.get("/all", async function (req, res) {
  try {
    const response_arr = [];
    var user = req.query.user ? req.query.user : "";
    var timezone = req.query.timezone ? req.query.timezone : "Etc/UTC";
    console.log("user_id:",user);

    // Update with read status
    const is_read_notification = await Notification.updateMany(
      { user:user },
      { $set: { is_read: true } },
      { new: true }
    );
    
    // Get All Unread Notification
    const unread_notifications = await Notification.find({ user:user, is_read:false }, {}).count();

    const notifications = await Notification.find({ user:user }, {}).sort({ created_at: -1 }).populate({path: 'from', select: 'username -_id'}).limit(10).lean();    
    if(notifications && notifications.length > 0){
      for (const notification of notifications) {

        let type = notification.type;
        let deal_id = notification.deal;
        let title = '';
        let message = '';
        let userFullName = notification.from && notification.from.username ? notification.from.username : 'One User';
        let dealContactName = 'One Contact';
        const deal_detail = await Deal.findOne({ _id: deal_id }, {}).lean();
        console.log("deal_detail:",deal_detail);

        if(deal_detail && deal_detail.contact_name && deal_detail.contact_name.value){
          let contact_value = deal_detail.contact_name.value;
          const contact_detail = await Contact.findOne({ _id:contact_value },{contact_name:1}).lean();
          console.log("contact_detail:",contact_detail);
          if(contact_detail) {
            dealContactName = contact_detail.contact_name;
          }
        }
        
        if(type == 'edit_detail') {
          title = `${userFullName} edited deal for ${dealContactName}`;
          message = notification.message ? notification.message  : `Some deal information is changed by ${userFullName}.`;
        }
        else if(type == 'edit_deal_status') {
          title = `${userFullName} changed deal status for ${dealContactName}`;
          let deal_action = notification.message;
          let status_text = (deal_action === "deal_won") ? "won" : (deal_action === "deal_cancel") ? "cancelled" : "lost";
          message = `Deal status is changed to ${status_text} by ${userFullName}.`;
        }
        else if(type == 'add_deal_note') {
          title = `${userFullName} added notes for ${dealContactName}`;
          message = `Notes: ${notification.message}`;
        }
        response_arr.push({
          _id:notification._id,
          title:title,
          message:message,
          type:type,
          deal:deal_id,
          created_at:moment(notification.created_at).tz(timezone).format('YYYY-MM-DD HH:mm:ss'),
        });
      }
    }
    res.status(200).json({
      success: true,
      msg: "Notification get successfully",
      notifications: response_arr,
      unread_count:unread_notifications
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Defined Get All Unread Notification
Router.get("/all/unread", async function (req, res) {
  try {
    const response_arr = [];
    var user = req.query.user ? req.query.user : "";
    console.log("user_id:",user);
    const notifications = await Notification.find({ user:user, is_read:false }, {}).sort({ created_at: -1 }).count();    

    res.status(200).json({
      success: true,
      msg: "Notification count get successfully.",
      total_unread_notification: notifications,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});


module.exports = Router;
