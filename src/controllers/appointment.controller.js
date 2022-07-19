'use strict'

const {validateData, deleteSensitiveData, checkUpdatedStatus} = require('../utils/validate');
const Animal = require('../models/animal.model');
const Appointment = require('../models/appointment.model');

exports.testAppointment = (req, res)=>{
    return res.send({message: 'Function testAppointment is running'});
}

exports.createAppointment = async(req, res)=>{
    try{
        const params = req.body;
        const data = {
           date: params.date,
           user: req.user.sub,
           animal: params.animal,
           status: 'created'
        };
        const msg = validateData(data);
        if(!msg){
            const animal = await Animal.findOne({_id: params.animal});//buscar al animal que envio el usuario
            if(!animal) return res.send({message: 'Animal not found'});
            const appoAlready = await Appointment.findOne({
                $and: [
                    {animal: data.animal},
                    {user: data.user}
                ]
            });
            if(appoAlready) return res.send({message: 'Appointment already created whit this animal'});
            const dateAlready = await Appointment.findOne({
                $and: [
                   {date: data.date},
                   {user: data.user} 
                ]
            });
            if(dateAlready) return res.send({message: 'Appointment already created on this date'});
            const appointment = new Appointment(data);
            await appointment.save();
            return res.send({message: 'Appointment created successfullyl', appointment});
        }else return res.status(400).send(msg);
    }catch(err){
        console.log(err);
        return err;
    }
}

exports.getAppointments = async(req, res)=>{
    try{
        const userId = req.user.sub;
        const appointments = await Appointment.find({user: userId})
            .populate('user')
            .populate('animal')
            .lean()
        if(appointments == undefined) return res.send({message: 'Appointments not found'});
        const appointmentsClear = [];
        for(let appo of appointments){
            appointmentsClear.push(await deleteSensitiveData(appo));
        }
        return res.send({appointmentsClear});
    }catch(err){
        console.log(err);
        return err;
    }
}



exports.updateStatus = async (req, res) =>{
   
    try{
        const AppointID = req.params.id;
        const params = req.body; 
         
        const appoint = await Appointment.findOne({_id: AppointID});
        if(!appoint) return res.send({message: 'Appointment not found'});

        const check = await checkUpdatedStatus(params);
        if(check === false) return res.status(400).send({message: 'Status not recived or Data sending not updated'});

        const statusExist = await Appointment.findOne({_id: AppointID});
        if(!statusExist) res.send({message: 'Status not found'}); 
        const statusAlready = await Appointment.findOne({status: params.status});


        if(!statusAlready){
            const updateStatus = await Appointment.findOneAndUpdate({_id: AppointID}, params , {new: true}).populate('user').populate('animal').lean();
            if(!updateStatus) return res.send({message: 'Appointment not found'});
            updateStatus.user.password = undefined; 
            updateStatus.user.role = undefined; 
            updateStatus.user.username = undefined; 
            updateStatus.animal.user = undefined;
            return res.send({message: 'Status update', updateStatus});
        }else{
            return res.send({message: 'The sent status is the same'});
        }
    }catch(err){
        console.log(err); 
        return err; 
    }
}
    


