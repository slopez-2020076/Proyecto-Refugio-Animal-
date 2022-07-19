'use strict'

const mongoose = require('mongoose');

const appointmentSchema = mongoose.Schema({
    date: Date,
    user: {type: mongoose.Schema.ObjectId, ref: 'User'},
    animal: {type: mongoose.Schema.ObjectId, ref: 'Animal'},
    status: String
});

module.exports = mongoose.model('Appointment', appointmentSchema);