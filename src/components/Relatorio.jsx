import React, { useState } from 'react';
import { formatHours, formatMonthLabel, maskCPF } from '../lib/utils';
import { FileDown, Table, FileText, ShieldAlert } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function Relatorio({ logs, tickets, profile }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [includeLogs, setIncludeLogs] = useState(true);
  const [includeTickets, setIncludeTickets] = useState(true);
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all'); // 'all', 'resolved', 'open'

  if (profile?.role !== 'admin_sistema' && profile?.role !== 'admin_ti') {
    return (
      <div className="p-8 text-center bg-surface border border-border rounded-3xl">
        <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
        <p className="text-text-muted">Você não tem permissão para acessar os relatórios.</p>
      </div>
    );
  }

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().substring(0, 7);
  });

  const filteredLogs = logs.filter(l => l.date_iso?.startsWith(selectedMonth));
  const filteredTickets = tickets.filter(t => {
    if (!t.date?.startsWith(selectedMonth)) return false;
    if (ticketStatusFilter === 'resolved' && t.status !== 'resolved') return false;
    if (ticketStatusFilter === 'open' && t.status === 'resolved') return false;
    return true;
  });
  const totalH = filteredLogs.reduce((s, l) => s + l.total_horas, 0);

  const exportCSV = () => {
    if (!includeLogs && !includeTickets) return;
    const cpfFmt = profile.cpf ? maskCPF(profile.cpf) : '';
    let csv = `Relatório de Atividade - ${formatMonthLabel(selectedMonth)}\nNome: ${profile.name} | CPF: ${cpfFmt} | Cargo: ${profile.cargo}\n\n`;
    
    if (includeLogs) {
      csv += `REGISTROS DE PONTO\nData,Início,Fim,Total Horas,Resumo\n`;
      filteredLogs.forEach(l => {
        csv += `"${l.date}","${l.hora_inicio}","${l.hora_fim}","${l.total_horas}","${l.resumo.replace(/"/g, '""')}"\n`;
      });
      csv += `\n`;
    }

    if (includeTickets) {
      csv += `CHAMADOS\nTipo,Data Início,Hora Início,Data Fim,Hora Fim,SLA,Ref,Setor/Órgão,Solicitante,Categoria,Prioridade,Descrição,Resolução,Status\n`;
      filteredTickets.forEach(t => {
        let sla = '';
        if (t.created_at && t.resolved_at) {
          const diffMs = new Date(t.resolved_at) - new Date(t.created_at);
          const h = Math.floor(diffMs / (1000 * 60 * 60));
          const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          sla = `${h}h ${m}m`;
        }
        
        const catMap = { 'hardware': 'Hardware', 'software': 'Software', 'network': 'Rede', 'printer': 'Impressora', 'other': 'Outros' };
        const prioMap = { 'low': 'Baixa', 'medium': 'Média', 'high': 'Alta', 'urgent': 'Urgente' };
        const statusMap = { 'open': 'Aberto', 'in_progress': 'Em Andamento', 'pending': 'Pendente', 'resolved': 'Resolvido', 'escalated': 'Escalado' };
        
        const typeStr = t.ticket_type === 'request' ? 'Requisição' : 'Incidente';
        const cat = catMap[t.category] || t.category || '';
        const prio = prioMap[t.priority] || t.priority || '';
        const stat = statusMap[t.status] || t.status || '';
        const desc = (t.description || '').replace(/"/g, '""');
        const sol = (t.solution || '').replace(/"/g, '""');

        csv += `"${typeStr}","${t.dateDisplay || ''}","${t.hora || ''}","${t.data_fim || ''}","${t.hora_fim || ''}","${sla}","${t.ref || ''}","${t.cliente || ''}","${t.requester || ''}","${cat}","${prio}","${desc}","${sol}","${stat}"\n`;
      });
    }

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verdelog_${selectedMonth}.csv`;
    a.click();
  };

    const exportPDF = () => {
    if ((!includeLogs || !filteredLogs.length) && (!includeTickets || !filteredTickets.length)) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const black = [0, 0, 0];
    const darkGray = [60, 60, 60];
    const lightGray = [220, 220, 220];
    const cpfFmt = profile.cpf ? maskCPF(profile.cpf) : '—';

    // Header
    doc.setTextColor(...black);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('VerdeIT', 15, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Relatório de Atividade', 15, 28);
    doc.setFontSize(10);
    doc.setTextColor(...darkGray);
    doc.text(formatMonthLabel(selectedMonth).toUpperCase(), 15, 34);

    // Profile Card (Border only, no fill)
    doc.setDrawColor(...black);
    doc.setLineWidth(0.3);
    doc.roundedRect(10, 42, 190, 28, 2, 2);
    doc.setTextColor(...black);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVIDOR / COLABORADOR', 15, 50);
    doc.setFontSize(12);
    doc.text(profile.name || '—', 15, 58);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.text(`CPF: ${cpfFmt}   ·   Cargo: ${profile.cargo || '—'}   ·   E-mail: ${profile.email || '—'}`, 15, 66);

    // Table
    let y = 80;
    if (includeLogs && filteredLogs.length > 0) {
      doc.setTextColor(...black);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('REGISTROS DE PONTO', 15, y);
      y += 4;
      
      // Table Header
      doc.setFillColor(...lightGray);
      doc.rect(10, y, 190, 8, 'F');
      doc.setTextColor(...black);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      ['DATA', 'INÍCIO', 'FIM', 'HORAS', 'RESUMO'].forEach((h, i) => doc.text(h, [14, 46, 66, 86, 110][i], y + 5.5));
      y += 8;

      filteredLogs.forEach((log, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        // Alternating row background (very light gray)
        if (i % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(10, y, 190, 8, 'F'); }
        
        doc.setTextColor(...black);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(log.date, 14, y + 5.5);
        doc.text(log.hora_inicio, 46, y + 5.5);
        doc.text(log.hora_fim, 66, y + 5.5);
        doc.setFont('helvetica', 'bold');
        doc.text(formatHours(log.total_horas), 86, y + 5.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        doc.text(log.resumo.length > 55 ? log.resumo.substring(0, 55) + '…' : log.resumo, 110, y + 5.5);
        y += 8;
      });
    }

    // Tickets Table
    if (includeTickets && filteredTickets.length > 0) {
      y += 12;
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setTextColor(...black);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('CHAMADOS DE TI', 15, y);
      y += 4;
      
      // Table Header
      doc.setFillColor(...lightGray);
      doc.rect(10, y, 190, 8, 'F');
      doc.setTextColor(...black);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      ['INÍCIO', 'FIM', 'SETOR/ÓRGÃO', 'SOLICITANTE', 'CATEGORIA'].forEach((h, i) => doc.text(h, [14, 40, 70, 115, 160][i], y + 5.5));
      y += 8;

      filteredTickets.forEach((t, i) => {
        const catMap = { 'hardware': 'Hardware', 'software': 'Software', 'network': 'Rede', 'printer': 'Impressora', 'other': 'Outros' };
        const cat = catMap[t.category] || t.category || '—';
        const setor = t.cliente || '—';
        const solicitante = t.requester || '—';
        const desc = t.description || '—';
        const solucao = t.solution || '—';

        // Calculate lines for description and resolution
        const descLines = doc.splitTextToSize(`Descrição: ${desc}`, 180);
        const solLines = doc.splitTextToSize(`Resolução: ${solucao}`, 180);
        
        const rowHeight = 8 + (descLines.length * 4) + (solLines.length * 4) + 4;
        
        if (y + rowHeight > 275) { doc.addPage(); y = 20; }
        
        // Alternating row background
        if (i % 2 === 0) { doc.setFillColor(245, 245, 245); doc.rect(10, y, 190, rowHeight, 'F'); }
        
        doc.setTextColor(...black);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        
        // Date and Time
        const dateStr = t.dateDisplay ? t.dateDisplay.substring(0, 5) : ''; // Just DD/MM
        doc.text(`${dateStr} ${t.hora || ''}`, 14, y + 5.5);
        
        const endDateStr = t.data_fim ? t.data_fim.substring(0, 5) : '';
        doc.text(`${endDateStr} ${t.hora_fim || ''}`, 40, y + 5.5);
        
        doc.text(setor.substring(0, 25), 70, y + 5.5);
        doc.text(solicitante.substring(0, 25), 115, y + 5.5);
        doc.text(cat, 160, y + 5.5);
        
        doc.setTextColor(...darkGray);
        doc.text(descLines, 14, y + 11);
        doc.text(solLines, 14, y + 11 + (descLines.length * 4));
        
        y += rowHeight;
      });
    }

    // Footer
    doc.setDrawColor(...lightGray);
    doc.line(10, 285, 200, 285);
    doc.setTextColor(...darkGray);
    doc.setFontSize(8);
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

        <div className="space-y-3 mb-6">
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Conteúdo do Relatório</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-3 p-3 bg-surface2 border border-border rounded-xl cursor-pointer hover:border-green/30 transition-all">
              <input 
                type="checkbox" 
                checked={includeLogs} 
                onChange={(e) => setIncludeLogs(e.target.checked)}
                className="w-4 h-4 accent-green"
              />
              <span className="text-[0.85rem] font-medium text-text">Registros de Ponto</span>
            </label>
            <div className="flex flex-col gap-2 p-3 bg-surface2 border border-border rounded-xl transition-all">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={includeTickets} 
                  onChange={(e) => setIncludeTickets(e.target.checked)}
                  className="w-4 h-4 accent-green"
                />
                <span className="text-[0.85rem] font-medium text-text">Chamados de TI</span>
              </label>
              
              {includeTickets && (
                <div className="pl-7 pt-2 flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="ticketStatus" checked={ticketStatusFilter === 'all'} onChange={() => setTicketStatusFilter('all')} className="accent-green" />
                    <span className="text-[0.75rem] text-text-muted">Todos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="ticketStatus" checked={ticketStatusFilter === 'resolved'} onChange={() => setTicketStatusFilter('resolved')} className="accent-green" />
                    <span className="text-[0.75rem] text-text-muted">Apenas Resolvidos</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="ticketStatus" checked={ticketStatusFilter === 'open'} onChange={() => setTicketStatusFilter('open')} className="accent-green" />
                    <span className="text-[0.75rem] text-text-muted">Apenas Abertos</span>
                  </label>
                </div>
              )}
            </div>
          </div>
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
        {(includeLogs && filteredLogs.length > 0) || (includeTickets && filteredTickets.length > 0) ? (
          <div className="text-[0.82rem] text-text-dim leading-relaxed">
            <div className="mb-3">
              <strong className="text-text">{profile.name || '—'}</strong> · CPF {profile.cpf ? maskCPF(profile.cpf) : '—'}
              <br />
              <span className="text-text-muted">{profile.cargo || '—'}</span>
            </div>
            <div className="h-px bg-border my-4" />
            <p className="text-text-muted text-[0.75rem]">
              Inclui {includeLogs ? filteredLogs.length : 0} registros de ponto e {includeTickets ? filteredTickets.length : 0} chamados.
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-text-muted flex flex-col items-center gap-3 opacity-50">
            <FileText size={32} />
            <p className="text-[0.82rem]">Sem registros selecionados para {formatMonthLabel(selectedMonth)}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
