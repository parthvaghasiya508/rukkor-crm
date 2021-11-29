const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let CustomFieldValue = new Schema(
    {
    custom_table: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'CustomTable' 
    },
    column_value: { 
        type: String,
        default:"",
        trim: true,
        required: true,
    },
    ref: { 
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
    collection: 'CustomFieldValues'
});
module.exports = mongoose.model('CustomFieldValue', CustomFieldValue);