const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Organization = new Schema(
    {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    // country: { 
    //     type: mongoose.Schema.Types.ObjectId, 
    //     ref: 'Country' 
    // },
    // industry: { 
    //     type: mongoose.Schema.Types.ObjectId, 
    //     ref: 'Industry' 
    // },
    // cluster: { 
    //     type: mongoose.Schema.Types.ObjectId, 
    //     ref: 'Cluster' 
    // },
}, { 
    timestamps: { 
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    } 
},
{
    collection: 'Organizations',
    strict: false 
});
module.exports = mongoose.model('Organization', Organization);