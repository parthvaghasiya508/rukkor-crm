const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let CustomTable = new Schema(
    {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    prev_id: { 
        type: String,
        default:"previous",
        trim: true,
        required: true,
    },
    table_name: { 
        type: String,
        default:"",
        trim: true,
        required: true,
    },
    slug_name: { 
        type: String,
        default:"",
        trim: true,
        required: true,
    },
    
    column_name: { 
        type: String,
        default:"",
        trim: true,
        required: true,
    },
    column_slug: { 
        type: String,
        default:"",
        trim: true,
    },
    column_type: { 
        type: String,
        default:"",
        trim: true,
        required: true,
    },
    is_editable: { 
        type: Boolean,
        default:false,
        trim: true,
        required: true,
    },
    is_sortable: { 
        type: Boolean,
        default:false,
        trim: true,
        required: true,
    },
    is_filterable: { 
        type: Boolean,
        default:false,
        trim: true,
        required: true,
    },
    is_required: { 
        type: Boolean,
        default:false,
        trim: true,
        required: true,
    },
    position: { 
        type: Number,
        default:0,
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
    collection: 'CustomTables'
});

CustomTable.virtual('values', {
    ref: 'CustomFieldValue', //The Model to use
    localField: '_id', //Find in Model, where localField 
    foreignField: 'custom_table', // is equal to foreignField
});

// Set Object and Json property to true. Default is set to false
CustomTable.set('toObject', { virtuals: true });
CustomTable.set('toJSON', { virtuals: true });

module.exports = mongoose.model('CustomTable', CustomTable);