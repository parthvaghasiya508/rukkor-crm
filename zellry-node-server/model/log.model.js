const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Log = new Schema(
    {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    organization: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Organization' 
    },
    contact: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Contact' 
    },
    deal: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Deal' 
    },
    action: { 
        type: String,
        default:"",
        trim: true,
        required: true,
    },
    description: { 
        type: String,
        default:"",
        trim: true,
        required: true,
    }, 
    note_message: { 
        type: String,
        default:"",
        trim: true,
    },
}, { 
    timestamps: { 
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    } 
},
{
    collection: 'Logs'
});
module.exports = mongoose.model('Log', Log);