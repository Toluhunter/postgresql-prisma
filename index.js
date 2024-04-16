const express = require('express');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Initialize express application and
// parse request body as JSON
const app = express();
app.use(express.json({ extended: true }));

// Create a new Prisma client instance
const prisma = new PrismaClient();

/**
 * Create a new contact
 */
app.post('/contacts', async (req, res) => {
    const { name, number } = req.body;
    try {
        const contact = await prisma.Contacts.create({
            data: {
                name,
                number,
            },
        });
        res.json(contact);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create contact' });
    }
});

/**
 * Get a specific contact
 */
app.get('/contacts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const contact = await prisma.Contacts.findUnique({
            where: {
                id: parseInt(id),
            },
        });
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get contact' });
    }
});

/**
 * Update a contact
 */
app.put('/contacts/:id', async (req, res) => {
    const { id } = req.params;
    const { name, number } = req.body;
    try {
        const contact = await prisma.Contacts.update({
            where: {
                id: parseInt(id),
            },
            data: {
                name,
                number,
            },
        });
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json(contact);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update contact' });
    }
});

/**
 * Delete a contact
 */
app.delete('/contacts/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const contact = await prisma.Contacts.delete({
            where: {
                id: parseInt(id),
            },
        });
        if (!contact) {
            return res.status(404).json({ error: 'Contact not found' });
        }
        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

// Connect to the database and start the server
prisma.$connect().then(() => {
    console.log('Prisma Connected');
    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });

})
