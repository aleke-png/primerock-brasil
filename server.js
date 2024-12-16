require('dotenv').config(); // Carrega variáveis de ambiente
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer'); // Para lidar com uploads de arquivos

// Configuração do servidor
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.static('public')); // Diretório de arquivos estáticos

// Configuração para upload de arquivos (RG)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
});

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Função para enviar email
const sendEmail = async (formData, file) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'Novo Cadastro do Formulário',
        text: `
            Nome: ${formData.name}
            Endereço: ${formData.address}
            Data de Nascimento: ${formData.dob}
            CPF: ${formData.cpf}
        `,
        attachments: file
            ? [
                  {
                      filename: 'RG_uploaded.jpg',
                      content: file.buffer,
                  },
              ]
            : [],
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email enviado:', info.response);
        return true;
    } catch (error) {
        console.error('Erro ao enviar email:', error);
        return false;
    }
};

// Rota para receber os dados do formulário
app.post('/send-data', upload.single('rg'), async (req, res) => {
    const formData = req.body; // Os dados do formulário
    const file = req.file; // O arquivo enviado

    // Garantir que todos os dados estejam presentes
    console.log('FormData:', formData);
    console.log('File:', file);

    try {
        const emailSent = await sendEmail(formData, file);
        if (emailSent) {
            res.status(200).json({ message: 'Dados enviados com sucesso!' });
        } else {
            res.status(500).json({ message: 'Erro ao enviar os dados.' });
        }
    } catch (error) {
        console.error('Erro ao processar a solicitação:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// Rota inicial para verificar o funcionamento
app.get('/', (req, res) => {
    res.send('Servidor rodando corretamente!');
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
