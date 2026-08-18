import { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import PageShell from '../components/PageShell';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type Transaction = {
  id: number;
  user_id: number;
  user_name: string | null;
  user_email: string | null;
  rule_name: string | null;
  transaction_type: 'award' | 'spend' | 'revoke' | 'adjustment';
  source_scope: string;
  source_key: string | null;
  amount: number;
  balance_after: number;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
};

const typeLabels: Record<string, { label: string; color: 'success' | 'error' | 'warning' | 'info' }> = {
  award: { label: 'منح (+)', color: 'success' },
  spend: { label: 'إنفاق (-)', color: 'warning' },
  revoke: { label: 'سحب (-)', color: 'error' },
  adjustment: { label: 'تسوية', color: 'info' },
};

const scopeLabels: Record<string, string> = {
  prayer: 'صلاة / عبادة',
  theory: 'قسم نظري',
  practical: 'خطوة تطبيقية',
  daily_checkin: 'نشاط يومي',
  all_worships: 'إتمام عبادات اليوم',
  activity: 'نشاط عام',
  manual: 'إداري',
  system: 'نظامي',
};

export default function LightTransactionsPage() {
  const { session } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({
      limit: String(rowsPerPage),
      offset: String(page * rowsPerPage),
    });
    if (typeFilter) params.set('type', typeFilter);
    if (search) params.set('search', search);

    apiFetch<{ data: Transaction[]; total: number }>(`/light/admin/transactions?${params.toString()}`, {}, session?.accessToken)
      .then((res) => {
        setTransactions(res.data || []);
        setTotal(res.total || 0);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [session?.accessToken, page, rowsPerPage, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    load();
  };

  return (
    <PageShell title="سجل معاملات النور (Live Ledger)" subtitle="مراقبة ومتابعة كافة عمليات منح وإنفاق وتسوية النور لجميع المستخدمين">
      {error ? <Typography color="error.light" sx={{ mb: 2 }}>{error}</Typography> : null}

      <Paper sx={{ p: 2.5, mb: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ flex: 1, minWidth: 240 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="بحث باسم المستخدم، البريد، أو المصدر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Box>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>نوع العملية</InputLabel>
            <Select
              value={typeFilter}
              label="نوع العملية"
              onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            >
              <MenuItem value="">الكل</MenuItem>
              <MenuItem value="award">منح (+)</MenuItem>
              <MenuItem value="spend">إنفاق (-)</MenuItem>
              <MenuItem value="revoke">سحب (-)</MenuItem>
              <MenuItem value="adjustment">تسوية</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ p: 2.5 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>المستخدم</TableCell>
                <TableCell>المجال / المصدر</TableCell>
                <TableCell>النوع</TableCell>
                <TableCell>القيمة</TableCell>
                <TableCell>الرصيد بعدها</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell>التاريخ والوقت</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    {loading ? 'جارٍ تحميل المعاملات...' : 'لا توجد معاملات مطابقة.'}
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const typeInfo = typeLabels[tx.transaction_type] || { label: tx.transaction_type, color: 'info' };
                  return (
                    <TableRow key={tx.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700 }}>{tx.user_name || `مستخدم #${tx.user_id}`}</Typography>
                        <Typography variant="caption" color="text.secondary">{tx.user_email || ''}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>{tx.rule_name || scopeLabels[tx.source_scope] || tx.source_scope}</Typography>
                        {tx.source_key ? <Typography variant="caption" color="text.secondary">{tx.source_key}</Typography> : null}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={typeInfo.label} color={typeInfo.color} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800, color: tx.transaction_type === 'award' ? 'secondary.main' : 'warning.main' }}>
                        {tx.transaction_type === 'award' ? `+${tx.amount}` : `-${tx.amount}`} نور
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {tx.balance_after} نور
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={tx.status === 'completed' ? 'مكتملة' : tx.status}
                          color={tx.status === 'completed' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, color: 'text.secondary' }}>
                        {new Date(tx.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="عدد العناصر بالصفحة:"
          labelDisplayedRows={({ from, to, count }) => `${from}–${to} من ${count !== -1 ? count : `أكثر من ${to}`}`}
        />
      </Paper>
    </PageShell>
  );
}
