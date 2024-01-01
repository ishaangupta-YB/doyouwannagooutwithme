const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken')
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config()

const app = express();

const secretKey = process.env.SECRET_KEY || 'keynotfound_lol'; 
const PORT = process.env.PORT || 8080;

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: 'Too many tries! Please try after some time.',
});

// const corsOptions = {
//     origin: 'https://your-vercel-app-url.vercel.app',
//     methods: 'GET,POST',
//     credentials: true,
//     optionsSuccessStatus: 204,
// };
// app.use(cors(corsOptions));
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs')
app.use('/ask/:token', limiter);

function capitalizeName(sentence) {
    if (!sentence.trim()) return sentence;
    const words = sentence.split(' ');
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
    const capitalizedSentence = capitalizedWords.join(' ');
    return capitalizedSentence;
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/ask/:token', (req, res) => {
    const { token } = req.params;
    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(404).sendFile(path.join(__dirname, 'public', '404.html'))
        } else {
            let name = decoded.name
            name = capitalizeName(name)
            return res.status(200).render('page2', { name })
        }
    });
});

app.get('/congrats', (req, res) => {
    return res.status(200).sendFile(path.join(__dirname, 'public', 'congrats.html'))
});

app.post('/submitForm', (req, res) => {
    const name = req.body;
    try {
        const token = jwt.sign(name, secretKey, { expiresIn: '24h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.use((err, req, res, next) => {
    res.status(500).json({ error: 'Internal Server Error' });
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'))
})

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
