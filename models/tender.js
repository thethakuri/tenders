var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tenderSchema = new Schema({
    sn: {
        type: Number
    },
    caller: {
        type: String,
        required: true
    },
    item: {
        type: String,
        required: true
    },
    pubDate: {
        type: Date,
        required: true
    },
    subDate: {
        type: Date,
        required: true
    },
    remarks: {
        type: String
    },
    category: {
        type: [String]
    },
    img: {
        type: String
    },
    link: {
        type: String
    }
    
}, {collection: 'listing'});

module.exports = mongoose.model('Tender', tenderSchema);