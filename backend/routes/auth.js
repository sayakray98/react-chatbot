const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');
const JWT_TOKEN = "shhhhh";
const JWT_SECRET = "reset_password_secret_key";
const nodemailer = require('nodemailer');
const fs = require('fs');
const multer = require('multer');
const pdfPoppler = require('pdf-poppler');
const tesseract = require('tesseract.js');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');  // The folder where files will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Use the original file extension
    }
});
const upload = multer({ storage: storage });

router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ message: 'File uploaded successfully', fileName: req.file.filename });
});
// Create user registration
router.post(
    '/register',
    // Validation for name, email, and password
    body('name').isLength({ min: 5 }).withMessage('Name must be at least 5 characters long'),
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
    async (req, res) => {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, email, password } = req.body


        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        try {
            // Create and save new user
            const newUser = await User.create({
                name,
                email,
                password: hash
            });

            await newUser.save();

            // Respond with the newly created user
            res.json(newUser);
        } catch (error) {
            // Handle any errors
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

router.post('/login',
    body('email').isEmail().withMessage('Please provide a valid email address'),
    body('password').isLength({ min: 5 }).withMessage('Password must be at least 5 characters long'),
    async (req, res) => {
        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const passwordCompare = await bcrypt.compare(password, user.password);
            if (!passwordCompare) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const data = {
                user: user._id
            };

            const token = jwt.sign(data, JWT_TOKEN);
            res.status(200).json({
                token
            });
        } catch (error) {
            console.error(error.message);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
);

router.get('/getdetails', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password")
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
})

router.get('/getdetailsbyid/:id', async (req, res) => {
    try {
        var userId = req.params.id
        var user = await User.findById(userId)
        if (!user) {
            res.status(500).send('Server error');
        }

        if (user._id.toString() === userId) {
            res.status(200).json(user)
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
})


router.delete('/deleteid/:id', async (req, res) => {

    try {
        var userId = req.params.id
        var user = await User.findById(userId)
        if (!user) {
            res.status(500).send('Server error');
        }


        await user.deleteOne()
        res.json({ msg: 'User deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }

})
router.put('/updateid/:id', async (req, res) => {

    try {
        var userId = req.params.id
        var user = await User.findById(userId)
        if (!user) {
            res.status(500).send('Server error');
        }

        user = await User.findByIdAndUpdate(userId, { $set: req.body }, { new: true });

        // Send the updated user as a response
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }

})

const uploadFolderPath = path.join('D:', 'React projects of Sayak', 'React Chatbot', 'react-chatbot', 'backend', 'uploads');
// ROUTE 4: Check files in 'uploads' folder using: GET "/api/auth/check-files"
router.get('/check-files', async (req, res) => {
    // Check if the 'uploads' folder exists and read its contents
    fs.readdir(uploadFolderPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read folder' });
        }

        // Send back the list of files in the 'uploads' folder
        res.json({ files });
    });
});


// Handle file upload and extract text using Tesseract.js
router.post('/extract-text', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file provided' });
        }

        // Use pdf-poppler to convert the PDF to image
        const pdfFilePath = req.file.path;
        const outputFolderPath = path.join(__dirname, 'uploads', 'pdf-images');
        const options = {
            format: 'png',
            out_dir: outputFolderPath,
            out_prefix: 'page',
            page: null, // All pages
        };

        // Extract images from the PDF
        pdfPoppler.convert(pdfFilePath, options)
            .then(async () => {
                // Process each image using Tesseract.js
                const imageFiles = fs.readdirSync(outputFolderPath);
                let extractedText = '';

                for (const imageFile of imageFiles) {
                    const imagePath = path.join(outputFolderPath, imageFile);
                    const { data: { text } } = await tesseract.recognize(imagePath, 'eng');
                    extractedText += text;
                }

                // Cleanup: Delete temporary images
                imageFiles.forEach(file => fs.unlinkSync(path.join(outputFolderPath, file)));

                // Send extracted text
                res.send(extractedText);
            })
            .catch((error) => {
                console.error('Error converting PDF to images:', error);
                res.status(500).json({ error: 'Error converting PDF to images' });
            });
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        res.status(500).json({ error: 'Error extracting text from PDF' });
    }
});

router.get('/searchdata/:findkey', async (req, res) => {

    try {
        let data = await User.find({

            $or: [
                {
                    name: {
                        $regex: req.params.findkey,
                        $options: 'i'

                    }
                }
            ]

        })

        res.send(data)
        console.log(data)
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
})

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        // Generate reset token
        const resetToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

        // Send email with reset link
        const transporter = nodemailer.createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            secure: false,
            auth: {
                user: "7e10c8002@smtp-brevo.com",
                pass: "Ev4cV9NmxU0DR73g",
            },
        });

        const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
        const mailOptions = {
            from: '"Password Reset" <djssrock93@gmail.com>',
            to: email,
            subject: 'Password Reset Request',
            html: `<p>You requested a password reset. Click <a href="${resetLink}">here</a> to reset your password. The link will expire in 1 hour.</p>`
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Password reset link sent to your email' });
    } catch (error) {
        console.error('Error in forgot-password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Find the user by their ID from the token
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password in the database
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Password successfully reset' });
    } catch (error) {
        console.error('Error in reset-password:', error);
        res.status(400).json({ message: 'Invalid or expired token' });
    }
});

module.exports = router;
