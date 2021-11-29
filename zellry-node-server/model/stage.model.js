const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Stage = new Schema(
    {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    name: { 
        type: String,
        default:"",
        trim: true,
        required: true,
    },
    color: { 
        type: String,
        default:"",
        trim: true,
        required: true,
    },
    position: { 
        type: Number,
        default:0,
    },
}, { 
    timestamps: { 
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    } 
},
{
    collection: 'Stages'
});
module.exports = mongoose.model('Stage', Stage);