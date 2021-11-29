const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const Schema = mongoose.Schema;
let Country = new Schema(
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
    collection: 'Countries'
});


Country.virtual('status_text')
.get(function() {
    if(this.status === 1){
        return `Enable`;
    }
    else {
        return `Disable`;
    }
});

Country.plugin(mongooseLeanVirtuals);

// Set Object and Json property to true. Default is set to false
Country.set('toObject', { virtuals: true });
Country.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Country', Country);