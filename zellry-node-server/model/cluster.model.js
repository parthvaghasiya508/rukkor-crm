const mongoose = require('mongoose');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const Schema = mongoose.Schema;
let Cluster = new Schema(
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
    collection: 'Clusters'
});


Cluster.virtual('status_text')
.get(function() {
    if(this.status === 1){
        return `Enable`;
    }
    else {
        return `Disable`;
    }
});

Cluster.plugin(mongooseLeanVirtuals);

// Set Object and Json property to true. Default is set to false
Cluster.set('toObject', { virtuals: true });
Cluster.set('toJSON', { virtuals: true });
module.exports = mongoose.model('Cluster', Cluster);