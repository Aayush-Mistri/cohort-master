import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('d:/cohort-master/cohortBackEnd/.env') });

const updateSchema = new mongoose.Schema({}, { strict: false });
const Update = mongoose.model('Update', updateSchema, 'updates');
const chatSchema = new mongoose.Schema({}, { strict: false });
const Chat = mongoose.model('Chat', chatSchema, 'chats');
const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');


async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB.");
    
    const users = await User.find();
    console.log(`Total users: ${users.length}`);

    const updates = await Update.find().populate('author', 'name');
    console.log(`Total active updates: ${updates.length}`);
    for(const u of updates) {
        console.log(`- Update by: ${u.author?._id} (${u.author?.name}) | visibility: ${u.visibility} | id: ${u._id}`);
    }

    const chats = await Chat.find();
    console.log(`Total chats: ${chats.length}`);
    for(const c of chats) {
        console.log(`- Chat participants: ${c.participants.join(', ')}`);
    }

    mongoose.disconnect();
}

run();
