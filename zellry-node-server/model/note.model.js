const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Note = new Schema(
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
    notes_type: { 
        type: String,
        default:"",
        trim: true,
    },
    description: { 
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
    collection: 'Notes'
});
module.exports = mongoose.model('Note', Note);