// server.js
// Express backend for React app + contact form API

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// خدمة الملفات الثابتة (React build dist)
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/api/contact', async (req, res) => {
  const data = req.body;
  
  // مثال: حفظ البيانات في ملف JSON (بدل Cosmos DB)
  const fs = require('fs');
  const filePath = path.join(__dirname, 'submissions.json');
  
  // قراءة البيانات الموجودة
  let submissions = [];
  try {
    if (fs.existsSync(filePath)) {
      submissions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.log('Creating new submissions file');
  }
  
  // إضافة الطلب الجديد
  const newSubmission = {
    id: Date.now(),
    name: data.name,
    company: data.company,
    email: data.email,
    phone: data.phone,
    type: data.type,
    cities: data.cities,
    volume: data.volume,
    details: data.details,
    createdAt: new Date().toISOString()
  };
  
  submissions.push(newSubmission);
  
  // حفظ البيانات
  try {
    fs.writeFileSync(filePath, JSON.stringify(submissions, null, 2), 'utf-8');
    res.status(201).json({ success: true, message: 'تم استلام طلبك بنجاح ✅' });
  } catch (err) {
    console.error('Error saving submission:', err);
    res.status(500).json({ success: false, error: 'خطأ في حفظ البيانات' });
  }
});

// SPA Routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send('Not found');
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📍 Visit: http://localhost:${port}`);
});
