import mongoose from 'mongoose';

//User Model
const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        isAdmin: { type: String, default: false, required: true },
        // isAgent: { type: String, default: false }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model('User', userSchema);

export default User;