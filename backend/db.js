

const mongoose = require('mongoose');

// main().catch(err => console.log(err));
const connectToMongoose = async () => {
       async function main() {
        await mongoose.connect('mongodb://localhost:27017');
        console.log("Hey Connection is Okey!")

    }
    main().catch(err => console.log(err));
}

module.exports = connectToMongoose
