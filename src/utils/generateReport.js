import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generatePDF({ sales, products, companyId }) {
  const doc = new jsPDF();

  const total = sales.reduce(
    (acc, s) => acc + Number(s.total || 0),
    0
  );

  const date = new Date().toLocaleDateString("pt-BR");

  // HEADER
  doc.setFontSize(18);
  doc.text("RELATÓRIO DE VENDAS", 14, 20);

  doc.setFontSize(11);
  doc.text(`Data: ${date}`, 14, 30);
  doc.text(`Empresa ID: ${companyId}`, 14, 36);

  doc.setFontSize(14);
  doc.text(`Faturamento total: R$ ${total.toFixed(2)}`, 14, 48);
  doc.text(`Total de vendas: ${sales.length}`, 14, 56);

  // TOP PRODUTOS (simples baseado em estoque)
  doc.setFontSize(12);
  doc.text("Produtos cadastrados:", 14, 70);

  autoTable(doc, {
    startY: 75,
    head: [["Produto", "Estoque"]],
    body: products.slice(0, 10).map((p) => [
      p.name,
      p.stock
    ]),
    theme: "grid",
    styles: {
      fontSize: 10
    }
  });

  // VENDAS
  const finalY = doc.lastAutoTable.finalY + 10;

  doc.text("Últimas vendas:", 14, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    head: [["Data", "Valor"]],
    body: sales.slice(0, 10).map((s) => [
      new Date(s.created_at).toLocaleDateString("pt-BR"),
      `R$ ${Number(s.total).toFixed(2)}`
    ]),
    theme: "grid",
    styles: {
      fontSize: 10
    }
  });

  doc.save("relatorio-saas.pdf");
}