import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportFullReport({
  revenue,
  sales,
  products,
  chartData,
  dailyData,
  productData,
  companyId
}) {
  const doc = new jsPDF();

  const date = new Date().toLocaleDateString("pt-BR");

  // HEADER
  doc.setFontSize(18);
  doc.text("RELATÓRIO EMPRESARIAL COMPLETO", 14, 20);

  doc.setFontSize(11);
  doc.text(`Data: ${date}`, 14, 30);
  doc.text(`Empresa: ${companyId}`, 14, 36);

  // KPIs
  doc.setFontSize(14);
  doc.text(`Receita total: R$ ${revenue.toFixed(2)}`, 14, 50);

  doc.text(`Total de vendas: ${sales.length}`, 14, 58);

  doc.text(`Total de produtos: ${products.length}`, 14, 66);

  // VENDAS
  doc.setFontSize(12);
  doc.text("Últimas vendas:", 14, 80);

  autoTable(doc, {
    startY: 85,
    head: [["Data", "Valor"]],
    body: sales.slice(0, 15).map((s) => [
      new Date(s.created_at).toLocaleDateString("pt-BR"),
      `R$ ${Number(s.total).toFixed(2)}`
    ]),
    theme: "grid"
  });

  // TOP PRODUTOS
  const y2 = doc.lastAutoTable.finalY + 10;

  doc.text("Top produtos:", 14, y2);

  autoTable(doc, {
    startY: y2 + 5,
    head: [["Produto", "Qtd"]],
    body: productData.map((p) => [
      p.name,
      p.qty
    ]),
    theme: "grid"
  });

  // RESUMO FINAL
  const y3 = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(11);
  doc.text(
    "Este relatório foi gerado automaticamente pelo sistema SaaS.",
    14,
    y3
  );

  doc.save("relatorio-empresarial.pdf");
}