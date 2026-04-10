import React, { useState, useMemo } from 'react';
import { formatHours, formatMonthLabel, maskCPF } from '../lib/utils';
import { FileDown, Table, FileText, ShieldAlert, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Relatorio({ logs, tickets, profile }) {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'export'
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

  // BI Data Preparation
  const { pieCategory, pieStatus, barPriority, avgSlaHours } = useMemo(() => {
    const catMap = { 'hardware': 'Hardware', 'software': 'Software', 'network': 'Rede', 'printer': 'Impressora', 'other': 'Outros' };
    const prioMap = { 'low': 'Baixa', 'medium': 'Média', 'high': 'Alta', 'urgent': 'Urgente' };
    const statusMap = { 'open': 'Aberto', 'in_progress': 'Em Andamento', 'pending': 'Pendente', 'resolved': 'Resolvido', 'escalated': 'Escalado' };

    const catCount = {};
    const statusCount = {};
    const prioCount = {};
    let totalSlaMs = 0;
    let resolvedCount = 0;

    // Use all tickets for the selected month to build charts, regardless of the export filter
    const monthTickets = tickets.filter(t => t.date?.startsWith(selectedMonth));

    monthTickets.forEach(t => {
      const cat = catMap[t.category] || t.category || 'Outros';
      catCount[cat] = (catCount[cat] || 0) + 1;

      const stat = statusMap[t.status] || t.status || 'Outros';
      statusCount[stat] = (statusCount[stat] || 0) + 1;

      const prio = prioMap[t.priority] || t.priority || 'Outros';
      prioCount[prio] = (prioCount[prio] || 0) + 1;

      if (t.status === 'resolved' && t.created_at && t.resolved_at) {
        const diffMs = new Date(t.resolved_at) - new Date(t.created_at);
        totalSlaMs += diffMs;
        resolvedCount++;
      }
    });

    const pieCategory = Object.entries(catCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const pieStatus = Object.entries(statusCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const barPriority = Object.entries(prioCount).map(([name, Quantidade]) => ({ name, Quantidade })).sort((a, b) => b.Quantidade - a.Quantidade);
    
    const avgSlaHours = resolvedCount > 0 ? (totalSlaMs / resolvedCount) / (1000 * 60 * 60) : 0;

    return { pieCategory, pieStatus, barPriority, avgSlaHours };
  }, [tickets, selectedMonth]);

  const COLORS = ['#00C896', '#5BC4FF', '#FFB347', '#FF4D6D', '#A855F7', '#EAB308'];

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
        
        let dataFimFormatada = t.data_fim || '';
        if (dataFimFormatada.includes('-')) {
          const [year, month, day] = dataFimFormatada.split('-');
          dataFimFormatada = `${day}/${month}/${year}`;
        }

        csv += `"${typeStr}","${t.date_display || ''}","${t.hora || ''}","${dataFimFormatada}","${t.hora_fim || ''}","${sla}","${t.ref || ''}","${t.cliente || ''}","${t.requester || ''}","${cat}","${prio}","${desc}","${sol}","${stat}"\n`;
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
        const dateStr = t.date_display ? t.date_display.substring(0, 5) : ''; // Just DD/MM
        doc.text(`${dateStr} ${t.hora || ''}`, 14, y + 5.5);
        
        let endDateStr = '';
        if (t.data_fim) {
          if (t.data_fim.includes('-')) {
            const [year, month, day] = t.data_fim.split('-');
            endDateStr = `${day}/${month}`;
          } else {
            endDateStr = t.data_fim.substring(0, 5);
          }
        }
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-display font-bold">Relatórios e BI</h2>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 bg-surface border border-border p-1.5 rounded-xl">
            <label className="text-[0.7rem] font-bold text-text-muted uppercase pl-2">Mês:</label>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-surface2 border-none rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-green cursor-pointer"
            >
              {months.map(m => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
          </div>

          <div className="flex bg-surface2 p-1 rounded-xl border border-border">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-[0.85rem] font-medium transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-green text-bg shadow-lg' : 'text-text-muted hover:text-text'}`}
            >
              <BarChart3 size={16} /> Dashboard BI
            </button>
            <button 
              onClick={() => setActiveTab('export')}
              className={`px-4 py-1.5 rounded-lg text-[0.85rem] font-medium transition-all flex items-center gap-2 ${activeTab === 'export' ? 'bg-green text-bg shadow-lg' : 'text-text-muted hover:text-text'}`}
            >
              <FileDown size={16} /> Exportar
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-border p-5 rounded-3xl relative overflow-hidden group">
              <div className="text-[0.65rem] font-bold text-text-muted uppercase mb-1">Horas Trabalhadas</div>
              <div className="text-3xl font-bold text-blue-500">{formatHours(totalH)}</div>
              <div className="text-[0.7rem] text-text-dim mt-1">{filteredLogs.length} dias registrados</div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <PieChartIcon size={80} />
              </div>
            </div>
            <div className="bg-surface border border-border p-5 rounded-3xl relative overflow-hidden group">
              <div className="text-[0.65rem] font-bold text-text-muted uppercase mb-1">Chamados no Mês</div>
              <div className="text-3xl font-bold text-purple-500">{tickets.filter(t => t.date?.startsWith(selectedMonth)).length}</div>
              <div className="text-[0.7rem] text-text-dim mt-1">Total de tickets criados</div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BarChart3 size={80} />
              </div>
            </div>
            <div className="bg-surface border border-border p-5 rounded-3xl relative overflow-hidden group">
              <div className="text-[0.65rem] font-bold text-text-muted uppercase mb-1">Taxa de Resolução</div>
              <div className="text-3xl font-bold text-green">
                {tickets.filter(t => t.date?.startsWith(selectedMonth)).length > 0 
                  ? Math.round((tickets.filter(t => t.date?.startsWith(selectedMonth) && t.status === 'resolved').length / tickets.filter(t => t.date?.startsWith(selectedMonth)).length) * 100) 
                  : 0}%
              </div>
              <div className="text-[0.7rem] text-text-dim mt-1">Tickets finalizados</div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <PieChartIcon size={80} />
              </div>
            </div>
            <div className="bg-surface border border-border p-5 rounded-3xl relative overflow-hidden group">
              <div className="text-[0.65rem] font-bold text-text-muted uppercase mb-1">Tempo Médio (SLA)</div>
              <div className="text-3xl font-bold text-orange-500">
                {avgSlaHours > 0 ? `${Math.floor(avgSlaHours)}h ${Math.round((avgSlaHours % 1) * 60)}m` : '—'}
              </div>
              <div className="text-[0.7rem] text-text-dim mt-1">Para resolução</div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BarChart3 size={80} />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-3xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim mb-6">Chamados por Categoria</h3>
              <div className="h-[250px] w-full">
                {pieCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {pieCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                      <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-text-muted text-sm">Sem dados neste mês</div>}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-3xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim mb-6">Chamados por Status</h3>
              <div className="h-[250px] w-full">
                {pieStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {pieStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                      <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-text-muted text-sm">Sem dados neste mês</div>}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-3xl p-6 lg:col-span-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim mb-6">Chamados por Prioridade</h3>
              <div className="h-[250px] w-full">
                {barPriority.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barPriority} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                      <Bar dataKey="Quantidade" fill="#5BC4FF" radius={[4, 4, 0, 0]} maxBarSize={50}>
                        {barPriority.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.name === 'Urgente' ? '#FF4D6D' : 
                            entry.name === 'Alta' ? '#FFB347' : 
                            entry.name === 'Média' ? '#EAB308' : '#00C896'
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div className="flex items-center justify-center h-full text-text-muted text-sm">Sem dados neste mês</div>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-surface border border-border2 rounded-3xl p-6 shadow-[0_0_30px_rgba(0,200,150,0.07)]">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim mb-4">Exportar Dados</h3>
            <p className="text-[0.8rem] text-text-muted mb-6">Selecione os dados que deseja incluir no relatório exportado.</p>
            
            <div className="space-y-4 mb-8">
              <label className="flex items-center gap-3 p-4 bg-surface2 border border-border rounded-2xl cursor-pointer hover:border-green/30 transition-all">
                <input 
                  type="checkbox" 
                  checked={includeLogs} 
                  onChange={(e) => setIncludeLogs(e.target.checked)}
                  className="w-5 h-5 accent-green"
                />
                <span className="text-[0.9rem] font-medium text-text">Registros de Ponto</span>
              </label>
              <div className="flex flex-col gap-3 p-4 bg-surface2 border border-border rounded-2xl transition-all">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeTickets} 
                    onChange={(e) => setIncludeTickets(e.target.checked)}
                    className="w-5 h-5 accent-green"
                  />
                  <span className="text-[0.9rem] font-medium text-text">Chamados de TI</span>
                </label>
                
                {includeTickets && (
                  <div className="pl-8 pt-2 flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="ticketStatus" checked={ticketStatusFilter === 'all'} onChange={() => setTicketStatusFilter('all')} className="accent-green" />
                      <span className="text-[0.8rem] text-text-muted">Todos</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="ticketStatus" checked={ticketStatusFilter === 'resolved'} onChange={() => setTicketStatusFilter('resolved')} className="accent-green" />
                      <span className="text-[0.8rem] text-text-muted">Apenas Resolvidos</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="ticketStatus" checked={ticketStatusFilter === 'open'} onChange={() => setTicketStatusFilter('open')} className="accent-green" />
                      <span className="text-[0.8rem] text-text-muted">Apenas Abertos</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={exportPDF}
                className="bg-green text-bg font-bold text-[0.9rem] p-4 rounded-xl shadow-[0_4px_20px_rgba(0,200,150,0.3)] hover:bg-green-dim transition-all flex items-center justify-center gap-2"
              >
                <FileDown size={20} /> Baixar PDF
              </button>
              <button 
                onClick={exportCSV}
                className="bg-surface border border-border text-text-dim font-bold text-[0.9rem] p-4 rounded-xl hover:border-border2 hover:text-text hover:bg-surface2 transition-all flex items-center justify-center gap-2"
              >
                <Table size={20} /> Baixar CSV
              </button>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-3xl p-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-dim mb-4">Pré-visualização do Relatório</h3>
            {(includeLogs && filteredLogs.length > 0) || (includeTickets && filteredTickets.length > 0) ? (
              <div className="bg-surface2 rounded-2xl p-6 border border-border">
                <div className="mb-4">
                  <strong className="text-text text-lg block mb-1">{profile.name || '—'}</strong>
                  <span className="text-text-muted text-sm">CPF: {profile.cpf ? maskCPF(profile.cpf) : '—'}</span>
                  <br />
                  <span className="text-text-muted text-sm">Cargo: {profile.cargo || '—'}</span>
                </div>
                <div className="h-px bg-border my-4" />
                <div className="space-y-2">
                  <p className="text-text-dim text-sm flex justify-between">
                    <span>Mês de Referência:</span>
                    <strong className="text-text">{formatMonthLabel(selectedMonth)}</strong>
                  </p>
                  <p className="text-text-dim text-sm flex justify-between">
                    <span>Registros de Ponto:</span>
                    <strong className="text-text">{includeLogs ? filteredLogs.length : 0}</strong>
                  </p>
                  <p className="text-text-dim text-sm flex justify-between">
                    <span>Chamados:</span>
                    <strong className="text-text">{includeTickets ? filteredTickets.length : 0}</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-text-muted flex flex-col items-center gap-4 opacity-50 bg-surface2 rounded-2xl border border-border border-dashed">
                <FileText size={48} />
                <p className="text-sm">Sem registros selecionados para {formatMonthLabel(selectedMonth)}.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
