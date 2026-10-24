require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// * Please DO NOT INCLUDE the private app access token in your repo. Don't do this practicum in your normal account.
const PRIVATE_APP_ACCESS = process.env.HUBSPOT_ACCESS_TOKEN;

// TODO: ROUTE 1 - Create a new app.get route for the homepage to call your custom object data. Pass this data along to the front-end and create a new pug template in the views folder.

// * Code for Route 1 goes here
app.get('/', async (req, res) => {
    const title = 'Plants | Integrating With HubSpot I Practicum';
    if (!PRIVATE_APP_ACCESS) {
        return res.status(500).render('homepage', {
            title, data: [], error: 'Set HUBSPOT_ACCESS_TOKEN in your local .env file and restart the server.'
        });
    }

    try {
        const data = [];
        let after;
        // Follow pagination so the table includes every Plant record.
        do {
            const response = await axios.get('https://api.hubapi.com/crm/v3/objects/2-283906898', {
                headers: { Authorization: `Bearer ${PRIVATE_APP_ACCESS}` },
                params: { properties: 'name,species,location', limit: 100, after },
                timeout: 15000
            });
            data.push(...response.data.results);
            after = response.data.paging?.next?.after;
        } while (after !== undefined && after !== null);

        res.render('homepage', { title, data });
    } catch (error) {
        console.error('Plant retrieval failed. HubSpot status:', error.response?.status || 'unavailable');
        res.status(502).render('homepage', {
            title, data: [], error: 'Unable to load plants. Check your token, permissions, and connection.'
        });
    }
});

// TODO: ROUTE 2 - Create a new app.get route for the form to create or update new custom object data. Send this data along in the next route.

// * Code for Route 2 goes here
app.get('/update-cobj', (req, res) => {
    res.render('updates', {
        title: 'Update Custom Object Form | Integrating With HubSpot I Practicum'
    });
});

// TODO: ROUTE 3 - Create a new app.post route for the custom objects form to create or update your custom object data. Once executed, redirect the user to the homepage.

// * Code for Route 3 goes here
app.post('/update-cobj', async (req, res) => {
    const properties = {};
    for (const field of ['name', 'species', 'location']) {
        properties[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : '';
    }

    if (Object.values(properties).some(value => !value)) {
        return res.status(400).send('Name, species, and location are required. Return to the form and complete all fields.');
    }
    if (!PRIVATE_APP_ACCESS) {
        return res.status(500).send('Set HUBSPOT_ACCESS_TOKEN in your local .env file and restart the server.');
    }

    try {
        await axios.post('https://api.hubapi.com/crm/v3/objects/2-283906898', {
            properties
        }, {
            headers: {
                Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
        res.redirect(303, '/');
    } catch (error) {
        // Log only the status: Axios error objects may contain the access token.
        console.error('Plant creation failed. HubSpot status:', error.response?.status || 'unavailable');
        res.status(502).send('Unable to save the plant. Check your token, permissions, and connection. Check HubSpot before retrying to avoid a duplicate.');
    }
});

/** 
* * This is sample code to give you a reference for how you should structure your calls. 

* * App.get sample
app.get('/contacts', async (req, res) => {
    const contacts = 'https://api.hubspot.com/crm/v3/objects/contacts';
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    }
    try {
        const resp = await axios.get(contacts, { headers });
        const data = resp.data.results;
        res.render('contacts', { title: 'Contacts | HubSpot APIs', data });      
    } catch (error) {
        console.error(error);
    }
});

* * App.post sample
app.post('/update', async (req, res) => {
    const update = {
        properties: {
            "favorite_book": req.body.newVal
        }
    }

    const email = req.query.email;
    const updateContact = `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try { 
        await axios.patch(updateContact, update, { headers } );
        res.redirect('back');
    } catch(err) {
        console.error(err);
    }

});
*/


// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));
