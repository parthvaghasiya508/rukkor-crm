const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const Schema = mongoose.Schema;
let Reason = new Schema(
    {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    title: { 
        type: String,
        default:"",
        trim: true,
        required: true,
    },
    status: {
        type: Number,
        default:1 // 1-Active , 2-Deactive
    }
}, { 
    timestamps: { 
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    } 
},
{
    collection: 'Reasons'
});

Reason.virtual('status_text')
.get(function() {
    if(this.status === 1){
        return `Enable`;
    }
    else {
        return `Disable`;
    }
});

Reason.plugin(mongooseLeanVirtuals);

// Set Object and Json property to true. Default is set to false
Reason.set('toObject', { virtuals: true });
Reason.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Reason', Reason);