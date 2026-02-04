import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportPDFOptions {
  title: string;
  headers: string[];
  data: (string | number)[][];
  filename: string;
}

export function exportToPDF({ title, headers, data, filename }: ExportPDFOptions) {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.setTextColor(34, 197, 94); // Green color
  doc.text(title, 14, 22);
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 30);
  
  // Add table
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 40,
    theme: 'striped',
    headStyles: {
      fillColor: [34, 197, 94],
      textColor: 255,
      fontSize: 10,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 40 },
  });
  
  // Save
  doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
}
