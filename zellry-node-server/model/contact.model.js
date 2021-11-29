const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Contact = new Schema(
    {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }, 
    // organization: { 
    //     type: mongoose.Schema.Types.ObjectId, 
    //     ref: 'Organization' 
    // },
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
    collection: 'Contacts'
});
module.exports = mongoose.model('Contact', Contact);