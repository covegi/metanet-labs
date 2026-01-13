import React, { useState, useEffect } from 'react'
import {
    Container, 
    Typography, 
    Button,
    Box,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel
 } from '@mui/material'
import { createCard, loadCards, redeemCard, updateCardHistory, CardData } from './CardManager'
import Footer from './utils/footer'

interface CardForm {
    name: string,
    description: string,
    rarity: string,
    ability: string,
    history: string,
    sats: number | null
}

const App: React.FC = () => {
    const [cardAttributes, setCardAttributes] = useState<CardForm>({
        name: "",
        description: "",
        rarity: "",
        ability: "",
        history: "",
        sats: 0
    })
    const [cards, setCards] = useState<CardData[]>([])
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        fetchCards()
    }, [])

    const fetchCards = async () => {
        setLoading(true)
        try {
            const loadedCards = await loadCards()
            setCards(loadedCards)
        } catch (error) {
            console.error('Failed to load cards:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCard = async () => {
        if (!cardAttributes.name || !cardAttributes.description ||
            !cardAttributes.rarity || !cardAttributes.ability ||
            !cardAttributes.sats || cardAttributes.sats <= 0) {
                alert("Please fill all fields and ensure sats > 0")
                return
            }
        
        try {
            await createCard(cardAttributes as CardData)
            setCardAttributes({
                name: "", 
                description: "", 
                rarity: "",
                ability: "", 
                history: "", 
                sats: 0
            })
            await fetchCards()
            alert("Card created and card(s) fetched!")
        } catch (error) {
            alert('Failed to create card')
        }
        
    }

    const handleRedeem = async (card: CardData) => {
        try {
            await redeemCard(card)
            await fetchCards()
            alert("Card redeemed!")
        } catch (error) {
            alert('Failed to redeem card')
        }
    }

    const handleUpdateCardHistory = async (card: CardData, newEntry: string) => {
        try {
            await updateCardHistory(card, newEntry)
            await fetchCards()
            alert("History updated!")
        } catch (error) {
            alert("Failed to update history")
        }
    }

  return (
    <>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Lab L-8: Collectible Card Creator
        </Typography>
        <Box sx={{ mt: 4 }}>
          <TextField
            fullWidth
            label="Card Name"
            value={cardAttributes.name}
            onChange={(event) => setCardAttributes({
                ...cardAttributes,
                name: event.target.value
            })}
            sx={{ mb: 2 }}
          />

          <TextField 
            fullWidth
            label="Card description"
            multiline
            rows={3}
            value={cardAttributes.description}
            onChange={(event) => setCardAttributes({
                ...cardAttributes,
                description: event.target.value
            })}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Rarity</InputLabel>
            <Select
                value={cardAttributes.rarity}
                label="Rarity"
                onChange={(event) => setCardAttributes({
                    ...cardAttributes,
                    rarity: event.target.value
                })}
            >
                <MenuItem value="common">Common</MenuItem>
                <MenuItem value="rare">Rare</MenuItem>
                <MenuItem value="epic">Epic</MenuItem>
                <MenuItem value="legendary">Legendary</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Ability"
            value={cardAttributes.ability}
            onChange={(e) => setCardAttributes({
                ...cardAttributes,
                ability: e.target.value
            })}
            sx={{ mb: 2 }}
            />

          <TextField
            fullWidth
            label="History"
            multiline
            rows={2}
            value={cardAttributes.history}
            onChange={(e) => setCardAttributes({
                ...cardAttributes,
                history: e.target.value
            })}
            sx={{ mb: 2 }}
            />

          <TextField
            fullWidth
            label="Satoshis"
            type="number"
            value={cardAttributes.sats || ''}
            onChange={(e) => setCardAttributes({
                ...cardAttributes,
                sats: parseInt(e.target.value) || 0
            })}
            sx={{ mb: 2 }}
            />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleCreateCard}
            sx={{ mb: 2 }}
          >
            Create Card
          </Button>

          <Box sx={{ mt: 4 }}>
            {loading ? (
                <Typography>Loading cards...</Typography>
            ) : cards.length === 0 ? (
            <Typography>No cards yet. Create one!</Typography>
            ) : (
                cards.map((card, index) => (
                    <Box
                        key={index}
                        sx={{
                            mb: 2,
                            p: 2,
                            border: "1px solid gray",
                            borderRadius: 2
                        }}
                    >
                    <Typography variant="h6">{card.name}</Typography>
                    <Typography>Description: {card.description}</Typography>
                    <Typography>Rarity: {card.rarity}</Typography>
                    <Typography>Ability: {card.ability}</Typography>
                    <Typography sx={{ whiteSpace: "pre-line"}}>History: {card.history}</Typography>
                    <Typography>Sats: {card.sats}</Typography>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleRedeem(card)}
                        sx={{ mt: 1 }}
                    >
                        Redeem
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                            const newEntry = prompt("Enter history update:")
                            if (newEntry) handleUpdateCardHistory(card, newEntry)
                        }}
                        sx={{ mt: 1, ml: 1 }}
                    >
                        Update History
                    </Button>
                    </Box>
                ))
                
            )}
          </Box>
          </Box>
      </Container>
      <Footer />
    </>
  )
}

export default App