const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let DealStage = new Schema(
    {
    deal: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Deal' 
    },
    stage: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Stage' 
    },
    position:{
        type:Number,
        default:1,
    }
}, { 
    timestamps: { 
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    } 
},
{
    collection: 'DealStages'
});
module.exports = mongoose.model('DealStage', DealStage);