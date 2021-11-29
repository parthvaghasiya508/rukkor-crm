const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let Deal = new Schema(
    {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }
}, { 
    timestamps: { 
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    } 
},
{
    collection: 'Deals'
});

Deal.virtual('deal_stages', {
    ref: 'DealStage', //The Model to use
    localField: '_id', //Find in Model, where localField 
    foreignField: 'deal', // is equal to foreignField
});

// Set Object and Json property to true. Default is set to false
Deal.set('toObject', { virtuals: true });
Deal.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Deal', Deal);