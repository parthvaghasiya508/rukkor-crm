const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Setting = new Schema(
    {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    new_notes_email: { 
        type: Boolean,
        default:false,
        trim: true,
        required: true,
    },
    new_notes_notification: { 
        type: Boolean,
        default:false,
        trim: true,
        required: true,
    },
    change_deal_status_notification: { 
        type: Boolean,
        default:false,
        trim: true,
        required: true,
    },
    edit_detail_notification: { 
        type: Boolean,
        default:false,
        trim: true,
        required: true,
    },
   
}, { 
    timestamps: { 
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    } 
},
{
    collection: 'Settings'
});
module.exports = mongoose.model('Setting', Setting);
