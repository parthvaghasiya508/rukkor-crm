const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Notification = new Schema(
    {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    from: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    message: { 
        type: String,
        default:"",
        trim: true,
    },
    type : {
        type: String,
        default:"",
        trim: true,
    },
    deal : {
        type: String,
        default:"",
        trim: true,
    },
    is_read: {
        type: Boolean,
        default:false,
    },
}, { 
    timestamps: { 
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    } 
},
{
    collection: 'Notifications'
});
module.exports = mongoose.model('Notification', Notification);