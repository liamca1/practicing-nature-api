const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// let entrySchema = mongoose.Schema ({
//     Title: {type: String, required: true},
//     Body: {type: String, required: true},
//     Qualities: {
//         Environment: String,
//         Location: String,
//         Conditions: String,
//         Tags: String
//     },
//     Imagepath: String,
//     Featured: Boolean
// });

let userSchema = mongoose.Schema ({
    Username: {type: String, required: true},
    Password: {type: String, required: true},
    Email: {type: String, required: true},
    Birthday: Date,
    Entries: {
              Title: {type: String, required: true},
              Body: {type: String, required: true},
              Qualities: {
                Environment: String,
                Location: String,
                Conditions: String,
                Tags: String
              },
              Imagepath: String,
              Featured: Boolean
  }
});

userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.Password);
};

// let Entry = mongoose.model('Entry', entrySchema);
let User = mongoose.model('User', userSchema);

// module.exports.Entry = Entry;
module.exports.User = User;