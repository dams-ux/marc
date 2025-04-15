const express = require("express");
const bodyParser = require("body-parser");
const { Configuration, OpenAIApi } = require("openai");
const { Http2ServerRequest } = require("http2");
const { Server } = require("http");

const app = express();
app.use(bodyParser.json());

const configuration = new Configuration({
    apiKey: "VOTRE_CLE_API_OPENAI", // Remplacez par votre clé API OpenAI
});
const openai = new OpenAIApi(configuration);

app.post("/api/ask", async (req, res) => {
    const { message } = req.body;

    try {
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: message,
            max_tokens: 150,
        });

        res.json({ reply: response.data.choices[0].text.trim() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur lors de la communication avec OpenAI" });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));

