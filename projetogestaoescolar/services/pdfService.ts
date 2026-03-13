import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export class PDFService {
    /**
     * Generates a PDF for FOA (Ficha de Observação do Aluno)
     * Uses a green palette. Accepts real rows + observations from foaDataHelper.
     */
    static async generateFOAPDF(data: any) {
        const doc = new jsPDF();
        const { studentName, className, bimestre, year, rows, observations } = data;
        let { schoolLogoUrl } = data;

        if (!schoolLogoUrl) {
            schoolLogoUrl = localStorage.getItem('educontrol_school_logo');
        }

        // Header - Green Palette
        doc.setFillColor(34, 197, 94); // emerald-500
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        if (schoolLogoUrl) {
            try {
                // We add the image to the PDF.
                doc.addImage(schoolLogoUrl, 'PNG', 15, 5, 30, 30, undefined, 'FAST');
            } catch (e) {
                console.error("Error adding logo to PDF", e);
                doc.setFontSize(22);
                doc.setFont("helvetica", "bold");
                doc.text("EduControl PRO", 20, 18);
            }
        } else {
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("EduControl PRO", 20, 18);
        }

        const titleX = schoolLogoUrl ? 50 : 20;

        doc.setFontSize(14);
        doc.text("FICHA DE OBSERVAÇÃO DO ALUNO (FOA)", titleX, 28);
        doc.setFontSize(10);
        doc.text(`${bimestre}º Bimestre - Ano Letivo ${year || new Date().getFullYear()}`, titleX, 35);

        // Content
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`ALUNO(A): ${studentName.toUpperCase()}`, 15, 55);
        doc.text(`TURMA: ${className}`, 150, 55);
        doc.text(`EMITIDO EM: ${format(new Date(), "dd/MM/yyyy")}`, 15, 62);

        // Legend/Concepts
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("CONCEITOS: (O) ÓTIMO | (B) BOM | (S) SATISFATÓRIO | (I) INSUFICIENTE | (-) NÃO AVALIADO", 15, 70);

        // Main Table (Disciplines/Concepts)
        if (rows && rows.length > 0) {
            autoTable(doc, {
                startY: 75,
                head: [['Disciplina', 'C', 'A', 'T', 'At', 'M', 'E', 'Ag', 'P']],
                body: rows.map((r: any) => [
                    r.subject,
                    r.comportamento, r.atencao, r.tarefas, r.atividades,
                    r.material, r.engajamento, r.autogestao, r.participacao
                ]),
                headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
                styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
                columnStyles: { 0: { halign: 'left', cellWidth: 45, fontStyle: 'bold' } },
                margin: { left: 15, right: 15 }
            });
        }

        const nextY = (doc as any).lastAutoTable?.finalY || 85;

        // Legend below table
        if (rows && rows.length > 0) {
            doc.setFontSize(7);
            doc.setTextColor(107, 114, 128);
            doc.text("C=Comportamento | A=Atenção | T=Tarefas | At=Atividades | M=Material | E=Engajamento | Ag=Autogestão | P=Participação", 15, nextY + 5);
        }

        // Observations Section
        if (observations && observations.length > 0) {
            const obsY = nextY + (rows && rows.length > 0 ? 12 : 0);
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(31, 41, 55);
            doc.text("OBSERVAÇÕES PEDAGÓGICAS:", 15, obsY);

            autoTable(doc, {
                startY: obsY + 5,
                head: [['Data', 'Disciplina', 'Docente', 'Observação']],
                body: observations.slice(0, 20).map((o: any) => [
                    format(new Date(o.date), "dd/MM"),
                    o.subject,
                    o.teacher,
                    o.note
                ]),
                headStyles: { fillColor: [107, 114, 128], textColor: [255, 255, 255] },
                styles: { fontSize: 7, cellPadding: 2 },
                columnStyles: {
                    0: { cellWidth: 18 },
                    1: { cellWidth: 30 },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 'auto' }
                },
                margin: { left: 15, right: 15 }
            });
        } else {
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(107, 114, 128);
            doc.text("Acompanhamento pedagógico regular registrado na plataforma.", 15, nextY + 15);
        }

        // Signature area
        const sigStartY = (doc as any).lastAutoTable?.finalY
            ? (doc as any).lastAutoTable.finalY + 20
            : nextY + 30;

        if (sigStartY < 260) {
            doc.setDrawColor(209, 213, 219);
            doc.line(20, sigStartY, 90, sigStartY);
            doc.line(120, sigStartY, 190, sigStartY);

            doc.setFontSize(9);
            doc.setTextColor(31, 41, 55);
            doc.text("Assinatura do Responsável", 55, sigStartY + 5, { align: "center" });
            doc.text("Assinatura da Coordenação", 155, sigStartY + 5, { align: "center" });
        }

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            doc.text(`Gerado via EduControl PRO em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 15, 285);
            doc.text(`Página ${i} de ${pageCount}`, 195, 285, { align: "right" });
        }

        doc.save(`FOA_${studentName.replace(/\s+/g, '_')}_${bimestre}B.pdf`);
    }

    /**
     * Generates a PDF for an Occurrence report
     */
    static async generateOccurrencePDF(data: any) {
        const doc = new jsPDF();
        const { studentName, className, date, typeLabel, description, photos } = data;

        // Header - Slate Palette for Occurrences
        doc.setFillColor(71, 85, 105); // slate-600
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("EduControl PRO", 105, 15, { align: "center" });

        doc.setFontSize(14);
        doc.text("REGISTRO DE OCORRÊNCIA ESCOLAR", 105, 25, { align: "center" });
        doc.setFontSize(10);
        doc.text(`Documento Oficial de Registro`, 105, 32, { align: "center" });

        // Information Section
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(12);

        autoTable(doc, {
            startY: 50,
            body: [
                ['Aluno(a):', studentName],
                ['Turma:', className],
                ['Data do Evento:', format(new Date(date), "dd/MM/yyyy")],
                ['Tipo de Ocorrência:', typeLabel.toUpperCase()]
            ],
            theme: 'plain',
            styles: { fontSize: 11, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        // Description
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("DESCRIÇÃO DOS FATOS:", 15, finalY);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const splitDescription = doc.splitTextToSize(description, 180);
        doc.text(splitDescription, 15, finalY + 7);

        // Signatures
        const sigY = finalY + 60;
        doc.setDrawColor(209, 213, 219);
        doc.line(20, sigY, 90, sigY);
        doc.line(120, sigY, 190, sigY);

        doc.setFontSize(9);
        doc.text("Assinatura do Responsável", 55, sigY + 5, { align: "center" });
        doc.text("Assinatura da Coordenação", 155, sigY + 5, { align: "center" });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Gerado via EduControl PRO em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 15, 285);

        doc.save(`Ocorrencia_${studentName.replace(/\s+/g, '_')}_${format(new Date(date), "yyyyMMdd")}.pdf`);
    }

    /**
     * Generates a PDF for a Student Report — now with real grade data
     * Accepts: studentName, className, avgGrade, totalClasses, chartData (array of {date, aluno, mediaTurma})
     */
    static async generateStudentReportPDF(data: any) {
        const doc = new jsPDF();
        const { studentName, className, avgGrade, totalClasses, chartData } = data;
        let { schoolLogoUrl } = data;

        if (!schoolLogoUrl) {
            schoolLogoUrl = localStorage.getItem('educontrol_school_logo');
        }

        // Header - Blue Palette
        doc.setFillColor(59, 130, 246); // blue-500
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        if (schoolLogoUrl) {
            try {
                doc.addImage(schoolLogoUrl, 'PNG', 15, 5, 30, 30, undefined, 'FAST');
            } catch (e) {
                console.error("Error adding logo to PDF", e);
                doc.setFontSize(22);
                doc.setFont("helvetica", "bold");
                doc.text("EduControl PRO", 105, 15, { align: "center" });
            }
        } else {
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("EduControl PRO", 105, 15, { align: "center" });
        }

        doc.setFontSize(14);
        doc.text("RELATÓRIO INDIVIDUAL DO ALUNO", 105, 25, { align: "center" });
        doc.setFontSize(10);
        doc.text(`Emitido em ${format(new Date(), "dd/MM/yyyy")}`, 105, 33, { align: "center" });

        // Student info
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Aluno(a): ${studentName}`, 15, 55);
        doc.text(`Turma: ${className}`, 150, 55);

        // Summary box
        doc.setFillColor(241, 245, 249); // slate-100
        doc.roundedRect(15, 65, 180, 22, 3, 3, 'F');

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(31, 41, 55);
        doc.text("RESUMO DO PERÍODO", 20, 73);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(`Média Geral: ${avgGrade || '—'}`, 20, 82);
        doc.text(`Total de Aulas Registradas: ${totalClasses || 0}`, 100, 82);

        // Performance table from chartData
        if (chartData && chartData.length > 0) {
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(31, 41, 55);
            doc.text("HISTÓRICO DE DESEMPENHO POR AULA:", 15, 100);

            autoTable(doc, {
                startY: 105,
                head: [['Data', 'Professor', 'Nota Aluno', 'Média Turma']],
                body: chartData.slice(0, 30).map((d: any) => [
                    d.date,
                    d.teacherName || '—',
                    d.aluno != null ? d.aluno.toFixed(1) : '—',
                    d.mediaTurma != null ? d.mediaTurma.toFixed(1) : '—'
                ]),
                headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
                columnStyles: {
                    0: { halign: 'left', cellWidth: 25 },
                    1: { halign: 'left', cellWidth: 55 }
                },
                margin: { left: 15, right: 15 }
            });
        } else {
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(107, 114, 128);
            doc.text("Nenhum dado de aula registrado para o período selecionado.", 15, 100);
        }

        const endY = (doc as any).lastAutoTable?.finalY || 110;

        // Final note
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text("Este relatório é um documento informativo e não substitui o boletim oficial.", 15, endY + 10);

        // Signatures
        if (endY + 30 < 260) {
            const sigY = endY + 25;
            doc.setDrawColor(209, 213, 219);
            doc.line(20, sigY, 90, sigY);
            doc.line(120, sigY, 190, sigY);

            doc.setFontSize(9);
            doc.setTextColor(31, 41, 55);
            doc.text("Assinatura do Responsável", 55, sigY + 5, { align: "center" });
            doc.text("Assinatura da Coordenação", 155, sigY + 5, { align: "center" });
        }

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            doc.text(`Gerado via EduControl PRO em ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 15, 285);
            doc.text(`Página ${i} de ${pageCount}`, 195, 285, { align: "right" });
        }

        doc.save(`Relatorio_${studentName.replace(/\s+/g, '_')}.pdf`);
    }
}
