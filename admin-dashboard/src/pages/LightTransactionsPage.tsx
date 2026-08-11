import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import PageShell from '../components/PageShell';

const rows = [
  { id: 1, user: 'Amina', source: 'صلاة الفجر', amount: 10, type: 'award', status: 'completed', date: '2026-07-28 05:12', reason: 'Completed prayer on time' },
  { id: 2, user: 'Khalid', source: 'قراءة القرآن', amount: 15, type: 'award', status: 'completed', date: '2026-07-28 08:20', reason: 'Daily reading completed' },
];

export default function LightTransactionsPage() {
  return (
    <PageShell title="Light Transactions" subtitle="Review every light award, spending and adjustment">
      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.user}</TableCell>
                  <TableCell>{row.source}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>
                    <Chip label={row.status} color={row.status === 'completed' ? 'success' : 'warning'} size="small" />
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </PageShell>
  );
}
