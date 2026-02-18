import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Container, Box, Button } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';

const theme = createTheme({
  palette: { primary: { main: '#2563eb' }, secondary: { main: '#7c3aed' } },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>RAG PDF Platform</Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>RAG PDF Intelligence Platform</Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Production-ready document analysis with AI
        </Typography>
        <Button variant="contained" size="large" startIcon={<UploadIcon />}>
          Upload Documents
        </Button>
      </Container>
    </ThemeProvider>
  );
}

export default App;