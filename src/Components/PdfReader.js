// src/components/PdfReader.js
import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.js`;

const PdfReader = () => {
  const [textContent, setTextContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setIsLoading(true);
      await extractTextFromPDF(file);
      setIsLoading(false);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  const extractTextFromPDF = async (file) => {
    const fileReader = new FileReader();

    fileReader.onload = async function () {
      const pdfData = new Uint8Array(this.result);
      const pdfDoc = await pdfjsLib.getDocument(pdfData).promise;
      let text = '';

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        text += `Page ${i}: ${pageText}\n\n`;
      }

      setTextContent(text || 'No text found in PDF. Attempting OCR...');
      if (!text) {
        await performOCR(file);
      }
    };

    fileReader.readAsArrayBuffer(file);
  };

  const performOCR = async (file) => {
    const fileReader = new FileReader();

    fileReader.onload = async () => {
      const image = fileReader.result;
      Tesseract.recognize(image, 'eng', {
        logger: (m) => console.log(m),
      })
        .then(({ data: { text } }) => {
          setTextContent(text);
        })
        .catch((error) => {
          console.error('OCR error:', error);
          setTextContent('Error performing OCR on the PDF.');
        });
    };

    fileReader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>PDF Reader with OCR</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {isLoading && <p>Loading...</p>}
      <pre style={{ whiteSpace: 'pre-wrap', marginTop: '20px' }}>{textContent}</pre>
    </div>
  );
};

export default PdfReader;
