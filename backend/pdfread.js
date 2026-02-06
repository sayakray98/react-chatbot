const fs = require('fs');
const { PDFImage } = require("pdf-image");
const Tesseract = require('tesseract.js');
const path = require('path');

const pdfPath = 'D:\\React projects of Sayak\\React Chatbot\\react-chatbot\\backend\\uploads\\cocoon_tender.pdf';

// Function to perform OCR on an image
async function performOCR(imagePath) {
  try {
    console.log("Performing OCR on image:", imagePath);
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: (m) => console.log(m),  // Logs OCR progress
    });
    console.log("OCR Text Content:", text);
  } catch (error) {
    console.error("Error performing OCR:", error);
  }
}

// Function to convert PDF to images and process each page with OCR
async function convertPDFToImagesAndOCR(pdfPath) {
  const pdfImage = new PDFImage(pdfPath);

  try {
    // Get the number of pages in the PDF
    const numberOfPages = await pdfImage.numberOfPages();

    for (let page = 0; page < numberOfPages; page++) {
      const imagePath = await pdfImage.convertPage(page);
      console.log(`Converted page ${page + 1} to image:`, imagePath);

      // Perform OCR on each image page
      await performOCR(imagePath);
    }
  } catch (error) {
    console.error("Error converting PDF to images or performing OCR:", error);
  }
}

// Start the PDF processing
if (fs.existsSync(pdfPath)) {
  convertPDFToImagesAndOCR(pdfPath);
} else {
  console.error("PDF file does not exist at path:", pdfPath);
}
