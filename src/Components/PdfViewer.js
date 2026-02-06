import React, { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

function PDFViewer() {
  const [pdfText, setPdfText] = useState('');

  useEffect(() => {
    const fetchPdfText = async () => {
      try {
        // URL of the PDF file (local file or server path)
        const pdfUrl = 'http://localhost:5000/download-cocoon-tender';

        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;

        let extractedText = '';

        // Loop through each page and extract text
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          // Concatenate text from each page
          const pageText = textContent.items.map(item => item.str).join(' ');
          extractedText += pageText + '\n';
        }

        setPdfText(extractedText); // Update state with the extracted text
      } catch (error) {
        console.error('Error extracting PDF text:', error);
      }
    };

    fetchPdfText();
  }, []);

  return (
    <div>
      <h2>PDF Content</h2>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.5' }}>
        {pdfText}
      </pre>
    </div>
  );
}

export default PDFViewer;
