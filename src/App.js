import React from 'react';
import { ChakraProvider, Box } from '@chakra-ui/react';
import FileUploadComponent from './components/FileUploadComponent';
import './App.css';

function App() {
  return (
    <ChakraProvider>
      <Box className="App" p={5}>
        <FileUploadComponent />
      </Box>
    </ChakraProvider>
  );
}

export default App;
