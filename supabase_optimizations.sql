-- ==========================================
-- VerdeIT Database Optimization Script
-- Execute this script in the Supabase SQL Editor
-- ==========================================

-- 1. Optimization for Tickets
-- Enhances the getTickets query, which filters by user_id and orders by created_at.
-- This compound index avoids full table scans when non-admins load their tickets.
CREATE INDEX IF NOT EXISTS idx_tickets_user_created_at ON public.tickets (user_id, created_at DESC);

-- Enhances the getActiveTickets query and the logic that links tickets to logs.
CREATE INDEX IF NOT EXISTS idx_tickets_user_active ON public.tickets (user_id, is_active);

-- Enhances getTicketsByEquipment 
CREATE INDEX IF NOT EXISTS idx_tickets_equipment ON public.tickets (equipment_id, created_at DESC);

-- 2. Optimization for Logs (Ponto)
-- Enhances the getLogs query.
CREATE INDEX IF NOT EXISTS idx_logs_user_created_at ON public.logs (user_id, created_at DESC);

-- 3. Optimization for Equipment
-- Enhances filtering by sector and assigned users, which happens heavily in loadUserData
CREATE INDEX IF NOT EXISTS idx_equipment_sector ON public.equipment (sector_id);
CREATE INDEX IF NOT EXISTS idx_equipment_assigned_user ON public.equipment (assigned_user_id);

-- 4. Optimization for Active Shifts
-- Quick lookups for users who have active shifts
CREATE INDEX IF NOT EXISTS idx_active_shifts_user ON public.active_shifts (user_id);

-- 5. Optimization for Maintenance Logs
-- Quick lookups by equipment
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_equip ON public.maintenance_logs (equipment_id, date DESC);

-- 6. Optimization for Equipment Movements
-- Heavy join operations run faster with these indices
CREATE INDEX IF NOT EXISTS idx_equip_movements_date ON public.equipment_movements (date DESC);
CREATE INDEX IF NOT EXISTS idx_equip_movements_equip_id ON public.equipment_movements (equipment_id);

-- 7. Statistics & Vacuum 
-- Run ANALYZE to update the query planner statistics so it uses the new indices immediately.
ANALYZE public.tickets;
ANALYZE public.logs;
ANALYZE public.equipment;
ANALYZE public.active_shifts;
