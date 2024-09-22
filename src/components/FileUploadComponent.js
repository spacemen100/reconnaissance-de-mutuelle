import React, { useState, useEffect } from 'react';
import { Button, FormControl, FormLabel, Input, VStack, Box, Heading, Text, useToast, SimpleGrid, Spinner, Progress } from '@chakra-ui/react';
import Tesseract from 'tesseract.js';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY || 'your_api_key_here',
  dangerouslyAllowBrowser: true,
});

const FileUploadComponent: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const toast = useToast();
  const [mutuelleInfo, setMutuelleInfo] = useState<any>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setProgress(25);
    }
  };

  const extractInfoWithGroq = async (text: string): Promise<any> => {
    const prompt = `Identifie les informations suivantes dans ce texte de carte mutuelle : "${text}"
      - Nom de la mutuelle
      - Nom du réseau de soins partenaire
      - Catégorie de la mutuelle
      - Numéro de télétransmission
      - Numéro AMC
      - Informations adhérents et ayants droit
      - Période de validité de la carte
      - Actes bénéficiant du tiers-payant
      - Coordonnées de la mutuelle
      IMPORTANT: Renvoie uniquement un objet JSON valide :
      {
        "nomMutuelle": "Nom",
        "reseauSoin": "Réseau",
        "categorieMutuelle": "Catégorie",
        "numeroTeletransmission": "Numéro",
        "numeroAMC": "Numéro",
        "infoAdherents": "Informations",
        "periodeValidite": "Période",
        "actesTiersPayant": "Actes",
        "coordonneesMutuelle": "Coordonnées"
      }`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
    });

    const completion = response.choices[0]?.message?.content?.trim();
    console.log('Réponse brute de Groq pour les infos mutuelle:', completion);

    if (completion) {
      const jsonStartIndex = completion.indexOf('{');
      const jsonEndIndex = completion.lastIndexOf('}');
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        const jsonString = completion.slice(jsonStartIndex, jsonEndIndex + 1);
        try {
          const parsed = JSON.parse(jsonString);
          console.log('Objet JSON extrait:', parsed);
          return parsed;
        } catch (error) {
          console.error('Erreur de parsing JSON :', error);
        }
      }
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast({
        title: 'Erreur',
        description: 'Aucun fichier sélectionné.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    setProgress(50);

    try {
      const result = await Tesseract.recognize(selectedFile, 'fra');
      setExtractedText(result.data.text);
      setProgress(75);

      const infoResult = await extractInfoWithGroq(result.data.text);
      if (infoResult) {
        setMutuelleInfo(infoResult);
      }

      toast({
        title: 'Traitement terminé',
        description: 'Les informations ont été extraites avec succès.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur lors du traitement :', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du traitement.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <Box p={6} borderWidth="1px" borderRadius="lg" boxShadow="lg" maxWidth="xxl" mx="auto" mt={10}>
      <Heading mb={4} textAlign="center">Ajouter votre carte mutuelle</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl>
            <FormLabel htmlFor="fileInput">Sélectionnez une image de la carte mutuelle</FormLabel>
            <Input type="file" id="fileInput" onChange={handleFileChange} accept="image/*" display="none" />
            <Button as="label" htmlFor="fileInput" colorScheme="blue" variant="solid" cursor="pointer">
              Sélectionner une image 📁
            </Button>
          </FormControl>

          <Button type="submit" colorScheme="blue" width="full" disabled={loading}>
            {loading ? (
              <><Spinner size="sm" mr={2} /> Traitement en cours...🚀</>
            ) : (
              'Analyser la carte mutuelle 💡'
            )}
          </Button>
          <Progress hasStripe value={progress} width="full" />

          {mutuelleInfo && (
            <Box borderWidth="1px" borderRadius="lg" p={4} width="full" mt={4}>
              <Heading size="md" mb={2}>Informations de la mutuelle :</Heading>
              <Text>Nom de la mutuelle: {mutuelleInfo.nomMutuelle}</Text>
              <Text>Réseau de soins partenaire: {mutuelleInfo.reseauSoin}</Text>
              <Text>Catégorie de la mutuelle: {mutuelleInfo.categorieMutuelle}</Text>
              <Text>Numéro de télétransmission: {mutuelleInfo.numeroTeletransmission}</Text>
              <Text>Numéro AMC: {mutuelleInfo.numeroAMC}</Text>
              <Text>Informations adhérents: {mutuelleInfo.infoAdherents}</Text>
              <Text>Période de validité: {mutuelleInfo.periodeValidite}</Text>
              <Text>Actes bénéficiant du tiers-payant: {mutuelleInfo.actesTiersPayant}</Text>
              <Text>Coordonnées de la mutuelle: {mutuelleInfo.coordonneesMutuelle}</Text>
            </Box>
          )}
        </VStack>
      </form>
    </Box>
  );
};

export default FileUploadComponent;
