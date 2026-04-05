import React, { useState } from 'react';
import { formatHours, formatMonthLabel, maskCPF } from '../lib/utils';
import { FileDown, Table, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function Relatorio({ logs, tickets, profile }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().substring(0, 7);
  });

  const filteredLogs = logs.filter(l => l.date_iso?.startsWith(selectedMonth));
  const filteredTickets = tickets.filter(t => t.date?.startsWith(selectedMonth));
  const totalH = filteredLogs.reduce((s, l) => s + l.total_horas, 0);

  const exportCSV = () => {
    if (!filteredLogs.length) return;
    const cpfFmt = profile.cpf ? maskCPF(profile.cpf) : '';
    let csv = `Relatório de Atividade - ${formatMonthLabel(selectedMonth)}\nNome: ${profile.name} | CPF: ${cpfFmt} | Cargo: ${profile.cargo}\n\nREGISTROS DE PONTO\nData,Início,Fim,Total Horas,Resumo\n`;
    filteredLogs.forEach(l => {
      csv += `"${l.date}","${l.hora_inicio}","${l.hora_fim}","${l.total_horas}","${l.resumo.replace(/"/g, '""')}"\n`;
    });
    csv += `\nCHAMADOS\nData Início,Hora Início,Data Fim,Hora Fim,Ref,Setor/Órgão,Descrição,Status\n`;
    filteredTickets.forEach(t => {
      csv += `"${t.dateDisplay}","${t.hora}","${t.data_fim || ''}","${t.hora_fim || ''}","${t.ref}","${t.cliente}","${t.description.replace(/"/g, '""')}","${t.status}"\n`;
    });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verdelog_${selectedMonth}.csv`;
    a.click();
  };

  const exportPDF = () => {
    if (!filteredLogs.length) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const green = [0, 200, 150];
    const dark = [15, 25, 20];
    const gray = [100, 120, 115];
    const cpfFmt = profile.cpf ? maskCPF(profile.cpf) : '—';

    // Background
    doc.setFillColor(...dark);
    doc.rect(0, 0, 210, 297, 'F');

    // Header
    doc.setFillColor(...green);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(15, 25, 20);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('VerdeIT', 15, 18);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Atividade', 15, 27);
    doc.setFontSize(9);
    doc.text(formatMonthLabel(selectedMonth).toUpperCase(), 15, 35);

    // Profile Card
    doc.setFillColor(20, 35, 28);
    doc.roundedRect(10, 48, 190, 30, 3, 3, 'F');
    doc.setTextColor(...green);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVIDOR / COLABORADOR', 18, 56);
    doc.setTextColor(220, 240, 235);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(profile.name || '—', 18, 63);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(`CPF: ${cpfFmt}   ·   Cargo: ${profile.cargo || '—'}   ·   E-mail: ${profile.email || '—'}`, 18, 73);

    // Stats
    const stats = [
      { label: 'DIAS', value: filteredLogs.length },
      { label: 'HORAS', value: formatHours(totalH) },
      { label: 'CHAMADOS', value: filteredTickets.length }
    ];
    stats.forEach((b, i) => {
      const x = 10 + i * 65;
      doc.setFillColor(20, 35, 28);
      doc.roundedRect(x, 86, 62, 22, 3, 3, 'F');
      doc.setTextColor(...green);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(String(b.value), x + 10, 101);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      doc.text(b.label, x + 10, 94);
    });

    // Table
    let y = 118;
    doc.setTextColor(...green);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('REGISTROS DE PONTO', 15, y);
    y += 5;
    doc.setFillColor(...green);
    doc.rect(10, y, 190, 7, 'F');
    doc.setTextColor(15, 25, 20);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    ['DATA', 'INÍCIO', 'FIM', 'HORAS', 'RESUMO'].forEach((h, i) => doc.text(h, [14, 46, 66, 82, 105][i], y + 5));
    y += 8;

    filteredLogs.forEach((log, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      if (i % 2 === 0) { doc.setFillColor(18, 30, 24); doc.rect(10, y - 1, 190, 7, 'F'); }
      doc.setTextColor(220, 240, 235);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(log.date, 14, y + 4);
      doc.text(log.hora_inicio, 46, y + 4);
      doc.text(log.hora_fim, 66, y + 4);
      doc.setTextColor(...green);
      doc.text(formatHours(log.total_horas), 82, y + 4);
      doc.setTextColor(180, 210, 200);
      doc.text(log.resumo.length > 55 ? log.resumo.substring(0, 55) + '…' : log.resumo, 105, y + 4);
      y += 7;
    });

    // Tickets Table
    if (filteredTickets.length > 0) {
      y += 15;
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setTextColor(...green);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('CHAMADOS', 15, y);
      y += 5;
      doc.setFillColor(...green);
      doc.rect(10, y, 190, 7, 'F');
      doc.setTextColor(15, 25, 20);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      ['REF', 'INÍCIO', 'FIM', 'STATUS', 'DESCRIÇÃO'].forEach((h, i) => doc.text(h, [14, 35, 65, 95, 120][i], y + 5));
      y += 8;

      filteredTickets.forEach((t, i) => {
        if (y > 260) { doc.addPage(); y = 20; }
        if (i % 2 === 0) { doc.setFillColor(18, 30, 24); doc.rect(10, y - 1, 190, 7, 'F'); }
        doc.setTextColor(220, 240, 235);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(t.ref || '—', 14, y + 4);
        doc.text(`${t.dateDisplay || ''} ${t.hora || ''}`, 35, y + 4);
        doc.text(t.data_fim ? `${t.data_fim} ${t.hora_fim || ''}` : '—', 65, y + 4);
        
        const statusLabel = t.status === 'resolved' ? 'Resolvido' : t.status === 'open' ? 'Aberto' : t.status === 'pending' ? 'Pendente' : 'Escalado';
        doc.setTextColor(...(t.status === 'resolved' ? green : [255, 179, 71]));
        doc.text(statusLabel, 95, y + 4);
        
        doc.setTextColor(180, 210, 200);
        doc.text(t.description.length > 45 ? t.description.substring(0, 45) + '…' : t.description, 120, y + 4);
        y += 7;
      });
    }

    // Footer
    doc.setFillColor(20, 35, 28);
    doc.rect(0, 280, 210, 17, 'F');
    doc.setTextColor(...gray);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} · VerdeIT — Gestão de TI`, 105, 291, { align: 'center' });

    doc.save(`verdeit_${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display font-bold text-[1.05rem]">Gerar Relatório</h2>
      
      <div className="bg-surface border border-border2 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,200,150,0.07)]">
        <p className="text-[0.78rem] text-text-muted mb-4">Selecione o mês e exporte para comprovação junto ao órgão.</p>
        
        <div className="mb-5">
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Mês</label>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
          >
            {months.map(m => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={exportPDF}
            className="bg-green text-bg font-semibold text-[0.9rem] p-3 rounded-lg shadow-[0_4px_20px_rgba(0,200,150,0.3)] hover:bg-green-dim transition-all flex items-center justify-center gap-2"
          >
            <FileDown size={18} /> PDF
          </button>
          <button 
            onClick={exportCSV}
            className="bg-surface border border-border text-text-dim font-semibold text-[0.9rem] p-3 rounded-lg hover:border-border2 hover:text-text hover:bg-surface2 transition-all flex items-center justify-center gap-2"
          >
            <Table size={18} /> CSV
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-5">
        <h3 className="text-[0.9rem] font-semibold text-text-dim mb-4">Pré-visualização</h3>
        {filteredLogs.length > 0 ? (
          <div className="text-[0.82rem] text-text-dim leading-relaxed">
            <div className="mb-3">
              <strong className="text-text">{profile.name || '—'}</strong> · CPF {profile.cpf ? maskCPF(profile.cpf) : '—'}
              <br />
              <span className="text-text-muted">{profile.cargo || '—'}</span>
            </div>
            <div className="h-px bg-border my-4" />
            <div className="grid grid-cols-3 text-center gap-2 my-4">
              <div>
                <div className="font-mono text-lg font-medium text-green">{filteredLogs.length}</div>
                <div className="text-[0.65rem] text-text-muted uppercase">Dias</div>
              </div>
              <div>
                <div className="font-mono text-lg font-medium text-green">{formatHours(totalH)}</div>
                <div className="text-[0.65rem] text-text-muted uppercase">Total</div>
              </div>
              <div>
                <div className="font-mono text-lg font-medium text-green">{filteredTickets.length}</div>
                <div className="text-[0.65rem] text-text-muted uppercase">Chamados</div>
              </div>
            </div>
            <div className="h-px bg-border my-4" />
            <p className="text-text-muted text-[0.75rem]">Inclui {filteredLogs.length} registros de ponto e {filteredTickets.length} chamados.</p>
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted flex flex-col items-center gap-3 opacity-50">
            <FileText size={32} />
            <p className="text-[0.82rem]">Sem registros para {formatMonthLabel(selectedMonth)}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
