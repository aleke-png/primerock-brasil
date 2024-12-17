require('dotenv').config(); // Carrega variáveis de ambiente
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer'); // Para lidar com uploads de arquivos

// Verifica se as variáveis de ambiente estão configuradas
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("ERRO: Variáveis de ambiente EMAIL_USER e EMAIL_PASS não estão definidas!");
    process.exit(1);
}

// Configuração do servidor
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Processamento JSON
app.use(express.urlencoded({ extended: true })); // Processamento de formulários
app.use(express.static('public')); // Diretório de arquivos estáticos

// Configuração do upload com validação de arquivos
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
        }
        cb(null, true);
    },
});

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Função para enviar e-mail
const sendEmail = async (formData, file) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'Novo Cadastro do Formulário',
        text: `
            Nome: ${formData.name || 'Não fornecido'}
            Endereço: ${formData.address || 'Não fornecido'}
            Data de Nascimento: ${formData.dob || 'Não fornecido'}
            CPF: ${formData.cpf || 'Não fornecido'}
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

// Rota para envio de dados e arquivos
app.post('/send-data', upload.single('rg'), async (req, res) => {
    const formData = req.body;
    const file = req.file;

    // Validação dos campos obrigatórios
    if (!formData.name || !formData.address || !formData.dob || !formData.cpf) {
        console.error("ERRO: Campos obrigatórios faltando.", formData);
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const emailSent = await sendEmail(formData, file);
        if (emailSent) {
            res.status(200).json({ message: 'Dados enviados com sucesso!' });
        } else {
            res.status(500).json({ message: 'Erro ao enviar os dados.' });
        }
    } catch (error) {
        console.error('Erro interno:', error);
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
