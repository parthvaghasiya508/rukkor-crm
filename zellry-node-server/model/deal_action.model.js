const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let DealAction = new Schema(
    {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
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
    reason:{ 
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
    collection: 'DealActions'
});
module.exports = mongoose.model('DealAction', DealAction);