const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let User = new Schema(
    {
    role: { 
        type: Number, 
        default:2  // 1=Admin, 2=User
    },
    username: { 
        type: String,
        default:"",
        required: true,
        trim: true,
        index: true,
    },
    email: { 
        type: String,
        default:"", 
        required: true,
        trim: true,
        unique: true,
        index: true,
    },
    password: { 
        type: String,
        default:"", 
        required: true,
        trim: true
    },
    photo: { 
        type: String,
        default:"",
    },
    contact_no: { 
        type: String,
        default:"",
        required: true,
        trim: true
    },
    reset_password_token: { 
        type: String,
        default:"",
        trim: true
    },
    reset_password_expires:{ 
        type: Date,
        default:"",
    },
    status: {
        type: Number,
        default:1 // 1-Active , 2-Deactive
    },
    calender_event_title:{
        type: String,
        default:"",
        trim: true
    }    
}, { 
    timestamps: { 
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    } 
},
{
    collection: 'Users'
});
module.exports = mongoose.model('User', User);